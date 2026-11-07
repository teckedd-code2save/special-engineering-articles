# Agentic CI Without GitHub Actions: A Scoped MCP Build and Release Workflow

[Series index](README.md) | [Previous: the runbook](01-ssh-compose-ghcr-runbook.md)

*By Edward Kwabena Twumasi. Historical result: 18 October 2026. Tool examples and references revised: 7 November 2026.*

I had run out of GitHub Actions credits. GitHub still hosted the source, and GitHub Container Registry (GHCR) could still store the images. What needed replacing was the build executor. The manual path in Part 1 supplied another build executor and a controlled release procedure. The next step was to make that procedure callable by an agent.

GroundControl exposes separate operations to build and publish an artifact, then promote an existing artifact. In the recorded October 18 run, an external sandbox built two images for RentAWeekend in roughly three and a half minutes. Production stayed unchanged.

The boundary matters: the agent can request a release operation within an OAuth grant without receiving the server's SSH key or an unrestricted shell. GroundControl and its executor still need infrastructure credentials; the design changes where those credentials live and what the agent can ask them to do.

## What makes the workflow agentic?

An agent selects an authorised deployment, resolves the intended source, requests a build, inspects its operation evidence, and decides whether the result meets the release criteria. It can then request a separate promotion within its grant and verify the outcome.

The build and release machinery is deterministic. The model's judgement does not grant access, make a skipped test pass, or turn an unfinished operation into success. Here “agentic” describes tool-driven orchestration of the pipeline; it does not mean unrestricted autonomy or a replacement CI product.

### Name each service and tool

| Component | Exact name used here | Responsibility |
| --- | --- | --- |
| Source hosting | GitHub repository and GitHub App installation access | Supply the selected private repository and commit |
| Optional agent-side source access | GitHub MCP Server or the client's GitHub connector | Read commits, files, and pull requests; tool names depend on the installed integration |
| Image registry | GitHub Container Registry, `ghcr.io` | Store the published images |
| Agent tool protocol | Model Context Protocol (MCP) | Expose named operations and their argument schemas |
| Release control plane | GroundControl | Enforce the grant, execute operations, retain evidence |
| Deployment discovery | `deployment.list`, `deployment.inspect` | Identify an allowed target and inspect its recorded state |
| Build request | `deployment.build_publish` | Build and publish the exact source using the selected executor |
| Operation inspection | `operation.get` | Read progress, errors, results, and evidence using the returned operation ID |
| Promotion request | `deployment.release` | Promote the verified build's digests and record the prior image set |
| External compute | Docker Agentic Platform cloud sandboxes | Supply the off-host build environment |
| Cloud sandbox CLI | Docker Sandboxes `sbx --cloud` | Create, inspect, execute within, and remove the cloud sandbox |
| Image builder and runtime | Docker / BuildKit / Compose | Build images and apply the selected runtime configuration |
| Alternative investigated | Daytona | Provide the particular sandbox configuration evaluated in the historical probe |

The cloud build provider in this account is **Docker Agentic Platform**. It is not GitHub Actions, GHCR, or the GitHub MCP Server. GHCR is the registry, not the computer performing the build.

GitHub's official MCP server is a useful agent-side source interface, but the saved build record establishes a GitHub App-authenticated clone, not that this particular MCP server was used. A client-specific name such as `github_fetch_file` is also not a universal MCP operation. Discover the connected tool schema rather than copying a wrapper name from another client.

## The Two Tools

`deployment.build_publish` builds an exact commit SHA, tags the images with that SHA, pushes them to GHCR, verifies the digest, and optionally runs the test command. It returns `{ images: [{ service, ref, digest }] }` and does **not** touch the running workload.

`deployment.release` promotes a previously built image by **immutable digest** (`repo@sha256:<digest>`), never a moving tag. It resolves the digests stored by a prior `build_publish` operation, pins them, switches the workload, and records a rollback pair. The currently exposed release tool refuses failed-test builds and has no force argument. A skipped test is not a passed test; the agent must inspect test evidence before requesting promotion.

Splitting build from release matters for one reason: a build must not change what is running, and a release must not rebuild. Bundling them means a failed build half-switches, or a release re-derives source it was never asked to touch.

## Follow the agent's tool calls

First connect a compatible MCP client to your GroundControl instance, complete its OAuth flow, and choose the deployments the grant may access. Use the tool names and schemas advertised by that connected instance.

These are **MCP tool argument examples**, not Bash commands, HTTP endpoints, or a log of another successful deployment. Choose the named tool in your connected MCP client and supply its JSON arguments. Replace every `<...>` value with real data obtained from your account or a previous tool response.

The examples follow the currently exposed GroundControl tool schemas. The measured build later in this article remains the October 18 run; adding a test-gated example does not retroactively mean that historical run exercised tests or promotion.

### 1. Inspect an allowed deployment

Call `deployment.list` with:

```json
{}
```

Then call `deployment.inspect` with a slug returned by that list:

```json
{
  "deployment": "<allowed-deployment-slug>"
}
```

**Check:** source repository, runtime target, management mode, recent release information, and public endpoint. Establish the expected current revision using actual deployment evidence if you plan to use the release guard. Do not invent it from a tag or assume that the default branch is already deployed.

Resolve the desired full commit SHA through GitHub or Git before requesting a build. The optional `branch` field is not a substitute for the exact `commitSha`.

### 2. Build with the external executor

Call `deployment.build_publish`:

```json
{
  "deployment": "<allowed-deployment-slug>",
  "commitSha": "<full-source-commit-sha>",
  "builder": "docker-agentic",
  "services": ["api", "migrate", "research-worker"],
  "runTests": true,
  "testCommand": "npm test",
  "idempotencyKey": "<unique-build-attempt-key>",
  "reason": "Validate and publish the selected commit without GitHub Actions."
}
```

**Check:** use your actual Compose service names and a test command supported by the built image. This backend-only example assumes those services share one image. Build a separately packaged web service with its own required checks where necessary. A production image that omits test code or development dependencies cannot run `npm test` merely because the source checkout could.

`builder: "docker-agentic"` is the important external-compute selection. Omitting it selects the schema's default BuildKit path on the managed host. That is a different resource boundary.

Retain the returned `operation.id`. An accepted request is not a successful build.

### 3. Inspect the durable operation

Call `operation.get` using that returned ID:

```json
{
  "operationId": "<returned-build-operation-id>"
}
```

**Check:** the operation has finished successfully, the expected service-to-image mappings exist, registry verification completed, and the required test evidence reports a pass. Inspect `error`, `evidence`, and `result` rather than interpreting a tool's successful HTTP response as build success.

If the client disconnects, inspect this operation again. Reusing the original idempotency key returns the original operation; a genuinely new attempt needs a new key. Do not keep submitting builds to discover whether the first one finished.

### 4. Promote only the checked artifact

After the build qualifies and promotion is authorised, call `deployment.release`:

```json
{
  "deployment": "<allowed-deployment-slug>",
  "buildOperationId": "<successful-build-operation-id>",
  "expectedCurrentRevision": "<verified-current-revision>",
  "idempotencyKey": "<unique-release-attempt-key>",
  "reason": "Promote the verified digest set from the checked build."
}
```

**Check:** the optional revision guard must use the revision identity understood by your deployment. If it reports a mismatch, inspect the current deployment and reassess; do not remove the guard just to bypass a concurrent release.

The release consumes the prior build's digests. It does not ask the registry to reinterpret a moving tag or rebuild the repository.

### 5. Verify the release operation and the product

Call `operation.get` with the **release** operation ID, then inspect the deployment again.

**Check:** the selected digests, migration result where applicable, runtime health, and public endpoint. Perform the authorised user workflow described in Part 1. Report any unverified product behaviour separately from a successful container switch.

A recorded rollback pair is recovery information. It does not establish that a schema-changing rollback or a zero-downtime release has been demonstrated.

## The OAuth Contract

The tools use OAuth Authorization Code with PKCE (S256). The grant defines the agent's access; the agent does not receive an SSH key:

- Scopes: `deployment:read`, `deployment:redeploy`, `operation:read`, `offline_access`.
- Every mutation returns a durable `AgentOperation` handle; the agent polls `operation.get` for the result.
- A grant is scoped to explicit deployment IDs. An agent can build one deployment and nothing else.
- The agent never receives an SSH key, a generic shell/exec tool, or a provider secret.

The agent requests a scoped operation. GroundControl executes the authorised work using credentials held by the control plane and its executor.

## The Build Executor: Why a Sandbox, and Why Docker AP

The naive version of `build_publish` builds on the VPS, right next to the running app. A `docker compose build` there competes with production for CPU and RAM; an uncapped build is how a deploy tool "hijacks resources" and destabilizes the host it is supposed to protect. There are two builders worth distinguishing: `buildkit` (the default: a dedicated, resource-capped BuildKit builder on the host) and `docker-agentic` (the off-host sandbox below). The BuildKit path got its own reliability pass: it now uses the same isolated Docker configuration across builder discovery, registry login, publishing, and pull-to-verify, and it publishes the selected Compose targets directly from BuildKit rather than through a sidecar build.

The recorded probes covered two specific sandbox configurations. These observations describe those probes, not every configuration the providers offer:

- **Daytona:** the specific default sandbox we probed had no usable Docker installation. `docker --version` inside a fresh sandbox returns exit 127 (`zsh: command not found: docker`), and the sandbox is unprivileged, so `dockerd` cannot be started. That probed configuration was unsuitable for this Docker build path; it could still support validation and reproduction work.
- **Docker Agentic Platform:** the probed `shell` template supplied Docker 29.8.1 with a working daemon. The initial sandbox in that probe was `aarch64`, which cannot cross-build for the `x86_64` production host without privileged `binfmt_misc`; `sbx --cloud create shell --platform linux/amd64` gives a **native amd64** sandbox instead. This is the executor.

The build has separate clone and per-image phases, followed by cleanup, driven through the host's `sbx` CLI:

1. **Clone once.** `sbx --cloud create shell --platform linux/amd64` → read the GitHub App source token over stdin → `git clone` the exact SHA to `/tmp/repo`.
2. **Build each unique image ref.** Read the GHCR token over stdin → `docker login ghcr.io` → `docker build` from the service's context → `docker push` → print the digest.
3. **Destroy the sandbox** in a `finally`.

In this implementation, the control plane passed tokens through stdin. That describes its transport into the sandbox; it is not a guarantee that arbitrary downstream processes cannot expose them. Review clone configuration, process arguments, retained files, and redacted logs as separate credential-handling boundaries.

### Inspect the Docker cloud tooling explicitly

**Run on the control-plane machine with the Docker Sandboxes CLI installed:**

```bash
sbx version
sbx --cloud --help
sbx --cloud ls
```

**Expected result:** the installed CLI advertises cloud operations and can list sandboxes for the authenticated Docker account. The cloud account needs valid access and its own compute allowance. Docker cloud compute is separate from GitHub Actions credits and is not assumed free.

The recorded executor used this creation command:

```bash
sbx --cloud create shell --platform linux/amd64
```

That is **historical syntax**, not a claim that every current CLI accepts the same flags. Check `sbx create --help` and the official cloud documentation for your version, and verify the resulting architecture and Docker-daemon capability before a real build. The currently published CLI reference has evolved since this run.

The walkthrough above deliberately lets GroundControl manage creation, credential handoff, execution, and cleanup. Do not independently run the sandbox command and assume the MCP operation will adopt that sandbox.

Daytona's current documentation also describes Docker-capable configurations. The failed historical default-sandbox probe is not evidence that Daytona cannot build images in any configuration.

## The Bugs the End-to-End Test Surfaced

Driving the implemented tool against the private RentAWeekend deployment surfaced six real failures, each fixed:

1. **A private repo does not clone without credentials.** `git clone https://github.com/…` inside the sandbox has no ambient auth. Fix: read the GitHub App installation token from stdin and authenticate the clone with it (as `x-access-token`), instead of relying on credentials the sandbox does not have.

2. **`docker compose config` resolves build paths to absolute VPS paths.** `context: ./backend` comes back as `/opt/<app>/backend`, which does not exist in the sandbox (it clones to `/tmp/repo`). Fix: relativize the context and dockerfile against the project path.

3. **`docker build -f` is relative to the working directory, not the context.** Compose's `dockerfile` is relative to the context. Passing `-f Dockerfile` with a subdirectory context makes Docker look for the Dockerfile in the wrong place. Fix: skip `-f` for the default `Dockerfile`, otherwise anchor it to the context path.

4. **Several services can share one image.** `api`, `migrate`, and `research-worker` all build the same backend. Building once per service repeats the same backend build. Fix: build each unique image ref once, then map the digest back to each service.

5. **Clone once, build per ref.** Re-running the full clone-plus-build script per service failed on the second service with `destination path '/tmp/repo' already exists`. Fix: split the sandbox into a single clone phase and a per-ref build phase.

6. **A worker bug masked a successful build as failed.** `executeBuildPublish` treated `fetchJson`'s `{ response, body }` return as `{ ok, status, body }`, so `response.ok` and `response.status` were always `undefined`; the operation reported `Build failed with HTTP undefined` **after** the images had already been pushed. Fix: destructure `{ response, body }` like the sibling execute functions.

These failures surfaced while exercising the integrated path. Focused tests can preserve the fixes, but a passing type check had not established that the whole workflow worked.

## Measured Result

A real `deployment.build_publish` against the RentAWeekend deployment (private repo, `f1e33a80801d4ab990c6e2508019275626c7786e`, `builder=docker-agentic`) produced, in one sandbox and roughly three and a half minutes:

| Service(s) | Digest |
| --- | --- |
| `api` + `migrate` + `research-worker` (deduped) | `ghcr.io/teckedd-code2save/rentaweekend-api@sha256:63c092db3819f142d699b71540a4d06bf8210aa8c605e2df25e14c91e2d8ebb8` |
| `web` | `ghcr.io/teckedd-code2save/rentaweekend-web@sha256:2d29ecd480c010932ea713ef7416584bcd1c29cd4969ebe5dae14e52dca0f29b` |

The sandbox was destroyed afterward, and the production workload was never touched.

## Build Evidence, Not Just a Digest

A verified registry artifact has a precise content identity. Its digest does not establish that tests passed or that the application behaves correctly. A follow-on pass made the operation's evidence as complete as the manual runbook demanded:

- **Full output, not the tail.** Build operations retain complete redacted stdout and stderr per phase in `evidence.logs` (and `result.logs` on success). The short error string is derived from the final output lines; it is not the stored log. JSON evidence is never truncated as a serialized string, and host command capture drains both streams past the ~1 MiB limit that `child_process.exec` otherwise imposes.
- **One test run per distinct image.** Requested tests execute once per distinct image, not once per service, with both output streams recorded, so an `api`/`migrate`/`worker` image is tested once, not three times.
- **Shared image variables advance together.** On release, a variable now matches even when the Compose file declares a default or a required-value message (`${API_IMAGE:-fallback}`, `${API_IMAGE?error}`), so the `api` and `worker` references move to the same digest instead of one silently lagging.

## What This Does and Does Not Prove

The recorded run demonstrated cloning private source, building and publishing two images in an external sandbox, mapping shared service images, and cleaning up the sandbox. It did not switch the production workload. That is evidence for the build path, not a completed demonstration of every release and recovery guarantee.

Not yet proven end-to-end, and the next nodes: a zero-downtime switch, a test-gated promotion on a live change (the tests path is wired to run once per distinct image with full evidence, but was not exercised against a live deployment in this series), and rollback of a schema-changing release. Those are separate from "does the isolated builder work," and they should be measured by exercising the complete operation and inspecting its evidence.

## The boundary that remains operational

Replacing GitHub Actions does not remove authentication dependencies. The external builder still needs valid provider access, the source clone needs repository access, and publishing needs GHCR push permission. Failure in any one of those credentials can block the next run even after a successful historical build. Keep each phase's error and operation state visible so “build failed” does not conceal whether cloning, provider authentication, testing, or publishing failed.

This article preserves the October 18 result. It does not certify current builder availability. The reusable outcome is a release contract with explicit source and artifact identities, a separate promotion step, and evidence that survives a disconnected client.

## Tools and official references

| Tool or contract | Reference |
| --- | --- |
| GroundControl implementation and MCP access | [GroundControl repository](https://github.com/teckedd-code2save/groundcontrol) |
| GitHub agent-side repository access | [Official GitHub MCP Server](https://github.com/github/github-mcp-server) |
| Private-source authentication | [GitHub App installation authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation) |
| Registry credentials and images | [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) |
| MCP named tools and schemas | [MCP tools specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) |
| OAuth and PKCE | [MCP authorisation specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) |
| External sandbox provider | [Docker Agentic Platform](https://docs.docker.com/agentic-platform) |
| Cloud execution and prerequisites | [Docker cloud sandboxes](https://docs.docker.com/ai/sandboxes/cloud/) |
| Sandbox lifecycle commands | [sbx CLI](https://docs.docker.com/reference/cli/sbx/), [create](https://docs.docker.com/reference/cli/sbx/create/), [exec](https://docs.docker.com/reference/cli/sbx/exec/), [remove](https://docs.docker.com/reference/cli/sbx/rm/) |
| Image construction | [BuildKit](https://docs.docker.com/build/buildkit/) and [Buildx build](https://docs.docker.com/reference/cli/docker/buildx/build/) |
| Runtime promotion | [Docker Compose](https://docs.docker.com/compose/) |
| Sandbox alternative | [Daytona Docker documentation](https://www.daytona.com/docs/docker) |

GroundControl's `deployment.*` and `operation.get` names are application-defined tools. The MCP standard explains how a client discovers and calls them; it does not implement GroundControl's release semantics. GitHub's MCP server, Docker's CLI, and Daytona's API each have their own contracts.
