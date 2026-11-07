# I Ran Out of GitHub Actions Credits: CI Without GitHub Actions

[Series index](README.md) | [Next: Agentic CI with scoped MCP tools](02-mcp-release-tool.md)

*By Edward Kwabena Twumasi. Original account: 18 October 2026. Practical walkthrough revised: 7 November 2026.*

I ran out of GitHub Actions credits. My code was still on GitHub, my images could still live in GitHub Container Registry (GHCR), and my application was still running. What I had lost was the runner that normally connected those pieces.

I needed somewhere else to check the code, build the images, and publish them. I also needed a release procedure that could identify exactly what was being deployed and recover if it failed.

The answer was to keep the checks and replace the executor. This article walks through the manual version. Part 2 turns the same workflow into an agentic operation through GroundControl and an external Docker cloud sandbox.

Strictly speaking, running these commands by hand is a fallback for the CI pipeline. It becomes continuous integration again when a runner or orchestrator triggers the same checks on each change. “Without GitHub Actions” does not mean “without tests.”

## 1. Know which part stopped working

| Tool | Role in this workflow |
| --- | --- |
| Git and GitHub | Store the repository and identify the source commit |
| Alternative build machine | Run checks and build the image |
| Docker Buildx / BuildKit | Build for the runtime architecture and publish the artifact |
| GHCR | Store the resulting image |
| SSH and SCP | Access the runtime host and transfer the small release record |
| Docker Compose | Recreate the selected application services |
| Bash, jq, curl | Coordinate commands, read metadata, and check the public endpoint |

GitHub Actions and GHCR are separate services. An exhausted Actions allowance does not by itself prevent a permitted client from pushing to GHCR.

**Check on the build machine:**

```bash
git --version
docker version
docker buildx version
jq --version
```

**Expected result:** Git, the Docker client and daemon, Buildx, and jq are available. The machine also needs the application's test runtime. For the Node.js example below, that means a compatible Node.js and npm installation.

An ARM workstation must have a builder that supports the target platform. Check with `docker buildx inspect --bootstrap`. If it cannot build for the runtime architecture, use a suitable native builder rather than assuming `--platform` supplies missing emulation.

## 2. Define the example before copying commands

This walkthrough builds one backend image consumed by three existing Compose services:

- `api`: the long-running HTTP service.
- `worker`: a long-running background worker.
- `migrate`: a one-shot migration service with its command already defined.

The application already runs under Compose. Its database and other dependencies remain running. This example does not change the base Compose files, runtime secrets, or deployment topology. Both long-running services must define meaningful healthchecks.

Run the build steps in one **Bash** session on the build machine. Run the host steps in a second **Bash** session after SSH. Replace the sample values first; `example`, `YOUR_FULL_COMMIT_SHA`, and `app.example.com` are placeholders.

**Build machine:**

```bash
bash
set -euo pipefail
umask 077

REPO_URL='https://github.com/example/my-app.git'
RELEASE_SHA='YOUR_FULL_COMMIT_SHA'
IMAGE_REPO='ghcr.io/example/my-app-api'
GHCR_USER='example'
TARGET_PLATFORM='linux/amd64'

[[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]
RELEASE_DIR="$HOME/release-records/$RELEASE_SHA"
mkdir -p "$RELEASE_DIR"
```

**Expected result:** the SHA check passes and a private release-record directory exists. A placeholder SHA fails the check deliberately. The commands below assume this repository keeps its Node.js backend and Dockerfile in `backend/`; adapt those paths to your repository.

## 3. Check out the exact source

**Run on the build machine:**

```bash
BUILD_ROOT="$(mktemp -d)"
git clone "$REPO_URL" "$BUILD_ROOT/repo"
cd "$BUILD_ROOT/repo"
git checkout --detach "$RELEASE_SHA"

test "$(git rev-parse HEAD)" = "$RELEASE_SHA"
test -z "$(git status --porcelain)"
git rev-parse HEAD > "$RELEASE_DIR/source-sha.txt"
```

**Expected result:** the checkout is detached at the selected commit and has no local changes. A private repository needs its own Git authentication; GHCR login does not grant repository access.

Inspect `backend/.dockerignore` and the complete build context before building. Exclude runtime environment files and credentials. A clean Git status alone does not establish a safe image context.

## 4. Run the checks before building

Here is a concrete Node.js example. It assumes the backend's package scripts are named `lint` and `test`, and that tests terminate. Replace them with your project's actual required checks; provision isolated test dependencies where needed.

**Run on the build machine, from the detached checkout:**

```bash
(
  cd backend
  npm ci
  npm run lint
  npm test
) 2>&1 | tee "$RELEASE_DIR/checks.log"

printf 'passed\n' > "$RELEASE_DIR/checks.status"
```

**Expected result:** every command exits zero and `checks.status` contains `passed`. Because this Bash session uses `pipefail`, a failing check is not hidden by a successful `tee`. Do not continue after a failure.

These checks validate the selected source. If the application also needs tests inside the packaged image, run those separately before promotion. Passing host-side tests does not establish that the runtime image contains everything the application needs.

## 5. Authenticate to GHCR

Outside an Actions workflow, configure a GHCR-supported credential. GitHub documents a personal access token (classic), with `write:packages` for publishing and `read:packages` for pulling private images, subject to the account's package access and any organisation requirements.

The following interactive example reads the token without echoing it. It uses the build machine's configured Docker context and credential store.

**Run on the build machine:**

```bash
read -r -s -p 'GHCR push token: ' GHCR_TOKEN
printf '\n'
printf '%s' "$GHCR_TOKEN" |
  docker login ghcr.io --username "$GHCR_USER" --password-stdin
unset GHCR_TOKEN
```

**Expected result:** login succeeds. That establishes authentication; the subsequent push establishes access to the chosen package.

Docker's credential store or configuration retains the login. Keep it private and outside build contexts and uploads. On a disposable build machine, log out after the final pull verification with `docker logout ghcr.io`. The runtime host should have a separately provisioned pull credential. An Actions `GITHUB_TOKEN` is not automatically available on an unrelated machine.

## 6. Build and publish once

Build from the exact source, label the revision, publish to GHCR, and save Buildx metadata.

**Run on the build machine, from the detached checkout:**

```bash
test "$(cat "$RELEASE_DIR/checks.status")" = 'passed'

docker buildx build \
  --platform "$TARGET_PLATFORM" \
  --label "org.opencontainers.image.revision=$RELEASE_SHA" \
  --tag "$IMAGE_REPO:$RELEASE_SHA" \
  --metadata-file "$RELEASE_DIR/build-metadata.json" \
  --progress plain \
  --push \
  ./backend 2>&1 | tee "$RELEASE_DIR/build.log"
```

**Expected result:** the build and push complete successfully, and the metadata file contains the published image digest. This is one shared backend image, not three independent builds for `api`, `worker`, and `migrate`.

Keep the logs private until reviewed. Do not assume arbitrary application build output is free of secrets. If your Dockerfile needs a nondefault path, pass `--file ./backend/path/to/Dockerfile` explicitly.

## 7. Verify the artifact by digest

**Run on the build machine:**

```bash
DIGEST="$(jq -er '."containerimage.digest"' \
  "$RELEASE_DIR/build-metadata.json")"
[[ "$DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]]
IMAGE_REF="$IMAGE_REPO@$DIGEST"

docker pull --platform "$TARGET_PLATFORM" "$IMAGE_REF"

test "$(docker image inspect "$IMAGE_REF" \
  --format '{{.Architecture}}')" = 'amd64'
test "$(docker image inspect "$IMAGE_REF" \
  --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" \
  = "$RELEASE_SHA"

printf '%s\n' "$IMAGE_REF" > "$RELEASE_DIR/image-ref.txt"
```

**Expected result:** GHCR serves the digest-pinned artifact, and its architecture and declared source revision match the release. Change the architecture assertion if your runtime is not amd64.

The digest identifies the built content. A revision label is a declaration, not independent proof of source provenance. Retain the checkout identity, checks, and build evidence. Unpinned dependencies or base images can still produce a different artifact from the same commit.

Prepare a small, non-secret override that pins every shared-image consumer:

```bash
cat > "$RELEASE_DIR/candidate.yml" <<EOF
services:
  api:
    image: "$IMAGE_REF"
  worker:
    image: "$IMAGE_REF"
  migrate:
    image: "$IMAGE_REF"
EOF
```

**Expected result:** all three services reference the same immutable image. Applications with separate frontend and backend images need separate verified digests for each.

## 8. Record the running deployment before changing it

Coordinate one release owner. Pause competing automatic rollouts through your normal operating process, then connect to the host using the established SSH identity. Keep host-key verification enabled.

**From your workstation:**

```bash
ssh deploy@app.example.com
```

**On the runtime host, start a fresh Bash session:**

```bash
bash
set -euo pipefail
umask 077

APP_DIR='/srv/my-app'
PROJECT='my-app'
RELEASE_SHA='YOUR_FULL_COMMIT_SHA'
[[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]

HOST_RECORD="$HOME/release-records/$RELEASE_SHA"
mkdir -p "$HOST_RECORD"
cd "$APP_DIR"

base=(docker compose -p "$PROJECT" -f compose.yml)
# Add every existing override to this array, in its original order.

"${base[@]}" config --quiet
"${base[@]}" ps > "$HOST_RECORD/before.txt"
df -h "$APP_DIR"
```

**Expected result:** configuration validation passes, the correct project appears, and disk headroom is sufficient. `config --quiet` validates without printing resolved secrets.

Capture the current shared image. This simplified recovery example requires the existing API and worker to use the same digest-pinned reference.

```bash
API_ID="$("${base[@]}" ps -q api)"
WORKER_ID="$("${base[@]}" ps -q worker)"
test -n "$API_ID"
test -n "$WORKER_ID"

PRIOR_IMAGE="$(docker inspect "$API_ID" --format '{{.Config.Image}}')"
test "$PRIOR_IMAGE" = \
  "$(docker inspect "$WORKER_ID" --format '{{.Config.Image}}')"
[[ "$PRIOR_IMAGE" =~ @sha256:[0-9a-f]{64}$ ]]

docker inspect "$API_ID" "$WORKER_ID" \
  --format '{{.Name}} {{.Config.Image}} {{.Image}}' \
  > "$HOST_RECORD/prior-images.txt"

cat > "$HOST_RECORD/prior.yml" <<EOF
services:
  api:
    image: "$PRIOR_IMAGE"
  worker:
    image: "$PRIOR_IMAGE"
  migrate:
    image: "$PRIOR_IMAGE"
EOF
```

**Expected result:** the previous shared digest and running image IDs are recorded. If the services differ, have replicas, or use mutable tags, stop and capture a verified per-service recovery set instead. Do not substitute today's value of an old tag for the image that actually created the running container.

## 9. Transfer and validate the candidate

**From the build-machine session**, set the actual login and the absolute record directory created on the runtime host:

```bash
DEPLOY_TARGET='deploy@app.example.com'
REMOTE_RECORD='/home/deploy/release-records/YOUR_FULL_COMMIT_SHA'

scp "$RELEASE_DIR/candidate.yml" \
    "$RELEASE_DIR/image-ref.txt" \
    "$RELEASE_DIR/source-sha.txt" \
    "$DEPLOY_TARGET:$REMOTE_RECORD/"
```

**Back on the runtime host:**

```bash
test "$(cat "$HOST_RECORD/source-sha.txt")" = "$RELEASE_SHA"
candidate=("${base[@]}" -f "$HOST_RECORD/candidate.yml")

"${candidate[@]}" config --quiet
"${candidate[@]}" pull api worker migrate
```

**Expected result:** the host can pull the candidate images using its registry access. No application container has been replaced yet. If base configuration or runtime inputs changed since the snapshot, reassess before continuing.

## 10. Run the migration, then switch

This example assumes a reviewed, backward-compatible migration that can run while the old application remains live. The migration service's existing command must exit nonzero on failure. A breaking schema migration needs a different, application-specific sequence.

**Run on the runtime host:**

```bash
"${candidate[@]}" run --rm --no-deps -T migrate \
  > "$HOST_RECORD/migration.log" 2>&1
printf 'passed\n' > "$HOST_RECORD/migration.status"

"${candidate[@]}" up -d --no-build --no-deps api worker
```

**Expected result:** the one-shot migration exits zero, then Compose recreates the API and worker from the candidate configuration. A failed migration stops the Bash session before the switch. Inspect its log privately; do not retry a partially applied migration without understanding its state.

The override is supplied **before** recreation. Updating an image variable afterward would not change which image the earlier command selected. This operation can interrupt service and does not claim zero downtime.

## 11. Check health and a real user outcome

**Run on the runtime host:**

```bash
"${candidate[@]}" up -d --no-build --no-deps \
  --wait --wait-timeout 120 api worker

for service in api worker; do
  container_id="$("${candidate[@]}" ps -q "$service")"
  test -n "$container_id"
  test "$(docker inspect "$container_id" \
    --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}')" \
    = 'healthy'
  test "$(docker inspect "$container_id" --format '{{.Config.Image}}')" \
    = "$(cat "$HOST_RECORD/image-ref.txt")"
done

curl --fail --silent --show-error \
  --connect-timeout 10 --max-time 30 \
  'https://app.example.com/health'
```

**Expected result:** both services are healthy, both run the selected image reference, and the application-specific public health endpoint succeeds. Substitute your real endpoint.

Then perform one authorised user workflow: for example, submit a test plan and verify the background job reaches a useful terminal outcome. A successful app-shell request cannot prove that private workflows or workers function.

Only after those checks pass, record acceptance:

```bash
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$HOST_RECORD/accepted-at.txt"
```

Make the accepted override the deployment's normal input through your existing release configuration. Future recreations must use the same image set and Compose file order. The override does not become permanent merely because the one command used it.

## 12. Recover explicitly if the candidate fails

A health gate detects a failed release; it does not restore the prior containers.

Before running this recovery example, confirm that the prior binary remains compatible with the database after any migration. This restores application images only.

**Run in a fresh Bash session on the runtime host**, restoring `APP_DIR`, `PROJECT`, `HOST_RECORD`, and the exact `base` array from step 8:

```bash
cd "$APP_DIR"
rollback=("${base[@]}" -f "$HOST_RECORD/prior.yml")

"${rollback[@]}" config --quiet
"${rollback[@]}" pull api worker
"${rollback[@]}" up -d --no-build --no-deps \
  --wait --wait-timeout 120 api worker
```

**Expected result:** the prior application images are running. Repeat the explicit health and image checks from step 11 against the references in `prior.yml`, then repeat the public and user-workflow checks. Reconcile the accepted deployment inputs afterward.

If the schema is incompatible, use the reviewed database recovery procedure. Do not treat deleting volumes or restoring an old database over new writes as an image rollback.

## What survived the lost credits

The source stayed on GitHub. The image stayed in GHCR. The checks, source identity, image verification, health gate, and recovery record remained part of the release.

What changed was the executor and the way we triggered it. I could ship while GitHub Actions was unavailable, with explicit evidence for which code had been checked, which image had been published, and which workload had actually changed.

The next step was to expose that procedure to an agent without handing the agent an unrestricted production shell.

[Part 2: Agentic CI Without GitHub Actions](02-mcp-release-tool.md)

## Tools and official references

- [Git: detached checkout](https://git-scm.com/docs/git-checkout) and [worktrees](https://git-scm.com/docs/git-worktree).
- [GitHub Actions billing](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions): the runner allowance that triggered this fallback.
- [GHCR authentication, push, and pull](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).
- [Docker Buildx build](https://docs.docker.com/reference/cli/docker/buildx/build/): platform selection, push, and metadata output.
- [Docker image inspect](https://docs.docker.com/reference/cli/docker/image/inspect/) and [container inspect](https://docs.docker.com/reference/cli/docker/container/inspect/).
- [Docker Compose](https://docs.docker.com/compose/), [run](https://docs.docker.com/reference/cli/docker/compose/run/), [up](https://docs.docker.com/reference/cli/docker/compose/up/), and [environment precedence](https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/).
- [npm ci](https://docs.npmjs.com/cli/commands/npm-ci), [Bash](https://www.gnu.org/software/bash/manual/bash.html), and [jq](https://jqlang.org/manual/).
- [OpenSSH manuals](https://www.openssh.com/manual.html) for SSH/SCP and [curl](https://curl.se/docs/manpage.html) for HTTP checks.

The commands are an adaptable walkthrough, not a newly executed deployment of this example application. The historical deployment evidence remains in Part 2.
