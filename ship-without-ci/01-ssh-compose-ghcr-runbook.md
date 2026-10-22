# Deploying Without GitHub Actions: Keeping GHCR in the Release Pipeline

[Series index](README.md) | [Next: Turning the release runbook into MCP tools](02-mcp-release-tool.md)

*By Edward Kwabena Twumasi. Original account: 18 October 2026. Edited: 22 October 2026.*

GitHub Actions was unavailable, but that did not mean GitHub was unavailable. The source repository still worked. GitHub Container Registry (GHCR) still accepted images. Our Docker Compose workload was still running.

We needed another place to build and test the release, then a controlled way to promote the resulting images. Replacing the build runner was enough to restore that path.

This article describes the manual fallback behind that approach: identify the source, build away from the live checkout, publish to GHCR, verify the artifacts, and switch the workload with a recorded recovery path. Part 2 explains how we exposed those steps through scoped GroundControl tools and moved the build to an external sandbox.

## GitHub Actions and GHCR have different jobs

A release pipeline often bundles several services into one familiar “deploy” button. It is useful to separate them when the button stops working.

| Concern | Job | What can remain available when Actions is unavailable |
| --- | --- | --- |
| Source hosting | Store and identify the exact code | GitHub repository and commit SHA |
| Build executor | Run dependency installation, tests, and image builds | An external runner or suitable workstation |
| Registry | Store and distribute the built images | GHCR |
| Release control | Authorise and coordinate promotion | A scoped control plane or a reviewed manual runbook |
| Runtime | Execute the selected images | Docker Compose on the server |

An Actions billing or execution problem does not, by itself, establish a GHCR outage. Registry authentication is also separate: being able to clone the repository does not establish permission to push a package.

The fallback therefore preserves GitHub source hosting and GHCR. It changes who performs the build and how the release is triggered.

It still needs network access to source hosting, base-image registries, and dependency registries. The Compose switch described here can interrupt service; no zero-downtime result is claimed.

## Start with the release record

Before changing the workload, record the current source revision, each service's image reference and image ID, the available digests, health, Compose files and overrides, runtime flags, and migration state.

Keep the previous image set available. Confirm disk headroom and establish one release owner so a recovered automatic rollout cannot overwrite the manual release.

The essential identifiers are:

| Identifier | Purpose |
| --- | --- |
| Full source commit SHA | Defines which code is being built |
| Per-image digest | Defines the exact registry artifact to run |
| Expected image architecture | Prevents an ARM/amd64 mismatch |
| Prior source and image set | Defines the application recovery target |
| Compose project and explicit file list | Defines which workload will change |
| Migration identity and compatibility | Determines whether an image rollback is sufficient |

A commit SHA and an image digest answer different questions. The commit identifies source; the digest identifies built content. An OCI revision label connects the artifact to its declared source, but the label alone does not prove the build used that source. Record the build provenance and test result as well.

## Build outside the live checkout

The historical manual fallback could build in a detached worktree on the server. That isolated the source tree from the live checkout, but it still consumed the server's CPU, memory, and disk. An external builder provides stronger resource separation.

On whichever build machine you use, resolve and check out the explicit commit. Review the build context and `.dockerignore` so runtime credentials and unrelated files stay out of the image context.

The following Bash fragment illustrates a **single image** after the checkout and credentials have already been prepared. It is not a complete deployment script. Replace the image, context, and platform with values reviewed for your application.

```bash
set -euo pipefail

: "${RELEASE_SHA:?Set the full source commit SHA}"
: "${IMAGE_REPO:?Set the GHCR image repository}"
: "${BUILD_CONTEXT:?Set the reviewed build context}"

test "$(git rev-parse HEAD)" = "$RELEASE_SHA"
test -z "$(git status --porcelain)"

docker build --platform linux/amd64 \
  --label "org.opencontainers.image.revision=$RELEASE_SHA" \
  --tag "$IMAGE_REPO:$RELEASE_SHA" \
  "$BUILD_CONTEXT"

docker push "$IMAGE_REPO:$RELEASE_SHA"
```

A successful build is not evidence that tests passed. Run the application's required checks in the prepared build environment and retain their exit status and output before treating the image as releasable.

The runner needs GHCR push permission; the runtime needs pull permission. Provision each appropriately and keep credentials out of shell history, command arguments, and published logs. Use an isolated Docker configuration where the runner requires one.

For multiple services, identify which services share an image. An API, migration job, and worker may use the same backend image with different commands. Build that image once and map its digest to all three consumers.

## Publish to GHCR, then verify what you published

Tagging an image with the commit SHA makes it easier to find. Promoting its immutable digest makes the release identity precise.

For each image, record and check:

- The registry digest returned by the push and verified through the registry/pull path.
- The intended runtime architecture.
- The OCI revision label against that image's expected source revision.
- The relevant build and test evidence.

Do not assume all services have the same expected revision. A partial release can intentionally retain one component while advancing another.

Pinned dependencies and base images also matter. The same source commit can produce different images if upstream inputs change. Preserve the actual digest instead of assuming a SHA-shaped tag makes the build reproducible.

## Prepare the switch before replacing containers

Resolve every service to its intended digest-pinned reference, such as `ghcr.io/owner/app@sha256:...`. Prepare a release-specific Compose input or override that contains the complete image set, including shared-image consumers.

Use the exact Compose project and explicit file order from the running deployment. Validate that configuration with `docker compose ... config --quiet`; ordinary resolved configuration output can disclose secrets.

If source-managed Compose files must advance, first reject unexplained local changes and confirm the prior checkout revision. Use a reviewed fast-forward path. A generic script that resets the checkout can destroy changes you have not accounted for.

The release-specific inputs must be available to Compose **before** recreation. An illustrative ordering is:

1. Save the previous source, image pins, and configuration identity.
2. Prepare and validate the candidate configuration with the new digest pins.
3. Run migrations in the order required by the application's compatibility contract.
4. Recreate the intended services with the candidate inputs and no build.
5. Verify the migration result and service health.
6. Mark the candidate as the accepted release only after verification.

Do not write new pins only after `up` and assume the earlier command used them. Compose must receive the candidate image set during the switch. Keep acceptance of that candidate separate from preparing the inputs.

## A health gate detects failure; it does not reverse it

Check each long-running service's health. For a one-shot migration, check that the container exited with status zero; an inherited HTTP healthcheck is not the success criterion for a completed migration.

A failed health gate means the rollout is unacceptable. It does not mean that the old containers are still running or that the script has restored them.

Recovery needs an explicit decision and the previously recorded configuration. Pull the prior digest-pinned images if necessary, recreate the intended services, and verify the result.

For schema changes, establish whether the prior application can read the new schema before relying on an image rollback. A database restore can discard writes received after the backup. It requires its own reviewed recovery procedure.

## Verify a user workflow

There are three useful levels of evidence:

| Level | Evidence |
| --- | --- |
| Artifact | Source SHA, image digests, architecture, revision labels, test results |
| Operation | Container health, migration exit status, public HTTPS/API checks, bounded logs |
| Product | An authorised user workflow and any background job reaching a useful outcome |

An HTTP 200 from the app shell says little about a private booking flow or a worker that cannot reach its database. Run a representative workflow and record partial outcomes accurately. A job ending because it exhausted useful sources is different from meeting its objective.

## The failures worth preserving in the runbook

Several operational details were easy to miss:

**Building under an old tag creates a delayed rollback.** A local build can place new code under yesterday's image name. A later pull restores the registry's older content. Publish the new artifact and promote its digest.

**Compose precedence can hide a flag change.** A service's `environment` entry overrides an `env_file` value. Verify the intended setting in every consumer without dumping secrets.

**A container environment variable is not image identity.** An `API_IMAGE` value inside a container does not establish which image created it. Check the configured image reference, image ID, digest, and revision evidence.

**A disconnected client leaves uncertainty.** Give every release attempt a unique operation identity and retain its terminal status. A stale exit marker from a previous attempt is not the result of this attempt.

**A recovered pipeline can race the fallback.** Reconcile the normal deployment path after the manual release so it does not silently reintroduce older pins.

## What the release record should leave behind

A completed release record should identify the approved source, promoted digests, exact configuration and command, previous recovery set, migration outcome, tests, live checks, relevant log window, and unresolved defects.

That record is what makes the fallback repeatable. GitHub Actions can be unavailable while GitHub source hosting and GHCR continue doing their jobs. The missing build executor can be replaced without discarding the registry or weakening the evidence required to ship.

[Part 2: Turning the release runbook into scoped MCP tools](02-mcp-release-tool.md)

## References

- [GitHub: working with the Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker: Compose environment precedence](https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/)
- [Docker: compose up reference](https://docs.docker.com/reference/cli/docker/compose/up/)
