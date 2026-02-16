# Productboard CLI (`pb`)

`pb` is a standalone command-line interface for Productboard.

It is designed for fast day-to-day API workflows, scripting, and automation, with broad coverage of Productboard v1 endpoints and an isolated `v2` beta namespace.

## What's New in v2.0.0

- Expanded output controls for humans and scripts: `--plain`, `--wide`, `--results-only`
- Safer delete workflows: confirmation prompts by default, with `--yes` and `--no-input`
- HTTP troubleshooting mode with `--debug` (request/response logs on stderr, auth masked)
- Consistent command coverage across the CLI (145 command entries)

## Why this project

- First open-source Productboard-focused CLI with broad API coverage
- Script-friendly output (`plain`, `json`, `yaml`, `ndjson`, `quiet`, `--results-only`)
- Profile-aware authentication via OS keychain + env/flag overrides
- Consistent command patterns across resources

## Installation

### npm

Current release: **v2.0.0**

```bash
npm install -g @benmillerat/productboard-cli
```

Verify:

```bash
pb --help
```

### Homebrew (planned)

Homebrew distribution is planned for a future release.

## Quick start

1. Authenticate:

```bash
pb auth login
```

2. Check auth state:

```bash
pb auth status
pb auth whoami
```

3. Run your first API commands:

```bash
pb features list
pb notes list --limit 20
pb v2 notes list --limit 20
```

4. Use machine-readable output when scripting:

```bash
pb features list --output json
```

## Authentication and profiles

Token resolution order:

1. `--token`
2. `PRODUCTBOARD_API_TOKEN`
3. Keychain token for active profile

Profile selection:

- Use `--profile <name>` on any command
- Default profile name is `default`

Auth commands:

- `pb auth login`
- `pb auth logout`
- `pb auth status`
- `pb auth whoami`

## Output formats

Global output flags available on commands:

- `--output table|plain|json|yaml|ndjson`
- `--plain` (shorthand for `--output plain`)
- `--results-only` (JSON mode only)
- `--wide` (extra columns in table/plain)
- `--quiet`
- `--debug` (HTTP request/response logs to stderr)

Behavior:

- `table` (default): clean aligned text table for humans
- `plain`: tab-separated output for scripts (TSV), without table-style truncation
- `json`: pretty JSON (full API envelope by default)
- `yaml`: YAML output
- `ndjson`: one JSON object per line (arrays emit multiple lines)
- `--results-only`: with `--output json`, emit only primary payload (for example just `data[]`)
- `--wide`: show additional columns (for example parent IDs/URLs)
- `--quiet`: emit compact IDs/scalars when possible
- `--debug`: print HTTP logs like `DEBUG: GET /features?limit=25 → 200 (142ms)`, plus masked request headers and response size (stderr only)

Example human table output:

```text
ID                                    NAME               TYPE        STATUS   OWNER               UPDATED
02a68d50-9a53-4999-824c-92cac04f3518  Sample subfeature  subfeature  Planned  tech@benpro.at      2026-02-13 12:37
```

Example plain output (`--plain` / TSV):

```text
ID\tNAME\tTYPE\tSTATUS\tOWNER\tUPDATED
02a68d50-9a53-4999-824c-92cac04f3518\tSample subfeature\tsubfeature\tPlanned\ttech@benpro.at\t2026-02-13 12:37
```

Examples:

```bash
# Plain TSV output (script-friendly)
pb companies list --plain

# Include extra columns in table/plain modes
pb companies list --wide

# Extract only the primary JSON array payload
auto_json="$(pb companies list --output json --results-only)"

# Other formats
pb companies list --output table
pb companies list --output json
pb companies list --output yaml
pb companies list --output ndjson

# Compact scalar output and debug logs
pb companies get com_123 --quiet
pb features list --debug --limit 3
```

## Destructive command confirmations

Delete commands now require confirmation by default.

- Interactive terminal (TTY): prompts with `Delete <resource> <id>? [y/N]`
- Non-interactive (CI/script): command exits with code `2` unless `--yes` is provided

Related flags:

- `--yes`, `-y`: skip confirmation prompts
- `--no-input`: never prompt; fail when confirmation would be required

Examples:

```bash
pb features delete fea_123
pb features delete fea_123 --yes
pb features delete fea_123 --no-input --yes
```

## Configuration

Config file path:

- `~/.config/productboard-cli/config.json`

Supported config keys:

- `activeProfile`
- `profiles` (per-profile settings like `baseUrl`, `defaultOutput`)
- `defaults.output`
- `defaults.quiet`
- `defaults.timeoutMs`
- `defaults.maxRetries`

Example:

```json
{
  "activeProfile": "default",
  "profiles": {
    "default": {
      "baseUrl": "https://api.productboard.com",
      "defaultOutput": "table"
    },
    "work": {
      "defaultOutput": "json"
    }
  },
  "defaults": {
    "output": "table",
    "quiet": false,
    "timeoutMs": 30000,
    "maxRetries": 3
  }
}
```

## Scripting examples

List and filter with `jq`:

```bash
pb features list --output json | jq '.data[] | {id, name: .name}'
```

Create a note from inline JSON:

```bash
pb notes create --data '{"title":"CLI note","content":"Created from pb"}' --output json
```

Update by piping generated payload:

```bash
payload='{"name":"Renamed Feature"}'
pb features update fea_123 --data "$payload"
```

Quiet IDs for shell loops:

```bash
pb releases list --quiet | while read -r rel; do
  pb releases get "$rel" --output json
 done
```

Raw API escape hatch:

```bash
pb api call GET /features --query limit=10 --output json
pb api call PATCH /features/fea_123 --body '{"data":{"name":"New name"}}'
```

## Full command reference

### Utility and auth

- `pb api call <method> <path>`
- `pb auth login`
- `pb auth logout`
- `pb auth status`
- `pb auth whoami`
- `pb help exit-codes`

### Companies

- `pb companies list`
- `pb companies create`
- `pb companies get <id>`
- `pb companies update <id>`
- `pb companies delete <id>`

Company fields:

- `pb companies fields list`
- `pb companies fields create`
- `pb companies fields get <id>`
- `pb companies fields update <id>`
- `pb companies fields delete <id>`

Company field values:

- `pb companies field-values get <companyId> <companyCustomFieldId>`
- `pb companies field-values set <companyId> <companyCustomFieldId>`
- `pb companies field-values delete <companyId> <companyCustomFieldId>`

### Users

- `pb users list`
- `pb users create`
- `pb users get <id>`
- `pb users update <id>`
- `pb users delete <id>`

### Products and components

Products:

- `pb products list`
- `pb products get <id>`
- `pb products update <id>`

Components:

- `pb components list`
- `pb components create`
- `pb components get <id>`
- `pb components update <id>`

### Features

- `pb features list`
- `pb features create`
- `pb features get <id>`
- `pb features update <id>`
- `pb features delete <id>`

Feature links -> initiatives:

- `pb features links initiatives list <featureId>`
- `pb features links initiatives add <featureId> <initiativeId>`
- `pb features links initiatives remove <featureId> <initiativeId>`

Feature links -> objectives:

- `pb features links objectives list <featureId>`
- `pb features links objectives add <featureId> <objectiveId>`
- `pb features links objectives remove <featureId> <objectiveId>`

Feature metadata:

- `pb feature-statuses list`
- `pb feature-release-assignments list <featureId>`
- `pb feature-release-assignments get <featureId> <releaseId>`
- `pb feature-release-assignments set <featureId> <releaseId>`

### Notes

- `pb notes list`
- `pb notes create`
- `pb notes get <id>`
- `pb notes update <id>`
- `pb notes delete <id>`

Note links:

- `pb notes links list <noteId>`
- `pb notes links add <noteId> <entityId>`

Note tags:

- `pb notes tags list <noteId>`
- `pb notes tags add <noteId> <tag>`
- `pb notes tags remove <noteId> <tag>`

Note followers:

- `pb notes followers add-bulk <noteId>`
- `pb notes followers remove <noteId> <followerId>`

### Releases

Releases:

- `pb releases list`
- `pb releases create`
- `pb releases get <id>`
- `pb releases update <id>`
- `pb releases delete <id>`

Release groups:

- `pb release-groups list`
- `pb release-groups create`
- `pb release-groups get <id>`
- `pb release-groups update <id>`
- `pb release-groups delete <id>`

### Objectives, initiatives, key results

Objectives:

- `pb objectives list`
- `pb objectives create`
- `pb objectives get <id>`
- `pb objectives update <id>`
- `pb objectives delete <id>`

Objective links -> initiatives:

- `pb objectives links initiatives list <objectiveId>`
- `pb objectives links initiatives add <objectiveId> <initiativeId>`
- `pb objectives links initiatives remove <objectiveId> <initiativeId>`

Objective links -> features:

- `pb objectives links features list <objectiveId>`
- `pb objectives links features add <objectiveId> <featureId>`
- `pb objectives links features remove <objectiveId> <featureId>`

Initiatives:

- `pb initiatives list`
- `pb initiatives create`
- `pb initiatives get <id>`
- `pb initiatives update <id>`
- `pb initiatives delete <id>`

Initiative links -> objectives:

- `pb initiatives links objectives list <initiativeId>`
- `pb initiatives links objectives add <initiativeId> <objectiveId>`
- `pb initiatives links objectives remove <initiativeId> <objectiveId>`

Initiative links -> features:

- `pb initiatives links features list <initiativeId>`
- `pb initiatives links features add <initiativeId> <featureId>`
- `pb initiatives links features remove <initiativeId> <featureId>`

Key results:

- `pb key-results list`
- `pb key-results create`
- `pb key-results get <id>`
- `pb key-results update <id>`
- `pb key-results delete <id>`

### Custom fields and feedback

Custom fields:

- `pb custom-fields list`
- `pb custom-fields get <id>`

Custom field values:

- `pb custom-fields values list <entityId>`
- `pb custom-fields values get <entityId> <customFieldId>`
- `pb custom-fields values set <entityId> <customFieldId>`
- `pb custom-fields values delete <entityId> <customFieldId>`

Feedback:

- `pb feedback-configurations list`
- `pb feedback-configurations get <id>`
- `pb feedback-forms submit`

### Integrations and webhooks

Plugin integrations:

- `pb plugin-integrations list`
- `pb plugin-integrations create`
- `pb plugin-integrations get <id>`
- `pb plugin-integrations update <id>`
- `pb plugin-integrations delete <id>`

Plugin integration connections:

- `pb plugin-integrations connections list <pluginIntegrationId>`
- `pb plugin-integrations connections get <pluginIntegrationId> <connectionId>`
- `pb plugin-integrations connections set <pluginIntegrationId> <connectionId>`
- `pb plugin-integrations connections delete <pluginIntegrationId> <connectionId>`

Jira integrations:

- `pb jira-integrations list`
- `pb jira-integrations get <id>`

Jira integration connections:

- `pb jira-integrations connections list <jiraIntegrationId>`
- `pb jira-integrations connections get <jiraIntegrationId> <connectionId>`

Webhooks:

- `pb webhooks list`
- `pb webhooks create`
- `pb webhooks get <id>`
- `pb webhooks delete <id>`

### v2 beta namespace

Notes:

- `pb v2 notes list`
- `pb v2 notes create`
- `pb v2 notes get <id>`
- `pb v2 notes update <id>`
- `pb v2 notes delete <id>`
- `pb v2 notes configurations list`
- `pb v2 notes configurations get <type>`
- `pb v2 notes relationships list <id>`
- `pb v2 notes relationships create <id>`
- `pb v2 notes relationships set-customer <id>`
- `pb v2 notes relationships delete <id> <targetType> <targetId>`

PM entities:

- `pb v2 entities list`
- `pb v2 entities create`
- `pb v2 entities get <id>`
- `pb v2 entities update <id>`
- `pb v2 entities delete <id>`
- `pb v2 entities search`
- `pb v2 entities configurations list`
- `pb v2 entities configurations get <type>`
- `pb v2 entities relationships list <id>`
- `pb v2 entities relationships create <id>`
- `pb v2 entities relationships set-parent <id>`
- `pb v2 entities relationships delete <id> <type> <targetId>`

Analytics:

- `pb v2 analytics member-activities get`

## Exit codes

You can also run `pb help exit-codes` for this table.

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Runtime/API/network error |
| 2 | Usage/validation/config error (includes missing confirmation) |
| 4 | Auth required or invalid |
| 5 | Resource not found (404) |
| 130 | Interrupted (Ctrl+C) |

## Development and contributing

### Setup

```bash
git clone <repo-url>
cd productboard-cli
npm install
```

### Build and test

```bash
npm run build
npx tsc --noEmit
npx vitest run
npm run lint
```

### Local CLI usage

```bash
npm run dev -- --help
npm run dev -- auth status
npm run dev -- features list --limit 5
```

### Contribution workflow

1. Create a focused branch.
2. Add or update commands/tests/docs.
3. Run `npx tsc --noEmit` and `npx vitest run`.
4. Open a PR with command examples and behavior notes.

## License

MIT
