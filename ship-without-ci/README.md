# Deploying Without GitHub Actions: Keeping GHCR in the Release Pipeline

*By Edward Kwabena Twumasi. Historical account: 18 October 2026. Edited: 22 October 2026.*

GitHub Actions was unavailable while GitHub source hosting and GHCR remained usable. This two-part series describes how we replaced the build executor, preserved the registry, and separated building an image from promoting it.

| Article | What it covers |
| --- | --- |
| [1. Deploying Without GitHub Actions: Keeping GHCR in the Release Pipeline](01-ssh-compose-ghcr-runbook.md) | Source identity, an alternative builder, GHCR publication, digest verification, Compose promotion, and recovery |
| [2. Replacing GitHub Actions with a Scoped MCP Build and Release Workflow](02-mcp-release-tool.md) | GroundControl's separate build and release operations, OAuth scope, external sandbox builds, and integration failures |

The recorded external build produced two images for RentAWeekend in roughly three and a half minutes. It did not switch production. Live test-gated promotion, zero-downtime switching, and schema-changing recovery remain separate validation work.

The existing folder name is retained to preserve repository links. “Without GitHub Actions” describes the scope more accurately than “without CI”: tests and release checks remain part of the workflow.

No credentials, runtime environment files, or customer data are included. Historical image identities establish which artifacts the account discusses; they do not certify current service or builder availability.
