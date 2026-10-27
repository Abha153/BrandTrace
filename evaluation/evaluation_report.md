# BrandTrace AI - Synthetic Evaluation Report

> **Important Disclosure**: These are synthetic evaluation results run across a 50-example curated benchmark. They measure deterministic pattern coverage and normalization under controlled conditions, **not real-world accuracy** across open web distributions.

## 1. Executive Summary

- **Total Labelled Drafts**: 50
- **Categories Covered**:
  - Clean content (10 drafts)
  - Prohibited terminology (10 drafts)
  - Incorrect pricing (10 drafts)
  - Valid pricing (10 drafts)
  - Tricky edge cases & false positive lures (10 drafts)

## 2. Before-and-After Comparison

| Metric | Baseline Engine | Improved Engine (Stage 3) | Change (Raw / %) |
| :--- | :--- | :--- | :--- |
| **True Positives (TP)** | 16 | 28 | +12 |
| **False Positives (FP)** | 2 | 0 | -2 |
| **False Negatives (FN)** | 12 | 0 | -12 |
| **True Negatives (TN)** | 20 | 22 | +2 |
| **Precision** | **88.89%** (16/18) | **100.00%** (28/28) | **+11.11%** |
| **Recall** | **57.14%** (16/28) | **100.00%** (28/28) | **+42.86%** |
| **F1 Score** | **69.57%** | **100.00%** | **+30.43%** |
| **Overall Accuracy** | **72.00%** | **100.00%** | **+28.00%** |

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
