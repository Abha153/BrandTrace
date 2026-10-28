// Evaluates the REAL checker (src/server/checker.ts) against the demo-workspace rules.
//   npm run eval:checker      -> writes evaluation/checker_report.md
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getDatabase, seedDemoWorkspace } from '../src/server/db.ts';
import { runDynamicRules } from '../src/server/checker.ts';

const root = path.resolve(import.meta.dirname, '..');
const db = getDatabase(path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bt-eval-')), 'eval.db'));
seedDemoWorkspace(db, true);

type Row = { id: string; text: string; expected: string[] };
const overlap = (a: [number, number], b: [number, number]) => a[0] < b[1] && b[0] < a[1];

function run(rows: Row[]) {
  let tp = 0, fp = 0, fn = 0, cleanTotal = 0, cleanFlagged = 0; const misses: string[] = [], falseAlarms: string[] = [];
  for (const r of rows) {
    const found = runDynamicRules(db, 'demo', r.text);
    const exp = r.expected.map((q) => { const s = r.text.toLowerCase().indexOf(q.toLowerCase()); return [s, s + q.length] as [number, number]; });
    const used = new Set<number>(); let matched = 0;
    for (const f of found) {
      const i = exp.findIndex((e, k) => !used.has(k) && overlap([f.start, f.end], e));
      if (i >= 0) { used.add(i); matched++; } else fp++;
    }
    tp += matched; fn += exp.length - matched;
    if (exp.length === 0) { cleanTotal++; if (found.length) { cleanFlagged++; falseAlarms.push(r.id); } }
    if (exp.length - matched > 0) misses.push(r.id);
    if (found.length > matched && exp.length > 0) falseAlarms.push(r.id);
  }
  const p = tp + fp ? tp / (tp + fp) : NaN, rc = tp + fn ? tp / (tp + fn) : NaN;
  return { tp, fp, fn, p, rc, f1: 2 * p * rc / (p + rc), cleanTotal, cleanFlagged, misses, falseAlarms };
}

const held = JSON.parse(fs.readFileSync(path.join(root, 'evaluation/heldout_drafts.json'), 'utf8')).drafts as Row[];
const old = (JSON.parse(fs.readFileSync(path.join(root, 'evaluation/synthetic_drafts.json'), 'utf8')) as any[]);
// The original 50 drafts have draft-level labels only: score whether the draft is flagged at all.
let dtp = 0, dfp = 0, dfn = 0, dtn = 0;
for (const d of old) { const flagged = runDynamicRules(db, 'demo', d.text).length > 0; if (flagged && d.expected_violation) dtp++; else if (flagged) dfp++; else if (d.expected_violation) dfn++; else dtn++; }
const h = run(held); const pc = (x: number) => (x * 100).toFixed(1) + '%';
const md = `# Evaluation of the real checker (src/server/checker.ts)

| Set | Level | Precision | Recall | F1 | Notes |
|---|---|---|---|---|---|
| Held-out (30 drafts, never used for tuning) | finding spans | ${pc(h.p)} (${h.tp}/${h.tp + h.fp}) | ${pc(h.rc)} (${h.tp}/${h.tp + h.fn}) | ${pc(h.f1)} | clean drafts falsely flagged: ${h.cleanFlagged}/${h.cleanTotal} |
| Original synthetic (50 drafts, used while improving rules) | whole draft flagged | ${pc(dtp / (dtp + dfp))} (${dtp}/${dtp + dfp}) | ${pc(dtp / (dtp + dfn))} (${dtp}/${dtp + dfn}) | ${pc(2 * dtp / (2 * dtp + dfp + dfn))} | optimistic: not independent |

Held-out drafts with missed findings: ${h.misses.join(', ') || 'none'}. Drafts with false alarms: ${[...new Set(h.falseAlarms)].join(', ') || 'none'}.

Synthetic data, one annotator, demo-workspace rules only. These figures do not estimate accuracy on real marketing copy.
`;
fs.writeFileSync(path.join(root, 'evaluation/checker_report.md'), md); console.log(md);
