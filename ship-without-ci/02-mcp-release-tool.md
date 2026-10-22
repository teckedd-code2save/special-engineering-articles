# Replacing GitHub Actions with a Scoped MCP Build and Release Workflow

[Series index](README.md) | [Previous: the runbook](01-ssh-compose-ghcr-runbook.md)

**Written 18 October 2026. Part 2 of 2. the manual path, turned into a machine-callable tool.**

GitHub Actions was unavailable, but our GitHub repository and GHCR were still useful. The manual path in Part 1 supplied another build executor and a controlled release procedure. The next step was to make that procedure callable by an agent.

GroundControl exposes separate operations to build and publish an artifact, then promote an existing artifact. In the recorded October 18 run, an external sandbox built two images for RentAWeekend in roughly three and a half minutes. Production stayed unchanged.

The boundary matters: the agent can request a release operation within an OAuth grant without receiving the server's SSH key or an unrestricted shell. GroundControl and its executor still need infrastructure credentials; the design changes where those credentials live and what the agent can ask them to do.

## The Two Tools

`deployment.build_publish` builds an exact commit SHA, tags the images with that SHA, pushes them to GHCR, verifies the digest, and optionally runs the test command. It returns `{ images: [{ service, ref, digest }] }` and does **not** touch the running workload.

`deployment.release` promotes a previously built image by **immutable digest** (`repo@sha256:<digest>`), never a moving tag. It resolves the digests stored by a prior `build_publish` operation, pins them, switches the workload, and records a rollback pair. It refuses to promote a build whose tests failed unless explicitly forced.

Splitting build from release matters for one reason: a build must not change what is running, and a release must not rebuild. Bundling them means a failed build half-switches, or a release re-derives source it was never asked to touch.

## The OAuth Contract

The tools sit behind OAuth. Authorization Code + PKCE with S256. not a static token and not an SSH key:

- Scopes: `deployment:read`, `deployment:redeploy`, `operation:read`, `offline_access`.
- Every mutation returns a durable `AgentOperation` handle; the agent polls `operation.get` for the result.
- A grant is scoped to explicit deployment IDs. An agent can build one deployment and nothing else.
- The agent never receives an SSH key, a generic shell/exec tool, or a provider secret.

The consequence is the one part 1 asked for: the agent gets release capability without ever holding the means to reach the host directly.

## The Build Executor: Why a Sandbox, and Why Docker AP

The naive version of `build_publish` builds on the VPS, right next to the running app. A `docker compose build` there competes with production for CPU and RAM; an uncapped build is how a deploy tool "hijacks resources" and destabilizes the host it is supposed to protect. There are two builders worth distinguishing: `buildkit` (the default. a dedicated, resource-capped BuildKit builder on the host) and `docker-agentic` (the off-host sandbox below). The BuildKit path got its own reliability pass: it now uses the same isolated Docker configuration across builder discovery, registry login, publishing, and pull-to-verify, and it publishes the selected Compose targets directly from BuildKit rather than through a sidecar build.

The recorded probes covered two specific sandbox configurations. These observations describe those probes, not every configuration the providers offer:

- **Daytona**. its default sandbox has no Docker daemon. `docker --version` inside a fresh sandbox returns exit 127 (`zsh: command not found: docker`), and the sandbox is unprivileged, so `dockerd` cannot be started. That probed configuration was unsuitable for this Docker build path; it could still support validation and reproduction work.
- **Docker Agentic Platform**. its `shell` template ships Docker 29.8.1 with a working daemon. The default sandbox is `aarch64`, which cannot cross-build for the `x86_64` production host without privileged `binfmt_misc`; `sbx --cloud create shell --platform linux/amd64` gives a **native amd64** sandbox instead. This is the executor.

The build has separate clone and per-image phases, followed by cleanup, driven through the host's `sbx` CLI:

1. **Clone once.** `sbx --cloud create shell --platform linux/amd64` → read the GitHub App source token over stdin → `git clone` the exact SHA to `/tmp/repo`.
2. **Build each unique image ref.** Read the GHCR token over stdin → `docker login ghcr.io` → `docker build` from the service's context → `docker push` → print the digest.
3. **Destroy the sandbox** in a `finally`.

Both tokens arrive over stdin and never appear in the command text.

## The Bugs the End-to-End Test Surfaced

Driving the implemented tool against the private RentAWeekend deployment surfaced six real failures, each fixed:

1. **A private repo does not clone without credentials.** `git clone https://github.com/…` inside the sandbox has no ambient auth. Fix: read the GitHub App installation token from stdin and authenticate the clone with it (as `x-access-token`), instead of relying on credentials the sandbox does not have.

2. **`docker compose config` resolves build paths to absolute VPS paths.** `context: ./backend` comes back as `/opt/<app>/backend`, which does not exist in the sandbox (it clones to `/tmp/repo`). Fix: relativize the context and dockerfile against the project path.

3. **`docker build -f` is relative to the working directory, not the context.** Compose's `dockerfile` is relative to the context. Passing `-f Dockerfile` with a subdirectory context makes Docker look for the Dockerfile in the wrong place. Fix: skip `-f` for the default `Dockerfile`, otherwise anchor it to the context path.

4. **Several services can share one image.** `api`, `migrate`, and `research-worker` all build the same backend. Building per-service builds the same image four times. Fix: build each unique image ref once, then map the digest back to each service.

5. **Clone once, build per ref.** Re-running the full clone-plus-build script per service failed on the second service with `destination path '/tmp/repo' already exists`. Fix: split the sandbox into a single clone phase and a per-ref build phase.

6. **A worker bug masked a successful build as failed.** `executeBuildPublish` treated `fetchJson`'s `{ response, body }` return as `{ ok, status, body }`, so `response.ok` and `response.status` were always `undefined`. the operation reported `Build failed with HTTP undefined` **after** the images had already been pushed. Fix: destructure `{ response, body }` like the sibling execute functions.

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

- **Full output, not the tail.** Build operations retain complete redacted stdout and stderr per phase in `evidence.logs` (and `result.logs` on success). The short error string is derived from the final output lines. it is not the stored log. JSON evidence is never truncated as a serialized string, and host command capture drains both streams past the ~1 MiB limit that `child_process.exec` otherwise imposes.
- **One test run per distinct image.** Requested tests execute once per distinct image, not once per service, with both output streams recorded. so an `api`/`migrate`/`worker` image is tested once, not three times.
- **Shared image variables advance together.** On release, a variable now matches even when the Compose file declares a default or a required-value message (`${API_IMAGE:-fallback}`, `${API_IMAGE?error}`), so the `api` and `worker` references move to the same digest instead of one silently lagging.

## What This Does and Does Not Prove

The recorded run demonstrated cloning private source, building and publishing two images in an external sandbox, mapping shared service images, and cleaning up the sandbox. It did not switch the production workload. That is evidence for the build path, not a completed demonstration of every release and recovery guarantee.

Not yet proven end-to-end, and the next nodes: a zero-downtime switch, a test-gated promotion on a live change (the tests path is wired to run once per distinct image with full evidence, but was not exercised against a live deployment in this series), and rollback of a schema-changing release. Those are separate from "does the isolated builder work," and they should be measured the same way. by running them, not by reading the schema.

## The boundary that remains operational

Replacing GitHub Actions does not remove authentication dependencies. The external builder still needs valid provider access, the source clone needs repository access, and publishing needs GHCR push permission. Failure in any one of those credentials can block the next run even after a successful historical build. Keep each phase's error and operation state visible so “build failed” does not conceal whether cloning, provider authentication, testing, or publishing failed.

This article preserves the October 18 result. It does not certify current builder availability. The reusable outcome is a release contract with explicit source and artifact identities, a separate promotion step, and evidence that survives a disconnected client.
