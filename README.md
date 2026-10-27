# BrandTrace AI - Brand Compliance & Intelligence Platform

BrandTrace AI is a full-stack brand governance and compliance verification platform. It audits marketing copy, press releases, social media drafts, and customer reviews against company brand guidelines, pricing sheets, voice guides, and approved claim registers.

---

## 🌟 Key Features

### 1. Dynamic Brand Kit (SQLite Powered)
- **Custom Brand Rules**: Configure prohibited product names, approved replacements, tier pricing, tone/hype restrictions, and required claims without code changes.
- **Approved Reference Sources**: Register company guideline documents, section excerpts, and claim registers as ground-truth evidence.
- **Instant Propagation**: Modifications in the Brand Kit immediately take effect on all subsequent copy reviews.
- **CSV & JSON Import**: Atomic imports with live preview, row limits (max 100), required-field validation, and duplicate detection.
- **1-Click Demo Workspace**: Instant one-click reset to pristine demo sample data.

### 2. High-Precision Deterministic Engine (Stage 3 Improvements)
- **Normalisation**: Handles Unicode typography quotes, Unicode dashes/hyphens (`–`, `—`, `−`), and whitespace collapsing.
- **Conservative Fuzzy Matching**: Detects single-character typos on long terms (e.g. *BrandTrace Suit* -> *BrandTrace Suite*) and flags them as actionable warnings.
- **Flexible Currency & Price Parsing**:
  - USD formats: `$39/month`, `$39 a month`, `39 USD per month`, `$ 39 / mo`
  - INR formats: `Rs 3,200`, `₹3,200`, `INR 3,200`, `Rs. 3200`
- **Context-Aware Attribution**: Isolates clauses to prevent false positives when copy mentions third-party plugins or enterprise tiers alongside standard pricing.

### 3. Repeatable Synthetic Evaluation Benchmark (50 Drafts)
Includes a 50-example synthetic benchmark covering clean content, prohibited terms, incorrect prices, valid prices, and edge cases.
- **Baseline Precision**: 88.89% (16/18) | **Recall**: 57.14% (16/28) | **F1**: 69.57%
- **Improved Precision**: **100.00%** (28/28) | **Recall**: **100.00%** (28/28) | **F1**: **100.00%**
*(Note: These are synthetic benchmark metrics under controlled conditions, not real-world open-web accuracy.)*

### 4. Basic Safety & Privacy
- **Delete My Data**: One-click complete deletion of workspace rules, sources, reviews, and history.
- **Shared Demo Protection**: Prevents accidental deletion of shared sample seeds in the default demo workspace.
- **Rate Limiting**: In-memory hourly request cap (clearly documented as resetting on server restart).
- **Request Size Limiting**: 2MB body limit protecting against payload denial-of-service.
- **Safe Logging**: Full drafts and upstream API keys are never output to public stdout.

### 5. Document Upload (TXT, DOCX, Text PDF)
- Drag-and-drop or file selection in Audit Studio.
- Extracts text safely (< 5MB limit) and previews full text before running compliance review.

---

## 🚀 Quick Start

### Installation & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Server runs on http://localhost:3000
```

### Running the Evaluation Benchmark
```bash
python3 scripts/evaluate_dataset.py
```
Outputs are recorded in `evaluation/evaluation_report.md`, `evaluation/baseline_results.json`, and `evaluation/improved_results.json`.

---

## ☁️ Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions for deploying to **Render**, **Railway**, or **Vercel**.
- **Free Tier SQLite Notice**: Free container hosts use ephemeral filesystems. Unmounted SQLite files will reset to seed data when containers spin down or restart. Attach a persistent volume for durable multi-day storage.
