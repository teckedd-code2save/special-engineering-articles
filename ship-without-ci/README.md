# I Ran Out of GitHub Actions Credits: CI Without GitHub Actions

*By Edward Kwabena Twumasi. Historical account: 18 October 2026. Edited: 7 November 2026.*

I ran out of GitHub Actions credits while GitHub source hosting and GHCR remained usable. This two-part series describes how we replaced the build executor, preserved the registry, and separated building an image from promoting it.

| Article | What it covers |
| --- | --- |
| [1. I Ran Out of GitHub Actions Credits: CI Without GitHub Actions](01-ssh-compose-ghcr-runbook.md) | Source identity, an alternative builder, GHCR publication, digest verification, Compose promotion, and recovery |
| [2. Agentic CI Without GitHub Actions: A Scoped MCP Build and Release Workflow](02-mcp-release-tool.md) | GroundControl's separate build and release operations, OAuth scope, external sandbox builds, and integration failures |

The recorded external build produced two images for RentAWeekend in roughly three and a half minutes. It did not switch production. Live test-gated promotion, zero-downtime switching, and schema-changing recovery remain separate validation work.

The first article now includes a step-by-step Bash walkthrough with inputs, execution locations, and expected results. The second includes explicit MCP payloads, an agent/tool responsibility map, and official references for GitHub, GHCR, Docker Agentic Platform, Docker Sandboxes, MCP, Compose, and Daytona.

The existing folder name is retained to preserve repository links. “Without GitHub Actions” describes the scope more accurately than “without CI”: tests and release checks remain part of the workflow.

No credentials, runtime environment files, or customer data are included. Historical image identities establish which artifacts the account discusses; they do not certify current service or builder availability.
