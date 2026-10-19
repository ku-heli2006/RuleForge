# API contract (`/api/v1`)

Responses use the frontend's existing unwrapped JSON shapes. Errors include `message`, `statusCode`, `errorCode`, and `timestamp`.

| Method and path | Body | Result |
|---|---|---|
| `GET /health` | — | `HealthStatus` |
| `GET /rulesets` | — | `Ruleset[]` |
| `POST /rulesets` | `{name, description, initialRules?}` | `Ruleset` draft |
| `GET /rulesets/{id}` | — | `Ruleset` |
| `PUT /rulesets/{id}` | `{name?, description?, rules?, status?}` | Updated draft; `status: PUBLISHED` publishes, `status: DRAFT` duplicates a published version first |
| `GET /rulesets/{id}/versions` | — | `RulesetVersion[]` |
| `GET /rulesets/{id}/versions/{version}` | — | Ruleset content for that immutable version |
| `POST /rulesets/{id}/versions/{version}/duplicate` | — | New editable draft from immutable version |
| `POST /rulesets/{id}/validate` | `{rules?}` | `RuleValidationResponse` |
| `POST /rulesets/{id}/publish` | — | Immutable published version |
| `POST /rulesets/{id}/evaluate` | `{version?, input}` | `EvaluationResult` |
| `POST /rulesets/{id}/verify` | `{version?, options?}` (also accepts `checks[]` and `versionId`) | Z3 findings, witnesses, summary, run ID |
| `POST /rulesets/{id}/counterfactual` | `{version?, originalInput, targetOutcome, maxSearchCost?}` | Counterfactual explanations |
| `POST /backtests` | `{rulesetId, baselineVersion, candidateVersion, datasetId, segmentFilters?}` | Completed `BacktestJob` |
| `GET /backtests/{id}` | — | Stored `BacktestJob` |
| `GET /backtests/{id}/export` | — | CSV attachment |

The backtest API currently exposes only `ds-q3-prod-historical`, which is a deterministic synthetic demo dataset, not production history. A backtest's `estimatedFinancialImpact` means the change in modeled discount payout based on order amount; it is not a profit estimate. Priority numbers ascend in strength (1 wins before 2) to match the frontend sample rules. Evaluation and counterfactual use `version`; verification accepts both the frontend's optional `version` and the original prompt's `versionId`. `PUT` with `status: DRAFT` on a published ruleset duplicates its current version into a new draft, keeping the published version immutable. The current ruleset listing returns an array for frontend compatibility; pagination is not implemented yet.
