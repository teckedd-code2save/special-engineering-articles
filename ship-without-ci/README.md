# Ship Without CI: From Manual Runbook to a Scoped Release Capability

- **Written:** 18 October 2026
- **Status:** The manual runbook (part 1) and the MCP release tools plus off-host build executor (part 2) are both written and, for part 2, tested against a real deployment.

This series documents a single journey: what to do when CI is down and you have
to ship by hand, and then how to turn that same manual playbook into an
OAuth-gated MCP capability that no longer needs an SSH key, an unrestricted
shell, or a build running on the production box.

## Read the Series

| Article | Focus |
| --- | --- |
| [1. Ship Without CI: An SSH + Compose + GHCR Release Runbook](01-ssh-compose-ghcr-runbook.md) | The manual fallback path — preflight, isolated build, digest verification, switch, health gate, and rollback pair, with the pitfalls that actually happened |
| [2. From Runbook to Capability: The MCP Release Tool and an Off-Host Build Executor](02-mcp-release-tool.md) | The scoped `deployment.build_publish` / `deployment.release` tools, the OAuth contract, the Docker Agentic Platform build executor, and the six real bugs the end-to-end test surfaced |

For a sense of the payoff, read part 1's last section, then all of part 2. For
the operational detail of doing a manual release, read part 1's numbered steps.

## The Point in One Paragraph

A release that "goes through CI" is five independent concerns holding hands.
When one breaks, you replace that one with a direct path — not the platform.
Part 1 is the direct path by hand. Part 2 is the same path as two scoped MCP
tools, with the build moved into an ephemeral amd64 Docker Agentic Platform
sandbox so it never competes with production for CPU or RAM. A real build of a
private deployment produced two digest-pinned images in one sandbox in about
three and a half minutes, and the worker that marked that success as a failure
was fixed by running it, not by reading the schema. Build operations now retain
complete redacted stdout and stderr per phase instead of a truncated tail, the
BuildKit path publishes reliably through one isolated Docker configuration, and
shared image variables advance together even under Compose defaults.

## Publication Boundaries

This is an engineering case study, not a product announcement or a security
audit. No SSH keys, tokens, credentials, `.env` contents, or customer data are
included. Image digests and commit SHAs are quoted as evidence of a specific
run, not as a guarantee of any future state. The series is a dated snapshot.
