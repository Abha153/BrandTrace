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

### 3. Evaluation (synthetic data, read the caveats)

Two evaluations exist, and they measure different things:

- **Real checker, held-out set** (`npm run eval:checker`, report in `evaluation/checker_report.md`): runs the shipped
  `src/server/checker.ts` on 30 synthetic drafts that were **not** used to tune the rules. Latest run: precision
  100% (21/21), recall 91.3% (21/23), 0 of 10 clean drafts falsely flagged. The two misses are a price written as
  "USD 45 a month" and the hype variant "game-changing".
- **Original 50-draft benchmark** (`npm run eval`): scores a **Python re-implementation** of the rules
  (`scripts/evaluate_dataset.py`), not the TypeScript code, and the rules were improved while looking at these same
  drafts. Its 100% is therefore not independent evidence. The drafts are also scored on the real checker in the report above.

All data is synthetic, written by one annotator, and covers only the fictional demo-workspace rules. These figures
do **not** estimate accuracy on real marketing copy, and **no result exists yet for the LLM analysis**.

### 4. Basic Safety & Privacy
- **Delete My Data**: One-click complete deletion of workspace rules, sources, reviews, and history.
- **Shared Demo Protection**: Prevents accidental deletion of shared sample seeds in the default demo workspace.
- **Rate Limiting**: global in-memory hourly cap on AI calls (default 30, set `LLM_MAX_CALLS_PER_HOUR`); it is shared by all visitors and resets on restart. There is no per-user limit yet.
- **Locked-down configuration**: `POST /api/config` and `/api/test-connection` need `ADMIN_TOKEN` (header `x-admin-token`); with no token they are disabled in production. API keys are never returned, and API keys are only sent to allow-listed https hosts (extend with `ALLOWED_LLM_HOSTS`).
- **CORS**: same-origin only unless `CORS_ORIGINS` lists exact origins.
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

## Known limitations
- Reviews are stored in a JSON file, not SQLite, and are not scoped per workspace; on Render's free tier they are lost on restart.
- The workspace id is chosen by the client: it separates demo data but is not authentication.
- Keyword-fallback analysis has no sentiment model; voice and visibility scores are `null` unless an AI provider returns them.
- Gemini model availability and your API key have not been verified by the maintainer's tests; use "Test connection" after deploying.
- No automated test covers the HTTP routes or the React UI yet.

## ☁️ Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions for deploying to **Render**, **Railway**, or **Vercel**.
- **Free Tier SQLite Notice**: Free container hosts use ephemeral filesystems. Unmounted SQLite files will reset to seed data when containers spin down or restart. Attach a persistent volume for durable multi-day storage.
