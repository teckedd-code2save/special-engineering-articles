---
title: "Agentic CI Without GitHub Actions: A Scoped MCP Build and Release Workflow"
published: false
tags: devops, docker, tutorial, ai
series: CI beyond quotas
---

[Series index](https://github.com/teckedd-code2save/special-engineering-articles/blob/main/ship-without-ci/README.md) | [Previous: the runbook](https://github.com/teckedd-code2save/special-engineering-articles/blob/main/ship-without-ci/01-ssh-compose-ghcr-runbook.md)

*By Edward Kwabena Twumasi. Build result: 18 October 2026. Examples revised: 8 November 2026.*

[GroundControl](https://github.com/teckedd-code2save/groundcontrol) is a self-hosted control plane I built so AI agents can inspect applications, request builds, and deploy releases on infrastructure I manage. It exposes tools through the Model Context Protocol (MCP), enforces OAuth grants, and holds the infrastructure credentials.

When I ran out of GitHub Actions credits, I used GroundControl to coordinate an external Docker build while keeping GitHub for source and GHCR for images. The manual steps from Part 1 became separate build and release operations.

**CI beyond quotas** means keeping source checks, image identity and release verification while changing the executor. This walkthrough is an agent-triggered build and release; continuous integration also needs a trigger on each relevant change.

## Prepare GroundControl once

1. [Install GroundControl](https://trygroundcontrol.serendepify.com/docs/getting-started) and complete owner setup. For a remote client, [publish it over HTTPS](https://trygroundcontrol.serendepify.com/docs/publishing).
2. [Add the application project](https://trygroundcontrol.serendepify.com/docs/projects), link its GitHub repository and enroll its Compose deployment. Confirm the source path, Compose file, target host and public URL. The selected services need both a build context and a publishable image name.
3. Configure repository access through the GitHub App and a GHCR credential with package write access in GroundControl. The managed host also needs package pull access for tests. Keep credentials in the product's credential setup, not agent prompts.
4. On the **managed deployment host**, install and authenticate the Docker Sandboxes CLI for an account with cloud access. GroundControl invokes `sbx` there, even when its control plane runs on another server. Follow [Docker's cloud setup](https://docs.docker.com/ai/sandboxes/cloud/); confirm network policy permits GitHub, GHCR and your build dependencies. Cloud compute is separately billed.
5. Prepare an application-specific test command that runs inside every selected image using `sh`. Images must contain the tests and their dependencies. This runner does not attach the application's Compose services or production environment to the test container. Integration tests needing a database need a separately prepared test environment.
6. [Connect your agent](https://trygroundcontrol.serendepify.com/docs/agent-access) to your own instance and approve the deployment resource plus `deployment:read`, `deployment:redeploy`, `operation:read`, `deployment:health`, and `deployment:logs` for log inspection. Confirm the tools below appear. Start with a staging deployment and have an operator verify the prior image set and database compatibility before release.

## Platforms and tools

| Platform | Tools | Role |
| --- | --- | --- |
| Your Mac, Linux PC or phone | An MCP-capable agent client, such as ChatGPT; Git for selecting source | Request work and inspect results |
| GroundControl server and managed Linux host | GroundControl; Docker Engine and `sbx` on the managed host | Authorise requests, prepare source, coordinate cloud execution, run image tests, retain evidence |
| Docker-managed cloud sandbox | Docker Engine and build tools in a Linux amd64 environment | Clone source, build images, push to GHCR |
| GitHub and GHCR | Repository hosting, GitHub App access, container registry | Supply private source and store images |
| Application's Linux VPS | Docker Engine and Compose | Pull verified images, run migrations, switch services |

GroundControl can run on the application VPS, but the `docker-agentic` executor moves the build compute into Docker's cloud. Your client device does not need Docker Desktop for this route. Source preparation and image tests still use the managed host; only image compilation and publishing move into the cloud sandbox.

The cloud provider is **Docker Agentic Platform**. Its cloud sandboxes are managed through **Docker Sandboxes**, using `sbx --cloud`. This compute has its own account access and charges.

GitHub's MCP server or a client's GitHub connector can help the agent inspect commits. The recorded builder itself cloned the private repository using GitHub App installation access.

## How the agent runs the pipeline

The agent inspects the deployment, selects a commit, requests a build, checks its evidence, and requests promotion when authorised. GroundControl executes the operations and records their results.

| GroundControl tool | Purpose |
| --- | --- |
| `deployment.list` | List deployments allowed by the grant |
| `deployment.inspect` | Inspect source, runtime target, and release state |
| `deployment.build_publish` | Build the exact commit and publish verified images |
| `operation.get` | Read progress, evidence, results, or failure |
| `deployment.release` | Promote a prior build's digests and attempt to capture recovery images |
| `deployment.health` | Inspect container health and the recorded public endpoint |
| `deployment.logs` | Read recent deployment execution evidence |

Build and release are separate: building does not recreate running containers, but does synchronize the managed source checkout; releasing uses the artifacts already built.

## 1. Connect and inspect

**In your agent client:** connect your MCP client to GroundControl, complete OAuth, and select the deployments it may access. The grant uses the scopes listed above; GroundControl retains host and provider credentials.

Call `deployment.list` with:

```json
{}
```

Then call `deployment.inspect`:

```json
{
  "deployment": "<deployment-slug-from-the-list>"
}
```

**Check:** the repository, target VPS, Compose services, current revision, and public URL. Use the tool schemas advertised by your connected instance.

## 2. Get the commit SHA

A commit SHA identifies one saved revision. **In Mac Terminal, inside the application repository**, check out the code you want to build and run:

```bash
git rev-parse HEAD
```

If you are on a phone, use GitHub’s commit page or ask the connected GitHub tool for the full commit SHA. Copy the complete output into `commitSha` below. Commit and push local changes first. To select the latest fetched `main`, use:

```bash
git fetch origin
git rev-parse origin/main
```

You can also open the intended commit on GitHub and select **Copy full SHA**. A branch name can move; the full SHA fixes the source for this build.

## 3. Request the cloud build

**In your agent client**, call `deployment.build_publish`:

```json
{
  "deployment": "<deployment-slug>",
  "commitSha": "<full-SHA-from-step-2>",
  "builder": "docker-agentic",
  "services": ["api", "migrate", "research-worker"],
  "runTests": true,
  "testCommand": "npm test",
  "idempotencyKey": "<unique-build-attempt-key>",
  "reason": "Build and test the selected commit using Docker cloud compute."
}
```

**Execution:** GroundControl coordinates the Linux amd64 cloud sandbox. The sandbox clones the commit, builds each distinct image and publishes to GHCR. GroundControl then runs the requested image tests on the managed host.

**Check:** replace the service names and test command with yours. This backend example assumes a shared image containing the test code and dependencies. A separately built frontend needs its own checks.

Choose `docker-agentic` explicitly. The default `buildkit` executor runs on the managed host. Save the returned `operation.id`. Use a unique idempotency key of 8–160 characters, such as `build-<full-sha>-<UTC-timestamp>`. Keep that exact key with this attempt.

## 4. Inspect the result

Call `operation.get`:

```json
{
  "operationId": "<returned-build-operation-id>"
}
```

**Check:** terminal success, the expected image digests, registry verification, and passed tests. Read `operation.error`, `operation.evidence`, and `operation.result`; accepting a request does not mean its build succeeded.

The current image-test command runs the SHA-tagged reference on the managed host. For a strict tested-artifact gate, run your verified test command against each returned digest before promotion. **Operator terminal on the managed host**, using the same private registry access:

```bash
bash
set -euo pipefail
read -r -p 'Paste the complete image repository@sha256:digest from the operation: ' IMAGE_REF
[[ "$IMAGE_REF" =~ @sha256:[0-9a-f]{64}$ ]]
docker --config "$HOME/.groundcontrol/docker" pull "$IMAGE_REF"
docker --config "$HOME/.groundcontrol/docker" run --rm --entrypoint sh \
  "$IMAGE_REF" -lc 'npm test'
```

Replace `npm test` with your confirmed image-contained command and repeat for each distinct image. This operator step is not an extra MCP tool. If your agent has only the listed GroundControl tools, the operator supplies this evidence before it releases.

If the client disconnects, inspect the same operation. Reusing its idempotency key retrieves the original attempt. Use a new key for an intentional new attempt.

Do not proceed on `failed`, `uncertain`, a missing digest or skipped tests. Poll active operations at a modest interval. If your waiting window ends, preserve the operation ID and inspect it later; a timeout is not evidence that nothing changed.

## 5. Release to the VPS

After the checks pass and promotion is authorised, call `deployment.release`:

```json
{
  "deployment": "<deployment-slug>",
  "buildOperationId": "<successful-build-operation-id>",
  "idempotencyKey": "<unique-release-attempt-key>",
  "reason": "Deploy the checked build's image digests."
}
```

**Before the call:** inspect the deployment again and compare the source revision and running image references with the state you reviewed. Coordinate one release owner and pause competing rollouts. The current schema accepts `expectedCurrentRevision`, but the reviewed release worker does not enforce it, so this example does not rely on that field as a concurrency lock.

**Execution:** GroundControl applies the build's immutable image references to the application VPS and invokes its redeploy path. Inspect the captured prior images; a rollback record may be incomplete and is not automatic recovery.

**Check:** The exposed tool rejects failed-test builds and has no force argument. Check test evidence explicitly when tests were skipped.

Poll the returned **release** operation with `operation.get`, then inspect the deployment. The build service list selects images to build; it is not a promise that release restarts only those services. Review the complete Compose topology first. Migration behavior comes from that application and its deployment path: verify how its migration runs and stops release on failure. Do not infer that a service named `migrate` ran successfully.

Call each of `deployment.inspect`, `deployment.health` and `deployment.logs` with:

```json
{
  "deployment": "<deployment-slug>"
}
```

Confirm the running image digests, migration outcome, container health and public endpoint. Then exercise the feature you changed with an authorized test account and check its expected result. Record the commit, build and release operation IDs, image digests and user-workflow outcome together. A successful operation alone does not establish that user outcome.

If verification fails, retain the failed operation and inspect the actual runtime before retrying. An operator uses the prior image set and the complete recovery steps in [Part 1](https://github.com/teckedd-code2save/special-engineering-articles/blob/main/ship-without-ci/01-ssh-compose-ghcr-runbook.md#12-recover-explicitly-if-the-candidate-fails), after confirming database compatibility. There is no `deployment.rollback` tool in the reviewed tool set.

## A prompt you can give your agent

> Use my connected GroundControl tools. Inspect my chosen staging deployment and show its repository, host, Compose services and current image references. Confirm the exact pushed commit with me. Build it using docker-agentic and the test command we have verified for these images. Record the operation ID and wait for passed tests and valid image digests. Before release, inspect again, compare the runtime with the state we reviewed and show the recovery image set. Release only with my authorization. Follow the release operation, check health and logs, and verify the agreed user workflow. Report the commit, digests, both operation IDs and the observed result. Stop on failed, uncertain or missing evidence; do not retry mutations blindly.

## Inside the cloud build

GroundControl's executor performs three phases:

1. Create a Linux amd64 sandbox and clone the selected commit once.
2. Build each unique image, push to GHCR and record its digest; run configured image tests on the managed host.
3. Attempt sandbox removal in cleanup. Verify removal separately with `sbx --cloud ls` on the managed host; cleanup errors are not proof of successful deletion.

For example, `api`, `migrate`, and `research-worker` can share one backend image. Building it once avoids repeating the same work for every service.

The control plane passed credentials into the historical sandbox through stdin. Source access, registry access, and Docker cloud access remain separate credentials; inspect phase-specific errors when one fails.

### Check the cloud connection

**On the managed deployment host**, as the identity used by GroundControl host execution, with the Docker Sandboxes CLI installed and authenticated:

```bash
sbx version
sbx --cloud --help
sbx --cloud diagnose
sbx --cloud ls
```

**Check:** the CLI supports cloud operations and can access the intended Docker account. The installed version determines available creation flags.

The current adapter constructs this form (shown without its generated name):

```bash
sbx --cloud create shell --platform linux/amd64
```

Check `sbx create --help` and the current documentation before using this route with your installed CLI. Confirm the resulting architecture and Docker daemon. GroundControl manages this lifecycle for the MCP route.

The Daytona sandbox probed in October lacked a usable Docker installation. Current Daytona documentation describes Docker-capable configurations; the probe applies to that particular environment.

## Integration failures and fixes

Exercising the builder against RentAWeekend exposed six faults:

| Failure | Fix |
| --- | --- |
| Private clone had no credentials | Supply GitHub App installation access |
| Compose returned build paths rooted on the VPS | Resolve them relative to the sandbox checkout |
| Dockerfile path was interpreted from the wrong directory | Anchor custom Dockerfiles to their build context |
| Shared backend was built repeatedly | Deduplicate image references |
| Second service tried to clone over the first checkout | Clone once, then build per image |
| Worker reported failure after images were pushed | Correctly unpack `fetchJson`'s `{ response, body }` return |

The operation also needed usable evidence. We retained redacted stdout and stderr per phase, ran requested tests once per distinct image, and fixed shared-image variable matching for Compose defaults such as `${API_IMAGE:-fallback}`.

## The build result

On 18 October, `deployment.build_publish` built commit `f1e33a80801d4ab990c6e2508019275626c7786e` using `docker-agentic`. One sandbox produced two RentAWeekend images in roughly three and a half minutes:

| Services | Published image |
| --- | --- |
| API, migration, research worker | `ghcr.io/teckedd-code2save/rentaweekend-api@sha256:63c092db3819f142d699b71540a4d06bf8210aa8c605e2df25e14c91e2d8ebb8` |
| Web | `ghcr.io/teckedd-code2save/rentaweekend-web@sha256:2d29ecd480c010932ea713ef7416584bcd1c29cd4969ebe5dae14e52dca0f29b` |

The recorded October sandbox was removed and production stayed unchanged. Live test-gated promotion, zero-downtime switching, and recovery after a schema change remain separate validation work.

The pipeline kept GitHub source hosting and GHCR. GroundControl supplied the agent-facing operations, and Docker's cloud supplied the build machine.

## Tools and references

| Tool | Official reference |
| --- | --- |
| GroundControl | [Repository and MCP access](https://github.com/teckedd-code2save/groundcontrol) |
| Git | [Revision selection](https://git-scm.com/docs/git-rev-parse) |
| GitHub agent access | [GitHub MCP Server](https://github.com/github/github-mcp-server) |
| Private source access | [GitHub App authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation) |
| GHCR | [Authentication and images](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) |
| MCP | [Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) and [OAuth authorisation](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) |
| Docker Agentic Platform | [Platform](https://docs.docker.com/agentic-platform) and [cloud sandboxes](https://docs.docker.com/ai/sandboxes/cloud/) |
| Docker Sandboxes | [sbx](https://docs.docker.com/reference/cli/sbx/), [create](https://docs.docker.com/reference/cli/sbx/create/), [exec](https://docs.docker.com/reference/cli/sbx/exec/), [remove](https://docs.docker.com/reference/cli/sbx/rm/) |
| Image build and runtime | [BuildKit](https://docs.docker.com/build/buildkit/), [Buildx](https://docs.docker.com/reference/cli/docker/buildx/build/), [Compose](https://docs.docker.com/compose/) |
| Daytona | [Docker support](https://www.daytona.com/docs/docker) |

The `deployment.*` and `operation.get` tools are GroundControl-specific. Discover their schemas through the connected MCP client.
