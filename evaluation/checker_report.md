# Evaluation of the real checker (src/server/checker.ts)

| Set | Level | Precision | Recall | F1 | Notes |
|---|---|---|---|---|---|
| Held-out (30 drafts, never used for tuning) | finding spans | 100.0% (21/21) | 91.3% (21/23) | 95.5% | clean drafts falsely flagged: 0/10 |
| Original synthetic (50 drafts, used while improving rules) | whole draft flagged | 100.0% (28/28) | 100.0% (28/28) | 100.0% | optimistic: not independent |

Held-out drafts with missed findings: v06, v20. Drafts with false alarms: none.

Synthetic data, one annotator, demo-workspace rules only. These figures do not estimate accuracy on real marketing copy.
