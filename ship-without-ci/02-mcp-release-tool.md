# Agentic CI Without GitHub Actions: A Scoped MCP Build and Release Workflow

[Series index](README.md) | [Previous: the runbook](01-ssh-compose-ghcr-runbook.md)

*By Edward Kwabena Twumasi. Build result: 18 October 2026. Examples revised: 7 November 2026.*

[GroundControl](https://github.com/teckedd-code2save/groundcontrol) is a self-hosted control plane I built so AI agents can inspect applications, request builds, and deploy releases on infrastructure I manage. It exposes tools through the Model Context Protocol (MCP), enforces OAuth grants, and holds the infrastructure credentials.

When I ran out of GitHub Actions credits, I used GroundControl to coordinate an external Docker build while keeping GitHub for source and GHCR for images. The manual steps from Part 1 became separate build and release operations.

## Platforms and tools

| Platform | Tools | Role |
| --- | --- | --- |
| Your Mac | An MCP-capable agent client, such as ChatGPT; Git for selecting source | Request work and inspect results |
| GroundControl's Linux server | GroundControl and Docker Sandboxes CLI, `sbx` | Authorise requests, coordinate cloud execution, retain evidence |
| Docker-managed cloud sandbox | Docker Engine and build tools in a Linux amd64 environment | Clone source, build and test images, push to GHCR |
| GitHub and GHCR | Repository hosting, GitHub App access, container registry | Supply private source and store images |
| Application's Linux VPS | Docker Engine and Compose | Pull verified images, run migrations, switch services |

GroundControl can run on the application VPS, but the `docker-agentic` executor moves the build compute into Docker's cloud. Your Mac runs the agent client; it does not need Docker Desktop for this route.

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
| `deployment.release` | Promote a prior build's digests and record recovery images |

Build and release are separate: building leaves the workload unchanged; releasing uses the artifacts already built.

## 1. Connect and inspect

**On your Mac:** connect your MCP client to GroundControl, complete OAuth, and select the deployments it may access. The grant uses deployment and operation scopes; GroundControl retains host and provider credentials.

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

Copy the complete output into `commitSha` below. Commit and push local changes first. To select the latest fetched `main`, use:

```bash
git fetch origin
git rev-parse origin/main
```

You can also open the intended commit on GitHub and select **Copy full SHA**. A branch name can move; the full SHA fixes the source for this build.

## 3. Request the cloud build

**In the agent client on your Mac**, call `deployment.build_publish`:

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

**Execution:** GroundControl coordinates the Linux amd64 cloud sandbox. It clones the commit, builds each distinct image, runs the requested checks, and publishes to GHCR.

**Check:** replace the service names and test command with yours. This backend example assumes a shared image containing the test code and dependencies. A separately built frontend needs its own checks.

Choose `docker-agentic` explicitly. The default `buildkit` executor runs on the managed host. Save the returned `operation.id`.

## 4. Inspect the result

Call `operation.get`:

```json
{
  "operationId": "<returned-build-operation-id>"
}
```

**Check:** terminal success, the expected image digests, registry verification, and passed tests. Read `error`, `evidence`, and `result`; accepting a request does not mean its build succeeded.

If the client disconnects, inspect the same operation. Reusing its idempotency key retrieves the original attempt. Use a new key for an intentional new attempt.

## 5. Release to the VPS

After the checks pass and promotion is authorised, call `deployment.release`:

```json
{
  "deployment": "<deployment-slug>",
  "buildOperationId": "<successful-build-operation-id>",
  "expectedCurrentRevision": "<verified-current-revision>",
  "idempotencyKey": "<unique-release-attempt-key>",
  "reason": "Deploy the checked build's image digests."
}
```

**Execution:** GroundControl applies the build's immutable image references to the application VPS and records the prior image set.

**Check:** obtain `expectedCurrentRevision` from deployment evidence. A mismatch means the deployment changed; inspect it before proceeding. The exposed tool rejects failed-test builds and has no force argument. Check test evidence explicitly when tests were skipped.

Poll the returned **release** operation with `operation.get`, then inspect the deployment. Verify image identity, migration outcome, service health, public endpoint, and an authorised user workflow. Part 1 shows the corresponding VPS checks and application-image recovery steps.

## Inside the cloud build

GroundControl's executor performs three phases:

1. Create a Linux amd64 sandbox and clone the selected commit once.
2. Build each unique image, test as configured, push to GHCR, and record its digest.
3. Remove the sandbox after retaining the operation evidence.

For example, `api`, `migrate`, and `research-worker` can share one backend image. Building it once avoids repeating the same work for every service.

The control plane passed credentials into the historical sandbox through stdin. Source access, registry access, and Docker cloud access remain separate credentials; inspect phase-specific errors when one fails.

### Check the cloud connection

**On GroundControl's Linux server**, with the Docker Sandboxes CLI installed:

```bash
sbx version
sbx --cloud --help
sbx --cloud ls
```

**Check:** the CLI supports cloud operations and can access the intended Docker account. The installed version determines available creation flags.

The October executor used:

```bash
sbx --cloud create shell --platform linux/amd64
```

Check `sbx create --help` and the current documentation before adapting that historical command. Confirm the resulting architecture and Docker daemon. GroundControl manages this lifecycle for the MCP route.

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

The sandbox was removed and production stayed unchanged. Live test-gated promotion, zero-downtime switching, and recovery after a schema change remain separate validation work.

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
