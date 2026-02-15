# Productboard CLI — Research & Development Plan

## 1) Executive Summary

Build a public, production-grade Productboard CLI (`pb`) as a standalone open-source project under `benmillerat`, with:

- **Full Productboard API coverage** (v1 stable + v2 beta namespace)
- Human-friendly commands (`pb features list`) and script-friendly output (`--output json`)
- Strong auth/config UX (keychain-backed token storage + profile support)
- Reliable distribution (npm, Homebrew, signed binaries)
- CI-enforced coverage guarantees against upstream OpenAPI specs

---

## 2) Market / Gap Research (what exists today)

## Findings

### GitHub
- GitHub repository search for Productboard CLI variants (`productboard-cli`, `productboard cli`, `productboard command line`) returns **no dedicated, maintained Productboard CLI project**.
- Most related repos are:
  - MCP servers
  - SDKs/libraries
  - workflow/integration wrappers

### npm ecosystem
- npm search results for Productboard are dominated by:
  - MCP packages (`productboard-mcp`, forks, variants)
  - integration adapters (`@pipedream/productboard`, etc.)
  - no obvious canonical `productboard-cli` package
- `npm view productboard-cli` => **404 Not Found**

## Gap confirmation
There is a clear opportunity for a **first-class standalone CLI** focused on direct human/API workflows (not MCP/runtime-specific tooling).

---

## 3) Productboard API Surface Research

## Official docs analyzed
- v1 docs root: `https://developer.productboard.com/reference/introduction`
- v1 OpenAPI: `https://developer.productboard.com/openapi/publicswagger.yaml`
- v2 docs root: `https://developer.productboard.com/v2.0.0/reference/glossary`
- v2 OpenAPI files:
  - `.../v2.0.0/openapi/notes.yaml`
  - `.../v2.0.0/openapi/pm-entities.yaml`
  - `.../v2.0.0/openapi/analytics-api.yaml`

## API operation counts

### v1 (stable)
- **119 operations** across **63 paths**
- Tag groups:
  - Notes (15)
  - Companies & Users (18)
  - Product Hierarchy (22)
  - Custom Fields (6)
  - Releases & Release Groups (13)
  - Objectives (11)
  - Key Results (5)
  - Initiatives (11)
  - Plugin Integrations (10)
  - JIRA Integrations (4)
  - Webhooks (4)

### v2 (beta)
- **24 operations total**
  - Notes API: 11
  - PM Entities API: 12
  - Analytics API: 1

---

## 4) Existing MCPB Server Coverage Analysis

Source reviewed: `projects/productboard-mcpb/server/index.js` (2,658 lines)

## What exists now
- 40 MCP tools
- Strong reusable logic patterns:
  - centralized HTTP + auth header handling
  - pagination helpers (`links.next`, cursor-based notes)
  - consistent API error normalization
  - practical request shape normalization and guardrails

## Coverage against v1 OpenAPI
- Current MCP operation coverage is approximately **39/119 v1 operations** (~33%)
- Strong on core entities (features/notes/objectives/initiatives/releases basics)
- Largely missing:
  - company fields + field values lifecycle
  - full notes ecosystem (tags/followers/feedback forms)
  - plugin integrations
  - Jira integrations
  - webhooks
  - multiple link deletion operations

This MCP codebase is still an excellent seed for:
- auth, retries, error model, pagination behavior
- request payload ergonomics

---

## 5) Architecture Decision

## Recommended stack
**TypeScript + Node.js + oclif**

### Why this choice
1. **Max reuse path** from existing JS MCP implementation patterns
2. Mature CLI ecosystem (autocompletion, command docs, plugin support)
3. Excellent OpenAPI tooling in TS for generation + compile-time safety
4. Easy npm publishing, plus feasible native-binary packaging

### Key dependencies
- CLI framework: `oclif`
- HTTP: native `fetch` (Node 20+)
- Validation: `zod`
- Output formatting: `cli-table3` + JSON/YAML serializers
- Config/keychain: `conf` + `keytar`
- OpenAPI typing/gen: `openapi-typescript` (+ custom generator scripts)
- Tests: `vitest`, `nock`, snapshot tests

---

## 6) Proposed Repository Structure

```text
productboard-cli/
  src/
    index.ts                     # oclif entrypoint
    core/
      auth.ts                    # token resolution, keychain access
      config.ts                  # profiles, defaults, global flags
      http.ts                    # retries, rate limits, headers, error mapping
      pagination.ts              # links.next + cursor strategies
      output.ts                  # table/json/yaml/ndjson/quiet
      errors.ts                  # normalized user-facing errors
      openapi-registry.ts        # generated op registry (method/path/params)
    commands/
      auth/*
      companies/*
      users/*
      notes/*
      features/*
      components/*
      products/*
      custom-fields/*
      releases/*
      objectives/*
      key-results/*
      initiatives/*
      plugin-integrations/*
      jira-integrations/*
      webhooks/*
      v2/*
      api/call.ts                # escape hatch raw endpoint execution
  scripts/
    fetch-openapi.ts
    generate-registry.ts
    generate-command-docs.ts
    verify-coverage.ts
  test/
    unit/
    integration/
    e2e/
  docs/
    COMMANDS.md
    AUTH.md
    OUTPUT.md
```

---

## 7) Auth + Config Design

## Token sources (precedence)
1. `--token` flag (one-shot)
2. `PRODUCTBOARD_API_TOKEN` env
3. Active profile token in OS keychain

## Config file (non-secret)
- Path: `~/.config/productboard-cli/config.json`
- Stores:
  - active profile
  - output defaults
  - timeout/retry defaults
  - API version preference

## Keychain storage (secret)
- macOS Keychain / Windows Credential Manager / libsecret on Linux
- Service namespace: `com.benmillerat.productboard-cli`

## Auth commands
- `pb auth login`
- `pb auth status`
- `pb auth whoami`
- `pb auth logout`
- `pb auth profiles list|use|create|delete`

---

## 8) UX and Output Contract

## Global flags
- `--profile <name>`
- `--output table|json|yaml|ndjson`
- `--quiet`
- `--select <jmespath-like expr>`
- `--page-limit <n>` / `--all`
- `--no-color`
- `--verbose`
- `--dry-run` (for mutation previews where practical)

## Output behavior
- Default human mode: readable table/summary
- Script mode:
  - `--output json` gives stable machine JSON
  - `--quiet` prints only primary IDs or scalar response

---

## 9) Full Command Reference (every command/subcommand)

Notes:
- Default namespace is **v1 stable**.
- Deprecated API variants are exposed with explicit `legacy` command names.
- v2 beta is isolated under `pb v2 ...`.

## 9.1 Auth / utility
- `pb auth login`
- `pb auth logout`
- `pb auth status`
- `pb auth whoami` *(connectivity + identity check)*
- `pb auth profiles list`
- `pb auth profiles create`
- `pb auth profiles use`
- `pb auth profiles delete`
- `pb api call <METHOD> <PATH>` *(raw escape hatch)*

## 9.2 Companies & Users (v1)

### Companies
- `pb companies list` → GET `/companies`
- `pb companies create` → POST `/companies`
- `pb companies get` → GET `/companies/{id}`
- `pb companies update` → PATCH `/companies/{id}`
- `pb companies delete` → DELETE `/companies/{id}`

### Company fields
- `pb companies fields list` → GET `/companies/custom-fields`
- `pb companies fields create` → POST `/companies/custom-fields`
- `pb companies fields get` → GET `/companies/custom-fields/{id}`
- `pb companies fields update` → PATCH `/companies/custom-fields/{id}`
- `pb companies fields delete` → DELETE `/companies/custom-fields/{id}`

### Company field values
- `pb companies field-values get` → GET `/companies/{companyId}/custom-fields/{companyCustomFieldId}/value`
- `pb companies field-values set` → PUT `/companies/{companyId}/custom-fields/{companyCustomFieldId}/value`
- `pb companies field-values delete` → DELETE `/companies/{companyId}/custom-fields/{companyCustomFieldId}/value`

### Users
- `pb users list` → GET `/users`
- `pb users create` → POST `/users`
- `pb users get` → GET `/users/{id}`
- `pb users update` → PATCH `/users/{id}`
- `pb users delete` → DELETE `/users/{id}`

## 9.3 Product Hierarchy (v1)

### Features
- `pb features list` → GET `/features`
- `pb features create` → POST `/features`
- `pb features get` → GET `/features/{id}`
- `pb features update` → PATCH `/features/{id}`
- `pb features update-legacy` → PUT `/features/{id}` *(deprecated upstream)*
- `pb features delete` → DELETE `/features/{id}`

### Feature links: initiatives
- `pb features links initiatives list` → GET `/features/{id}/links/initiatives`
- `pb features links initiatives add` → POST `/features/{id}/links/initiatives/{initiativeId}`
- `pb features links initiatives remove` → DELETE `/features/{id}/links/initiatives/{initiativeId}`

### Feature links: objectives
- `pb features links objectives list` → GET `/features/{id}/links/objectives`
- `pb features links objectives add` → POST `/features/{id}/links/objectives/{objectiveId}`
- `pb features links objectives remove` → DELETE `/features/{id}/links/objectives/{objectiveId}`

### Components
- `pb components list` → GET `/components`
- `pb components create` → POST `/components`
- `pb components get` → GET `/components/{id}`
- `pb components update` → PATCH `/components/{id}`
- `pb components update-legacy` → PUT `/components/{id}` *(deprecated upstream)*

### Products
- `pb products list` → GET `/products`
- `pb products get` → GET `/products/{id}`
- `pb products update` → PATCH `/products/{id}`
- `pb products update-legacy` → PUT `/products/{id}` *(deprecated upstream)*

### Feature statuses
- `pb feature-statuses list` → GET `/feature-statuses`

## 9.4 Custom Fields (hierarchy entities, v1)
- `pb custom-fields list` → GET `/hierarchy-entities/custom-fields`
- `pb custom-fields get` → GET `/hierarchy-entities/custom-fields/{id}`
- `pb custom-fields values list` → GET `/hierarchy-entities/custom-fields-values`
- `pb custom-fields values get` → GET `/hierarchy-entities/custom-fields-values/value`
- `pb custom-fields values set` → PUT `/hierarchy-entities/custom-fields-values/value`
- `pb custom-fields values delete` → DELETE `/hierarchy-entities/custom-fields-values/value`

## 9.5 Releases & Release Groups (v1)

### Release groups
- `pb release-groups list` → GET `/release-groups`
- `pb release-groups create` → POST `/release-groups`
- `pb release-groups get` → GET `/release-groups/{id}`
- `pb release-groups update` → PATCH `/release-groups/{id}`
- `pb release-groups delete` → DELETE `/release-groups/{id}`

### Releases
- `pb releases list` → GET `/releases`
- `pb releases create` → POST `/releases`
- `pb releases get` → GET `/releases/{id}`
- `pb releases update` → PATCH `/releases/{id}`
- `pb releases delete` → DELETE `/releases/{id}`

### Feature release assignments
- `pb feature-release-assignments list` → GET `/feature-release-assignments`
- `pb feature-release-assignments get` → GET `/feature-release-assignments/assignment`
- `pb feature-release-assignments set` → PUT `/feature-release-assignments/assignment`

## 9.6 Objectives (v1)
- `pb objectives list` → GET `/objectives`
- `pb objectives create` → POST `/objectives`
- `pb objectives get` → GET `/objectives/{id}`
- `pb objectives update` → PATCH `/objectives/{id}`
- `pb objectives delete` → DELETE `/objectives/{id}`

### Objective links: features
- `pb objectives links features list` → GET `/objectives/{id}/links/features`
- `pb objectives links features add` → POST `/objectives/{id}/links/features/{featureId}`
- `pb objectives links features remove` → DELETE `/objectives/{id}/links/features/{featureId}`

### Objective links: initiatives
- `pb objectives links initiatives list` → GET `/objectives/{id}/links/initiatives`
- `pb objectives links initiatives add` → POST `/objectives/{id}/links/initiatives/{initiativeId}`
- `pb objectives links initiatives remove` → DELETE `/objectives/{id}/links/initiatives/{initiativeId}`

## 9.7 Key Results (v1)
- `pb key-results list` → GET `/key-results`
- `pb key-results create` → POST `/key-results`
- `pb key-results get` → GET `/key-results/{id}`
- `pb key-results update` → PATCH `/key-results/{id}`
- `pb key-results delete` → DELETE `/key-results/{id}`

## 9.8 Initiatives (v1)
- `pb initiatives list` → GET `/initiatives`
- `pb initiatives create` → POST `/initiatives`
- `pb initiatives get` → GET `/initiatives/{id}`
- `pb initiatives update` → PATCH `/initiatives/{id}`
- `pb initiatives delete` → DELETE `/initiatives/{id}`

### Initiative links: features
- `pb initiatives links features list` → GET `/initiatives/{id}/links/features`
- `pb initiatives links features add` → POST `/initiatives/{id}/links/features/{featureId}`
- `pb initiatives links features remove` → DELETE `/initiatives/{id}/links/features/{featureId}`

### Initiative links: objectives
- `pb initiatives links objectives list` → GET `/initiatives/{id}/links/objectives`
- `pb initiatives links objectives add` → POST `/initiatives/{id}/links/objectives/{objectiveId}`
- `pb initiatives links objectives remove` → DELETE `/initiatives/{id}/links/objectives/{objectiveId}`

## 9.9 Notes + feedback forms (v1)

### Notes
- `pb notes list` → GET `/notes`
- `pb notes create` → POST `/notes`
- `pb notes get` → GET `/notes/{id}`
- `pb notes update` → PATCH `/notes/{id}`
- `pb notes delete` → DELETE `/notes/{id}`

### Note links
- `pb notes links list` → GET `/notes/{noteId}/links`
- `pb notes links add` → POST `/notes/{noteId}/links/{entityId}`

### Note tags
- `pb notes tags list` → GET `/notes/{noteId}/tags`
- `pb notes tags add` → POST `/notes/{noteId}/tags/{tagName}`
- `pb notes tags remove` → DELETE `/notes/{noteId}/tags/{tagName}`

### Note followers
- `pb notes followers add-bulk` → POST `/notes/{noteId}/user-followers`
- `pb notes followers remove` → DELETE `/notes/{noteId}/user-followers/{email}`

### Feedback forms
- `pb feedback-configurations list` → GET `/feedback-form-configurations`
- `pb feedback-configurations get` → GET `/feedback-form-configurations/{id}`
- `pb feedback-forms submit` → POST `/feedback-forms`

## 9.10 Plugin Integrations (v1)
- `pb plugin-integrations list` → GET `/plugin-integrations`
- `pb plugin-integrations create` → POST `/plugin-integrations`
- `pb plugin-integrations get` → GET `/plugin-integrations/{id}`
- `pb plugin-integrations update` → PATCH `/plugin-integrations/{id}`
- `pb plugin-integrations update-legacy` → PUT `/plugin-integrations/{id}` *(deprecated upstream)*
- `pb plugin-integrations delete` → DELETE `/plugin-integrations/{id}`
- `pb plugin-integrations connections list` → GET `/plugin-integrations/{id}/connections`
- `pb plugin-integrations connections get` → GET `/plugin-integrations/{id}/connections/{featureId}`
- `pb plugin-integrations connections set` → PUT `/plugin-integrations/{id}/connections/{featureId}`
- `pb plugin-integrations connections delete` → DELETE `/plugin-integrations/{id}/connections/{featureId}`

## 9.11 Jira Integrations (v1)
- `pb jira-integrations list` → GET `/jira-integrations`
- `pb jira-integrations get` → GET `/jira-integrations/{id}`
- `pb jira-integrations connections list` → GET `/jira-integrations/{id}/connections`
- `pb jira-integrations connections get` → GET `/jira-integrations/{id}/connections/{featureId}`

## 9.12 Webhooks (v1)
- `pb webhooks list` → GET `/webhooks`
- `pb webhooks create` → POST `/webhooks`
- `pb webhooks get` → GET `/webhooks/{id}`
- `pb webhooks delete` → DELETE `/webhooks/{id}`

## 9.13 v2 beta namespace

### v2 Notes
- `pb v2 notes list` → GET `/notes`
- `pb v2 notes create` → POST `/notes`
- `pb v2 notes get` → GET `/notes/{id}`
- `pb v2 notes update` → PATCH `/notes/{id}`
- `pb v2 notes delete` → DELETE `/notes/{id}`
- `pb v2 notes configurations list` → GET `/notes/configurations`
- `pb v2 notes configurations get` → GET `/notes/configurations/{type}`
- `pb v2 notes relationships list` → GET `/notes/{id}/relationships`
- `pb v2 notes relationships create` → POST `/notes/{id}/relationships`
- `pb v2 notes relationships set-customer` → PUT `/notes/{id}/relationships/customer`
- `pb v2 notes relationships delete` → DELETE `/notes/{id}/relationships/{targetType}/{targetId}`

### v2 PM entities
- `pb v2 entities list` → GET `/entities`
- `pb v2 entities create` → POST `/entities`
- `pb v2 entities get` → GET `/entities/{id}`
- `pb v2 entities update` → PATCH `/entities/{id}`
- `pb v2 entities delete` → DELETE `/entities/{id}`
- `pb v2 entities search` → POST `/entities/search`
- `pb v2 entities configurations list` → GET `/entities/configurations`
- `pb v2 entities configurations get` → GET `/entities/configurations/{type}`
- `pb v2 entities relationships list` → GET `/entities/{id}/relationships`
- `pb v2 entities relationships create` → POST `/entities/{id}/relationships`
- `pb v2 entities relationships set-parent` → PUT `/entities/{id}/relationships/parent`
- `pb v2 entities relationships delete` → DELETE `/entities/{id}/relationships/{type}/{targetId}`

### v2 Analytics
- `pb v2 analytics member-activities get` → GET `/analytics/member-activities`

---

## 10) Implementation Phases

## Phase 0 — Bootstrap (1–2 days)
- Create repo scaffolding, lint/format/test baseline
- Set up CI (lint + unit tests + coverage check)
- Implement auth/config/output core skeleton

## Phase 1 — Reuse MCP foundations (3–4 days)
- Port/adapt robust pieces from MCP server logic:
  - error normalization
  - pagination behavior
  - request helper patterns
- Add `pb auth *` and `pb api call`

## Phase 2 — Core v1 MVP (5–7 days)
- Implement the existing 40-tool-equivalent surface first
- Validate UX with real workspace usage
- Stabilize table/JSON output schema

## Phase 3 — Complete v1 parity to 119 operations (7–10 days)
- Implement all remaining endpoints by domain
- Include deprecated endpoints under explicit `*-legacy` commands
- Add full docs and examples for every command

## Phase 4 — Add v2 beta namespace (4–6 days)
- Implement all 24 v2 operations under `pb v2`
- Ensure independent auth/version handling from v1
- Mark beta clearly in help/docs

## Phase 5 — Hardening + release prep (4–5 days)
- End-to-end test pass
- Packaging, checksums, signing, SBOM
- Changelog + migration docs + release automation

---

## 11) Testing Strategy

## Unit tests
- Argument parsing/validation
- Request body normalization
- Error mapping (401/403/404/409/422/429)
- Pagination walkers (`links.next`, cursor)

## Integration tests
- Mock Productboard API (`nock` or Prism)
- Every command has success + failure scenarios
- Snapshot tests for `table/json/yaml/quiet`

## Contract coverage tests (critical)
- CI job fetches current OpenAPI specs
- Asserts every operation has a mapped command (or explicit exclusion rationale)
- Fails build on coverage regressions

## Live smoke tests (optional, gated)
- Run against sandbox workspace using CI secrets
- Validate at least one read + one write + one delete per major domain

---

## 12) Distribution Plan

## Publish channels
1. **npm** (primary):
   - package name recommendation: `@benmillerat/productboard-cli`
   - install: `npm i -g @benmillerat/productboard-cli`
2. **GitHub Releases**:
   - prebuilt binaries for macOS (arm64/x64), Linux (x64/arm64), Windows x64
   - SHA256 checksums + signatures
3. **Homebrew tap**:
   - `brew tap benmillerat/tap`
   - `brew install productboard-cli`

## Build/release automation
- GitHub Actions matrix builds
- Semantic versioning via conventional commits + release workflow
- Auto-generate changelog + command docs on release

---

## 13) Quality Gates (Definition of Done)

- 100% command coverage of all v1 operations (119) + v2 beta ops (24)
- CI contract test green against upstream OpenAPI
- Cross-platform binaries published with checksums
- Homebrew install works end-to-end
- `pb --help` and `pb <resource> --help` docs complete
- README includes quickstart + scripting examples

---

## 14) Key Risks & Mitigations

1. **API surface drift (Productboard updates)**
   - Mitigation: scheduled CI contract check + generated coverage report
2. **Rate limits in bulk operations**
   - Mitigation: centralized retry/backoff + user-tunable limits
3. **Command sprawl / discoverability**
   - Mitigation: consistent verb model + aliases + strong `--help` examples
4. **v2 instability (beta)**
   - Mitigation: strict namespace isolation (`pb v2 ...`) and clear beta labeling

---

## 15) Immediate Next Steps

1. Create repo: `benmillerat/productboard-cli`
2. Scaffold oclif TypeScript project
3. Add auth/config/http/output core
4. Import OpenAPI specs + coverage generation script
5. Implement first vertical slice (`companies`, `notes`, `features`) end-to-end
