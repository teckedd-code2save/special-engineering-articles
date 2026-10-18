# From Runbook to Capability: The MCP Release Tool and an Off-Host Build Executor

[Series index](README.md) | [Previous: the runbook](01-ssh-compose-ghcr-runbook.md)

**Written 18 October 2026. Part 2 of 2 — the manual path, turned into a machine-callable tool.**

## What Changed Since the Runbook

Part 1 ended with the ceiling of the manual path: whoever runs it needs an SSH key, a shell, and the nerve to type destructive commands on a production box. That ceiling is now removed, in code, and tested against a real deployment.

The five concerns from part 1 — source, registry, build executor, control plane, running app — are now exposed as two scoped MCP tools, and the build executor is no longer "the box or CI." It is an ephemeral Docker Agentic Platform sandbox that builds the image fully off-host.

## The Two Tools

`deployment.build_publish` builds an exact commit SHA, tags the images with that SHA, pushes them to GHCR, verifies the digest, and optionally runs the test command. It returns `{ images: [{ service, ref, digest }] }` and does **not** touch the running workload.

`deployment.release` promotes a previously built image by **immutable digest** (`repo@sha256:<digest>`), never a moving tag. It resolves the digests stored by a prior `build_publish` operation, pins them, switches the workload, and records a rollback pair. It refuses to promote a build whose tests failed unless explicitly forced.

Splitting build from release matters for one reason: a build must not change what is running, and a release must not rebuild. Bundling them means a failed build half-switches, or a release re-derives source it was never asked to touch.

## The OAuth Contract

The tools sit behind OAuth — Authorization Code + PKCE with S256 — not a static token and not an SSH key:

- Scopes: `deployment:read`, `deployment:redeploy`, `operation:read`, `offline_access`.
- Every mutation returns a durable `AgentOperation` handle; the agent polls `operation.get` for the result.
- A grant is scoped to explicit deployment IDs. An agent can build one deployment and nothing else.
- The agent never receives an SSH key, a generic shell/exec tool, or a provider secret.

The consequence is the one part 1 asked for: the agent gets release capability without ever holding the means to reach the host directly.

## The Build Executor: Why a Sandbox, and Why Docker AP

The naive version of `build_publish` builds on the VPS, right next to the running app. A `docker compose build` there competes with production for CPU and RAM; an uncapped build is how a deploy tool "hijacks resources" and destabilizes the host it is supposed to protect. There are two builders worth distinguishing: `buildkit` (the default — a dedicated, resource-capped BuildKit builder on the host) and `docker-agentic` (the off-host sandbox below). The BuildKit path got its own reliability pass: it now uses the same isolated Docker configuration across builder discovery, registry login, publishing, and pull-to-verify, and it publishes the selected Compose targets directly from BuildKit rather than through a sidecar build.

The two off-box candidates were evaluated with a live probe, not a brochure:

- **Daytona** — its default sandbox has no Docker daemon. `docker --version` inside a fresh sandbox returns exit 127 (`zsh: command not found: docker`), and the sandbox is unprivileged, so `dockerd` cannot be started. Daytona stays the right tool for validation/repro, not image builds.
- **Docker Agentic Platform** — its `shell` template ships Docker 29.8.1 with a working daemon. The default sandbox is `aarch64`, which cannot cross-build for the `x86_64` production host without privileged `binfmt_misc`; `sbx --cloud create shell --platform linux/amd64` gives a **native amd64** sandbox instead. This is the executor.

The build flow is two phases, both driven through the host's `sbx` CLI:

1. **Clone once.** `sbx --cloud create shell --platform linux/amd64` → read the GitHub App source token over stdin → `git clone` the exact SHA to `/tmp/repo`.
2. **Build each unique image ref.** Read the GHCR token over stdin → `docker login ghcr.io` → `docker build` from the service's context → `docker push` → print the digest.
3. **Destroy the sandbox** in a `finally`.

Both tokens arrive over stdin and never appear in the command text.

## The Bugs the End-to-End Test Surfaced

A unit-tested but un-run builder is a fiction. Driving the real tool against the private RentAWeekend deployment surfaced six real failures, each fixed:

1. **A private repo does not clone without credentials.** `git clone https://github.com/…` inside the sandbox has no ambient auth. Fix: read the GitHub App installation token from stdin and authenticate the clone with it (as `x-access-token`), instead of relying on credentials the sandbox does not have.

2. **`docker compose config` resolves build paths to absolute VPS paths.** `context: ./backend` comes back as `/opt/<app>/backend`, which does not exist in the sandbox (it clones to `/tmp/repo`). Fix: relativize the context and dockerfile against the project path.

3. **`docker build -f` is relative to the working directory, not the context.** Compose's `dockerfile` is relative to the context. Passing `-f Dockerfile` with a subdirectory context makes Docker look for the Dockerfile in the wrong place. Fix: skip `-f` for the default `Dockerfile`, otherwise anchor it to the context path.

4. **Several services can share one image.** `api`, `migrate`, and `research-worker` all build the same backend. Building per-service builds the same image four times. Fix: build each unique image ref once, then map the digest back to each service.

5. **Clone once, build per ref.** Re-running the full clone-plus-build script per service failed on the second service with `destination path '/tmp/repo' already exists`. Fix: split the sandbox into a single clone phase and a per-ref build phase.

6. **A worker bug masked a successful build as failed.** `executeBuildPublish` treated `fetchJson`'s `{ response, body }` return as `{ ok, status, body }`, so `response.ok` and `response.status` were always `undefined` — the operation reported `Build failed with HTTP undefined` **after** the images had already been pushed. Fix: destructure `{ response, body }` like the sibling execute functions.

Every one of these was caught only by running the real path, not by the type checker.

## Measured Result

A real `deployment.build_publish` against the RentAWeekend deployment (private repo, `f1e33a80801d4ab990c6e2508019275626c7786e`, `builder=docker-agentic`) produced, in one sandbox and roughly three and a half minutes:

| Service(s) | Digest |
| --- | --- |
| `api` + `migrate` + `research-worker` (deduped) | `ghcr.io/teckedd-code2save/rentaweekend-api@sha256:63c092db3819f142d699b71540a4d06bf8210aa8c605e2df25e14c91e2d8ebb8` |
| `web` | `ghcr.io/teckedd-code2save/rentaweekend-web@sha256:2d29ecd480c010932ea713ef7416584bcd1c29cd4969ebe5dae14e52dca0f29b` |

The sandbox was destroyed afterward, and the production workload was never touched.

## Build Evidence, Not Just a Digest

A digest proves an artifact exists; it does not prove the build was clean. A follow-on pass made the operation's evidence as complete as the manual runbook demanded:

- **Full output, not the tail.** Build operations retain complete redacted stdout and stderr per phase in `evidence.logs` (and `result.logs` on success). The short error string is derived from the final output lines — it is not the stored log. JSON evidence is never truncated as a serialized string, and host command capture drains both streams past the ~1 MiB limit that `child_process.exec` otherwise imposes.
- **One test run per distinct image.** Requested tests execute once per distinct image, not once per service, with both output streams recorded — so an `api`/`migrate`/`worker` image is tested once, not three times.
- **Shared image variables advance together.** On release, a variable now matches even when the Compose file declares a default or a required-value message (`${API_IMAGE:-fallback}`, `${API_IMAGE?error}`), so the `api` and `worker` references move to the same digest instead of one silently lagging.

## What This Does and Does Not Prove

Proven: the runbook is now a machine-callable capability with the same evidence and reversibility the manual path demanded, and the image build runs entirely off the production host.

Not yet proven end-to-end, and the next nodes: a zero-downtime switch, a test-gated promotion on a live change (the tests path is wired to run once per distinct image with full evidence, but was not exercised against a live deployment in this series), and rollback of a schema-changing release. Those are separate from "does the isolated builder work," and they should be measured the same way — by running them, not by reading the schema.
