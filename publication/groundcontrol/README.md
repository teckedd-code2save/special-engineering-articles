# GroundControl publication pack

Prepared 8 November 2026. Series angle: **CI beyond quotas**.

## Read the articles

1. [I Ran Out of GitHub Actions Credits: CI Without GitHub Actions](../../ship-without-ci/01-ssh-compose-ghcr-runbook.md)
2. [Agentic CI Without GitHub Actions: A Scoped MCP Build and Release Workflow](../../ship-without-ci/02-mcp-release-tool.md)

Each has a `.dev.md` copy with draft front matter and a `.medium.md` copy with tables converted to readable paragraphs. All external-copy links are absolute. DEV copies have `published: false`. No Medium or DEV publication has been made or verified.

Publish the manual path first, then the agent path. The first gives readers an independently inspectable release process; the second shows how GroundControl coordinates it. Keep one original URL as the canonical source when cross-posting, and replace the inter-article GitHub links with published article URLs after both exist. Suggested short introduction: “I ran out of GitHub Actions credits. The checks, images and releases still had to happen. Here is the workflow I kept, and the build machine I changed.”

## Corrections made

- Added application prerequisites and one-time GroundControl setup links.
- Added the missing private GHCR login on the VPS; workstation login is separate.
- Made rollback self-contained in a fresh shell, with checks against the prior image rather than the failed candidate.
- Added persistence of accepted image pins and explained that future commands must include the override.
- Corrected cloud versus managed-host execution: source preparation and image tests remain on the host.
- Removed the claim that `expectedCurrentRevision` is enforced. It is accepted by the MCP schema but unused by the reviewed worker.
- Added an exact-digest operator test gate because the current built-in image tests invoke SHA tags.
- Corrected cleanup and recovery claims: removal is attempted; captured prior image records may be incomplete; there is no general MCP rollback tool.
- Clarified that build-service selection does not define release restart scope, and migrations must be verified for the application's deployment path.
- Added complete health/log calls, operation stop conditions, and a reusable agent prompt.

## What was verified

Against GroundControl commit `575da5ca8edc866847d74d426eac367683dfbc70`:

- Read MCP schemas, build/publish route, cloud adapter, release route and release worker.
- Parsed every Bash block with `bash -n` and every JSON block with a JSON parser; see [validation.json](validation.json).
- Reviewed official Docker cloud/create and Compose documentation, and GitHub's GHCR authentication documentation.
- Confirmed the connected GroundControl deployment list is accessible. Its four available targets are existing application deployments; none is identified as disposable staging.

These checks do not constitute a fresh end-to-end deployment. Docker is not installed in the editing environment, and no disposable target is available through the current GroundControl grant. No production builds, releases, migrations or recovery operations were run for this article review.

## Live rehearsal before describing the walkthrough as end-to-end tested

Use a disposable enrolled Compose application with its own source checkout, GHCR image names, public URL and test data. The operator must provision/enroll it; the available MCP tools cannot create that target.

1. Start on a known digest-pinned baseline and retain its effective Compose file order and recovery images.
2. Follow Part 1 from a clean workstation shell and a separate host shell. Record the source SHA, test output, image digest, migration output, health, user outcome and recovered baseline.
3. Follow Part 2 against the same staging application with a new source commit. Confirm the advertised tools/scopes and the cloud CLI credentials under GroundControl's actual execution identity.
4. Run one passing build and one deliberately failing image-test build. Confirm the failing build cannot be released.
5. Test each published digest directly, then release the passing build. Compare the running digests and exercise the actual user workflow.
6. Confirm sandbox cleanup; inspect failures and `uncertain` outcomes before any retry. Recover with the recorded prior images and verify the same user workflow.
7. Add operation IDs and observed outcomes to this record. Only then label the walkthrough end-to-end rehearsed on that tested configuration.

Historical October image results remain attributed to the original account. This review has not independently rerun or recertified them.
