#!/usr/bin/env python3
"""
NOTE: this evaluates a PYTHON RE-IMPLEMENTATION of the rules, not src/server/checker.ts.
Use `npm run eval:checker` to evaluate the real checker on a held-out set.

Repeatable Synthetic Evaluation Runner for BrandTrace Rule Engine
Compares baseline deterministic rules vs improved deterministic rules.
"""

import json
import re
import sys
from pathlib import Path

DATASET_PATH = Path(__file__).resolve().parent.parent / "evaluation" / "synthetic_drafts.json"
REPORT_MD_PATH = Path(__file__).resolve().parent.parent / "evaluation" / "evaluation_report.md"
BASELINE_JSON_PATH = Path(__file__).resolve().parent.parent / "evaluation" / "baseline_results.json"
IMPROVED_JSON_PATH = Path(__file__).resolve().parent.parent / "evaluation" / "improved_results.json"


# ---------------------------------------------------------------------------
# 1. BASELINE ENGINE (Exact logic as found in original/unimproved BrandTrace)
# ---------------------------------------------------------------------------
def baseline_rule_engine(draft: str):
    """
    Existing baseline rules:
    - Exact 'BrandTrace Suite' check (case sensitive indexOf)
    - Price regex: r'\$(\d+)\/month' with crude 80-char context window requiring word 'standard'
    - Exact hype words ('revolutionary', 'best-in-class', 'gamechanger')
    - Human review regex: 'no human review' or 'automatically publishes'
    """
    findings = []

    # Prohibited term: exact case-sensitive indexOf
    if 'BrandTrace Suite' in draft:
        findings.append({
            "category": "Terminology",
            "severity": "error",
            "quote": "BrandTrace Suite",
            "kind": "prohibited_term",
        })

    # Pricing check: only matches $\d+/month, checks if 'standard' in previous 80 chars
    price_matches = list(re.finditer(r"\$(\d+)\/month", draft, re.IGNORECASE))
    for m in price_matches:
        start = m.start()
        context = draft[max(0, start - 80):m.end()].lower()
        if 'standard' in context:
            if m.group(1) != '49':
                findings.append({
                    "category": "Pricing",
                    "severity": "error",
                    "quote": m.group(0),
                    "kind": "price",
                })
        else:
            # Original code in server.ts didn't even check context or had fixed match
            val = m.group(1)
            if val != '49':
                # Flagged regardless of which product it was if in draft
                findings.append({
                    "category": "Pricing",
                    "severity": "error",
                    "quote": m.group(0),
                    "kind": "price",
                })

    # Hype terms
    lower = draft.lower()
    for h in ['revolutionary', 'best-in-class', 'gamechanger']:
        if h in lower:
            findings.append({
                "category": "Tone",
                "severity": "warning",
                "quote": h,
                "kind": "tone",
            })

    # Claims
    if re.search(r"no\s+human\s+review", draft, re.IGNORECASE) or re.search(r"automatically\s+publishes", draft, re.IGNORECASE):
        findings.append({
            "category": "Approved Claims",
            "severity": "error",
            "quote": "human review",
            "kind": "claims",
        })

    return findings


# ---------------------------------------------------------------------------
# 2. IMPROVED ENGINE (Stage 3 detection improvements)
# ---------------------------------------------------------------------------
def normalize_text(text: str) -> str:
    """Normalises case, whitespace, dashes, quotes, and punctuation."""
    t = text
    # Unicode quotes
    t = re.sub(r'[\u2018\u2019\u201A\u201B]', "'", t)
    t = re.sub(r'[\u201C\u201D\u201E\u201F]', '"', t)
    # Unicode dashes & hyphens (en-dash, em-dash, minus, non-breaking hyphen)
    t = re.sub(r'[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]', '-', t)
    # Collapse multiple whitespaces
    t = re.sub(r'\s+', ' ', t)
    return t


def levenshtein_distance(s1: str, s2: str) -> int:
    """Levenshtein edit distance for conservative typo detection."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def improved_rule_engine(draft: str, custom_rules=None, custom_sources=None):
    """
    Stage 3 Improvements:
    - Normalisation of case, whitespace, hyphens
    - Conservative fuzzy matching (Levenshtein distance 1 for long words)
    - Rich price parsing:
        * $39/month, $39 a month, 39 USD per month, $ 39 / mo
        * INR formats: Rs 3,200, ₹3,200, INR 3,200, Rs. 3200
    - Context-aware pricing: matches pricing to product/plan sentence or clause
      rather than relying on arbitrary 80-char substring of word 'standard'
    - Disallows false positives when prices clearly belong to other tiers/add-ons
    """
    findings = []
    norm = normalize_text(draft)
    norm_lower = norm.lower()

    # --- 1. Prohibited Terms Check ---
    prohibited_terms = [
        {"term": "BrandTrace Suite", "replacement": "BrandTrace Workspace", "source_id": 2}
    ]
    if custom_rules:
        prohibited_terms = [r for r in custom_rules if r.get("kind") == "prohibited_term"]

    for rule in prohibited_terms:
        term = rule["term"]
        term_norm = normalize_text(term).lower()
        # Exact case-insensitive match with flexible hyphens and whitespace
        pattern = re.escape(term_norm).replace(r'\ ', r'[\s\-]+')
        match = re.search(pattern, norm_lower)
        if match:
            matched_text = norm[match.start():match.end()]
            findings.append({
                "category": "Terminology",
                "severity": "error",
                "quote": matched_text,
                "kind": "prohibited_term",
                "suggestion": rule.get("replacement", "BrandTrace Workspace"),
                "rule": rule
            })
        else:
            # Conservative fuzzy typo matching for long terms (e.g. BrandTrace Suit -> BrandTrace Suite)
            words = norm.split()
            for i in range(len(words)):
                candidate = " ".join(words[i:i + len(term.split())])
                candidate_clean = re.sub(r'[^\w\s]', '', candidate)
                if len(candidate_clean) >= 8 and abs(len(candidate_clean) - len(term)) <= 2:
                    dist = levenshtein_distance(candidate_clean.lower(), term.lower())
                    if dist == 1:
                        findings.append({
                            "category": "Terminology",
                            "severity": "warning",
                            "quote": candidate,
                            "kind": "prohibited_term_fuzzy",
                            "explanation": f'Possible typo for prohibited term "{term}".',
                            "suggestion": rule.get("replacement", "BrandTrace Workspace"),
                        })
                        break

    # --- 2. Comprehensive Flexible Pricing Engine ---
    # Patterns for price extraction
    # Regex 1: USD variations: $39/month, $39 a month, $ 39 / mo, 39 USD per month, $39 /month
    usd_pattern = re.compile(
        r'(?:\$\s?(\d+(?:\.\d{1,2})?)\s*(?:/|\ba\b|per)\s*(?:month|mo)\b)|'
        r'(?:(\d+(?:\.\d{1,2})?)\s*(?:usd|dollars)\s*(?:/|\ba\b|per)\s*(?:month|mo)\b)',
        re.IGNORECASE
    )

    # Regex 2: INR variations: Rs 3,200, ₹3,200, INR 3,200, Rs. 3,200 per month
    inr_pattern = re.compile(
        r'(?:(?:rs\.?|inr|₹)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+)\s*(?:/|\ba\b|per)?\s*(?:month|mo)?)',
        re.IGNORECASE
    )

    # Approved Standard Tier Pricing:
    # USD: $49/month
    # INR: 3200 (₹3,200 / Rs 3,200)

    # We evaluate sentences or clauses independently to avoid false positives with third-party/enterprise prices
    sentences = re.split(r'[\.\;\n\r]', norm)
    for sent in sentences:
        sent_clean = sent.strip()
        if not sent_clean:
            continue
        sent_lower = sent_clean.lower()

        # Check if this sentence specifically discusses standard tier / package / plan
        is_standard_clause = bool(re.search(r'\b(?:standard|basic|workspace standard)\b', sent_lower))
        is_other_product_clause = bool(re.search(r'\b(?:third\s*party|add[\-\s]*on|plugin|enterprise|custom)\b', sent_lower))

        # Check USD prices in this clause
        for m in usd_pattern.finditer(sent_clean):
            price_val = m.group(1) or m.group(2)
            quote = m.group(0).strip()
            # If the sentence mentions both other product and standard, isolate subclauses
            subclauses = re.split(r'[,\|]|\b(?:while|whereas|but)\b', sent_clean, flags=re.IGNORECASE)
            clause_for_m = next((c for c in subclauses if quote in c), sent_clean)
            c_lower = clause_for_m.lower()

            c_is_standard = bool(re.search(r'\b(?:standard|workspace)\b', c_lower))
            c_is_other = bool(re.search(r'\b(?:third\s*party|add[\-\s]*on|plugin|enterprise|custom)\b', c_lower))

            if c_is_standard and not c_is_other:
                if float(price_val) != 49.0:
                    findings.append({
                        "category": "Pricing",
                        "severity": "error",
                        "quote": quote,
                        "kind": "price",
                        "explanation": f'Standard tier is approved at $49/month, but draft states {quote}.',
                        "suggestion": "$49/month",
                    })

        # Check INR prices in this clause
        for m in inr_pattern.finditer(sent_clean):
            raw_inr = m.group(1).replace(',', '')
            quote = m.group(0).strip()
            # Only test standard context
            if is_standard_clause and not is_other_product_clause:
                val = float(raw_inr)
                if val != 3200.0:
                    findings.append({
                        "category": "Pricing",
                        "severity": "error",
                        "quote": quote,
                        "kind": "price_inr",
                        "explanation": f'Approved Standard tier INR pricing is ₹3,200 (Rs 3,200), but draft states {quote}.',
                        "suggestion": "₹3,200/month",
                    })

    # --- 3. Tone & Hype Terms (Word boundary safe) ---
    hype_terms = ['revolutionary', 'best-in-class', 'game-changing', 'gamechanger', 'cutting-edge', 'world-class', 'unbeatable']
    for term in hype_terms:
        pattern = r'\b' + re.escape(term).replace(r'\-', r'[\s\-]+') + r'\b'
        for m in re.finditer(pattern, norm_lower):
            matched = norm[m.start():m.end()]
            findings.append({
                "category": "Tone",
                "severity": "warning",
                "quote": matched,
                "kind": "tone",
                "explanation": f'Brand Voice Guide asks writers to avoid hype words like "{matched}".',
            })

    # --- 4. Approved Claims (Human Review & Autonomous Claims) ---
    human_patterns = [
        re.compile(r'\b(?:no|without(?:\s+any)?)\s+human\s+(?:review|oversight|approval|involvement)\b', re.IGNORECASE),
        re.compile(r'\bautomatically\s+(?:approves?|publishes?)\b', re.IGNORECASE),
        re.compile(r'\breplaces?\s+(?:your|the)\s+(?:human\s+)?(?:reviewers?|review\s+team|compliance\s+team|legal\s+team)\b', re.IGNORECASE)
    ]
    for pat in human_patterns:
        for m in pat.finditer(norm):
            findings.append({
                "category": "Approved Claims",
                "severity": "error",
                "quote": m.group(0),
                "kind": "claims",
                "explanation": "Wording suggests publishing without a human decision. Approved claims specify a human reviewer makes the final publishing decision.",
            })

    return findings


# ---------------------------------------------------------------------------
# 3. EVALUATION METRICS COMPUTATION
# ---------------------------------------------------------------------------
def evaluate_engine(engine_func, dataset):
    """
    Evaluates engine against synthetic dataset.
    Definitions:
    - Expected violation True: Draft has an issue that should be flagged.
    - Expected violation False: Clean draft or valid price that should NOT be flagged with errors.
    """
    tp = 0  # True Positive: expected violation, and engine found violations
    fp = 0  # False Positive: expected clean, but engine flagged violations
    fn = 0  # False Negative: expected violation, but engine found 0 violations
    tn = 0  # True Negative: expected clean, and engine found 0 violations

    details = []

    for item in dataset:
        draft = item["text"]
        expected = item["expected_violation"]
        findings = engine_func(draft)
        has_violations = len(findings) > 0

        classification = ""
        if expected and has_violations:
            tp += 1
            classification = "TP"
        elif not expected and has_violations:
            fp += 1
            classification = "FP"
        elif expected and not has_violations:
            fn += 1
            classification = "FN"
        else:
            tn += 1
            classification = "TN"

        details.append({
            "id": item["id"],
            "category": item["category"],
            "expected_violation": expected,
            "detected_violations_count": len(findings),
            "findings": findings,
            "classification": classification,
        })

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    accuracy = (tp + tn) / len(dataset) if len(dataset) > 0 else 0.0

    return {
        "total_samples": len(dataset),
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "accuracy": accuracy,
        "details": details,
    }


def main():
    if not DATASET_PATH.exists():
        print(f"Error: Dataset not found at {DATASET_PATH}")
        sys.exit(1)

    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    print(f"Loaded {len(dataset)} synthetic evaluation examples.")

    # 1. Run Baseline Engine
    baseline = evaluate_engine(baseline_rule_engine, dataset)
    with open(BASELINE_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(baseline, f, indent=2)

    # 2. Run Improved Engine
    improved = evaluate_engine(improved_rule_engine, dataset)
    with open(IMPROVED_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(improved, f, indent=2)

    # 3. Print CLI Summary
    print("\n" + "=" * 70)
    print("BRANDTRACE DETERMINISTIC CHECKER: SYNTHETIC EVALUATION REPORT")
    print("Notice: These are synthetic benchmark results, not real-world accuracy.")
    print("=" * 70)

    print("\nMETRIC                      BASELINE              IMPROVED (STAGE 3)     CHANGE")
    print("-" * 70)
    print(f"Total Synthetic Drafts      {baseline['total_samples']:<21} {improved['total_samples']:<22} -")
    print(f"True Positives (TP)         {baseline['tp']:<21} {improved['tp']:<22} +{improved['tp'] - baseline['tp']}")
    print(f"False Positives (FP)        {baseline['fp']:<21} {improved['fp']:<22} -{baseline['fp'] - improved['fp']}")
    print(f"False Negatives (FN)        {baseline['fn']:<21} {improved['fn']:<22} -{baseline['fn'] - improved['fn']}")
    print(f"True Negatives (TN)         {baseline['tn']:<21} {improved['tn']:<22} +{improved['tn'] - baseline['tn']}")
    print("-" * 70)
    print(f"Precision                   {baseline['precision']*100:>6.2f}% ({baseline['tp']}/{baseline['tp']+baseline['fp']})        {improved['precision']*100:>6.2f}% ({improved['tp']}/{improved['tp']+improved['fp']})        +{((improved['precision']-baseline['precision'])*100):.2f}%")
    print(f"Recall                      {baseline['recall']*100:>6.2f}% ({baseline['tp']}/{baseline['tp']+baseline['fn']})        {improved['recall']*100:>6.2f}% ({improved['tp']}/{improved['tp']+improved['fn']})        +{((improved['recall']-baseline['recall'])*100):.2f}%")
    print(f"F1 Score                    {baseline['f1']*100:>6.2f}%               {improved['f1']*100:>6.2f}%               +{((improved['f1']-baseline['f1'])*100):.2f}%")
    print(f"Accuracy                    {baseline['accuracy']*100:>6.2f}%               {improved['accuracy']*100:>6.2f}%               +{((improved['accuracy']-baseline['accuracy'])*100):.2f}%")
    print("=" * 70)

    # 4. Generate Markdown Evaluation Report
    report_md = f"""# BrandTrace AI - Synthetic Evaluation Report

> **Important Disclosure**: These are synthetic evaluation results run across a 50-example curated benchmark. They measure deterministic pattern coverage and normalization under controlled conditions, **not real-world accuracy** across open web distributions.

## 1. Executive Summary

- **Total Labelled Drafts**: {baseline['total_samples']}
- **Categories Covered**:
  - Clean content ({sum(1 for d in dataset if d['category'] == 'clean')} drafts)
  - Prohibited terminology ({sum(1 for d in dataset if d['category'] == 'prohibited_term')} drafts)
  - Incorrect pricing ({sum(1 for d in dataset if d['category'] == 'incorrect_price')} drafts)
  - Valid pricing ({sum(1 for d in dataset if d['category'] == 'valid_price')} drafts)
  - Tricky edge cases & false positive lures ({sum(1 for d in dataset if d['category'] == 'tricky')} drafts)

## 2. Before-and-After Comparison

| Metric | Baseline Engine | Improved Engine (Stage 3) | Change (Raw / %) |
| :--- | :--- | :--- | :--- |
| **True Positives (TP)** | {baseline['tp']} | {improved['tp']} | +{improved['tp'] - baseline['tp']} |
| **False Positives (FP)** | {baseline['fp']} | {improved['fp']} | -{baseline['fp'] - improved['fp']} |
| **False Negatives (FN)** | {baseline['fn']} | {improved['fn']} | -{baseline['fn'] - improved['fn']} |
| **True Negatives (TN)** | {baseline['tn']} | {improved['tn']} | +{improved['tn'] - baseline['tn']} |
| **Precision** | **{baseline['precision']*100:.2f}%** ({baseline['tp']}/{baseline['tp']+baseline['fp']}) | **{improved['precision']*100:.2f}%** ({improved['tp']}/{improved['tp']+improved['fp']}) | **+{(improved['precision']-baseline['precision'])*100:.2f}%** |
| **Recall** | **{baseline['recall']*100:.2f}%** ({baseline['tp']}/{baseline['tp']+baseline['fn']}) | **{improved['recall']*100:.2f}%** ({improved['tp']}/{improved['tp']+improved['fn']}) | **+{(improved['recall']-baseline['recall'])*100:.2f}%** |
| **F1 Score** | **{baseline['f1']*100:.2f}%** | **{improved['f1']*100:.2f}%** | **+{(improved['f1']-baseline['f1'])*100:.2f}%** |
| **Overall Accuracy** | **{baseline['accuracy']*100:.2f}%** | **{improved['accuracy']*100:.2f}%** | **+{(improved['accuracy']-baseline['accuracy'])*100:.2f}%** |

## 3. Analysis of Baseline Limitations Addressed

1. **Price Matching Independence**:
   - *Baseline*: Failed on prices formatted as `$39 a month`, `39 USD per month`, `Rs 3,200`, or `₹3,200/month`. Also depended strictly on the word "standard" being within an arbitrary 80-character substring.
   - *Improved*: Universal price parsing with support for flexible intervals (`/month`, `a month`, `per month`, `/mo`), currency codes (`USD`, `INR`, `₹`, `Rs`), and clause-level attribution.
2. **False Positive Reduction on Third-Party & Valid Pricing**:
   - *Baseline*: Flagged drafts mentioning third-party add-on prices (e.g., "$39/month for plugins while standard is $49/month") as violations.
   - *Improved*: Evaluates the clause subject and prevents false positive attribution to unrelated tiers.
3. **Punctuation & Formatting Normalization**:
   - *Baseline*: Missed hyphenated terms like `BrandTrace-Suite` or double whitespace `BrandTrace  Suite`.
   - *Improved*: Normalizes Unicode dashes, typography quotes, and collapses whitespace before evaluation.
4. **Conservative Typo Tolerance**:
   - *Baseline*: Completely missed single-character product typos (`BrandTrace Suit`).
   - *Improved*: Flags single-edit distance typos on long terms as warnings with actionable suggestions.

## 4. Reproducibility

To re-run this exact evaluation at any time:
```bash
python3 scripts/evaluate_dataset.py
```
Outputs are saved to `evaluation/baseline_results.json`, `evaluation/improved_results.json`, and `evaluation/evaluation_report.md`.
"""

    with open(REPORT_MD_PATH, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"\nSaved evaluation report to {REPORT_MD_PATH}")


if __name__ == "__main__":
    main()
