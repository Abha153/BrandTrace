# Check API

Checks a draft against a workspace's rules. **Rules only: no LLM is called and the draft is not stored.**

## Get a key (server admin)
```bash
curl -X POST https://YOUR-HOST/api/admin/api-keys -H "content-type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" -d '{"workspace_id":"my-brand","label":"ci"}'
```
The key (`bt_...`) is shown once; only its SHA-256 hash is stored. Revoke with
`DELETE /api/admin/api-keys/:id?workspace_id=my-brand`.

## Check a draft
```bash
curl -X POST https://YOUR-HOST/api/v1/check -H "content-type: application/json" \
  -H "Authorization: Bearer $BRANDTRACE_KEY" -d '{"draft":"Our standard tier is $39/month."}'
```
Response fields: `passed` (`true`, `false`, or `null` when the workspace has **no rules** and nothing was checked),
`finding_count`, `findings[]` (category, severity, quote, start, end, explanation, suggestion, source),
`source_warnings[]` (expired or soon-to-expire sources), `llm_used: false`, `stored: false`.
Limits: 60 requests per minute per key (in memory, resets on restart); drafts up to 20,000 characters.

## Example GitHub Action (untested example)
```yaml
- name: Brand check
  run: |
    RESULT=$(curl -s -X POST "$BRANDTRACE_URL/api/v1/check" -H "content-type: application/json" \
      -H "Authorization: Bearer ${{ secrets.BRANDTRACE_KEY }}" \
      -d "$(jq -n --rawfile d content/post.md '{draft:$d}')")
    echo "$RESULT" | jq .
    [ "$(echo "$RESULT" | jq .passed)" = "true" ]
```

## Source expiry
`PUT /api/sources/:id/dates` with `{"effective_from":"2026-01-01","expires_on":"2026-12-31"}` (YYYY-MM-DD or null);
`GET /api/sources/expiring` lists expired sources and those expiring within 30 days. Expiry is reported as a warning;
it does not yet stop a rule from being enforced.
