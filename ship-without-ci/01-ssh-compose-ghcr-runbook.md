# I Ran Out of GitHub Actions Credits: CI Without GitHub Actions

[Series index](README.md) | [Next: Agentic CI with scoped MCP tools](02-mcp-release-tool.md)

*By Edward Kwabena Twumasi. Original account: 18 October 2026. Practical walkthrough revised: 7 November 2026.*

I ran out of GitHub Actions credits, but GitHub still hosted my code and GHCR still accepted images. I replaced the build runner and kept the checks, registry, and release process.

This is the manual fallback. Part 2 automates it through [GroundControl](https://github.com/teckedd-code2save/groundcontrol), my self-hosted control plane for agent-driven deployment operations. Triggering these checks on each change restores continuous integration.

## Where each step runs

| Platform | Software | Work |
| --- | --- | --- |
| Your Mac: build machine | Docker Desktop running Linux containers, Buildx, Git, Bash, Node.js, npm, jq | Select source, run checks, build the Linux image, push it to GHCR |
| GitHub and GHCR: hosted services | Repository hosting and container registry | Store source and images |
| Your Linux amd64 VPS: runtime host | Docker Engine, Compose plugin, Bash, curl; existing application configuration | Pull images, run migrations, recreate services, verify health |

A Linux PC with Docker Engine and Buildx can replace the Mac. On a Mac, start Docker Desktop before running commands. The image targets Linux amd64 even if the Mac uses Apple Silicon. Check the builder's platform support below.

Steps 1–7 run in Terminal on your Mac. Step 8 opens an SSH session to the VPS. Step 9 switches between those two sessions; steps 10–12 run on the VPS.

## 1. Check the build machine

| Tool | Role in this workflow |
| --- | --- |
| Git and GitHub | Store the repository and identify the source commit |
| Alternative build machine | Run checks and build the image |
| Docker Buildx / BuildKit | Build for the runtime architecture and publish the artifact |
| GHCR | Store the resulting image |
| SSH and SCP | Access the runtime host and transfer the small release record |
| Docker Compose | Recreate the selected application services |
| Bash, jq, curl | Coordinate commands, read metadata, and check the public endpoint |

**Mac Terminal:**

```bash
git --version
docker version
docker buildx version
jq --version
```

**Check:** all tools are available. This Node.js example also needs Node.js and npm. Run `docker buildx inspect --bootstrap` to confirm the builder supports your runtime platform, especially on an ARM workstation.

## 2. Select the commit and image

This example uses an existing Compose application with a Node.js backend and Dockerfile in `backend/`. One image serves `api`, `worker`, and the one-shot `migrate` command. API and worker healthchecks must already exist; dependencies stay running.

Use one **Bash** session for build steps and another for host steps. Replace sample account names, paths, service names, and URLs with yours.

A **commit SHA** is Git's full identifier for one saved code revision. In the local checkout you want to release, `git rev-parse HEAD` prints it. `HEAD` means the currently checked-out commit. Commit and push your changes first so the builder can fetch them.

**Mac Terminal, inside your application repository:**

```bash
bash
set -euo pipefail
umask 077

REPO_URL="$(git remote get-url origin)"
RELEASE_SHA="$(git rev-parse HEAD)"
IMAGE_REPO='ghcr.io/example/my-app-api'
GHCR_USER='example'
TARGET_PLATFORM='linux/amd64'

[[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]
RELEASE_DIR="$HOME/release-records/$RELEASE_SHA"
mkdir -p "$RELEASE_DIR"
```

**Check:** `RELEASE_SHA` contains the full SHA and the release directory exists. To select the latest fetched `main` instead, run `git fetch origin` followed by `RELEASE_SHA="$(git rev-parse origin/main)"` before setting `RELEASE_DIR`. On GitHub, open the intended commit and use **Copy full SHA**.

Print the value for the later host session:

```bash
printf '%s\n' "$RELEASE_SHA"
```

## 3. Check out the exact source

**Mac Terminal:**

```bash
BUILD_ROOT="$(mktemp -d)"
git clone "$REPO_URL" "$BUILD_ROOT/repo"
cd "$BUILD_ROOT/repo"
git checkout --detach "$RELEASE_SHA"

test "$(git rev-parse HEAD)" = "$RELEASE_SHA"
test -z "$(git status --porcelain)"
git rev-parse HEAD > "$RELEASE_DIR/source-sha.txt"
```

**Check:** the checkout matches the SHA and is clean. Authenticate Git separately for a private repository. Review `backend/.dockerignore` and exclude credentials and runtime environment files from the build context.

## 4. Run the checks before building

Use your actual check commands. This example requires terminating `lint` and `test` scripts and any isolated test dependencies.

**Mac Terminal, inside the detached checkout:**

```bash
(
  cd backend
  npm ci
  npm run lint
  npm test
) 2>&1 | tee "$RELEASE_DIR/checks.log"

printf 'passed\n' > "$RELEASE_DIR/checks.status"
```

**Check:** every command exits zero. `pipefail` preserves failures through `tee`. These tests run on the Mac; run any required Linux container tests before promotion too.

## 5. Authenticate to GHCR

Use a GitHub personal access token (classic) with `write:packages` and access to the chosen package. The runtime host needs pull access, normally `read:packages` for private images. Complete any organisation authorisation requirements.

**Mac Terminal:**

```bash
read -r -s -p 'GHCR push token: ' GHCR_TOKEN
printf '\n'
printf '%s' "$GHCR_TOKEN" |
  docker login ghcr.io --username "$GHCR_USER" --password-stdin
unset GHCR_TOKEN
```

**Check:** login succeeds; the push below verifies package access. Keep Docker credentials outside build contexts and uploads. On a disposable runner, use `docker logout ghcr.io` after verification.

## 6. Build and publish once

**Mac Terminal, inside the detached checkout:**

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

**Check:** the push succeeds and metadata contains the digest. The shared backend image is built once. Review logs before sharing. For a custom Dockerfile path, add `--file ./backend/path/to/Dockerfile`.

## 7. Verify the artifact by digest

**Mac Terminal:**

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

**Check:** GHCR serves the digest-pinned image with the expected architecture and revision label. Adjust both platform and architecture assertions for a different runtime.

Keep the source, test, and build evidence alongside the digest. A revision label alone does not prove provenance, and unpinned build inputs can change the output.

Pin all consumers to that image:

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

**Check:** all three services share the digest. Repeat verification for each separately built image.

## 8. Record the running deployment before changing it

Coordinate one release owner and pause competing rollouts. Connect using the host's established SSH identity.

**Mac Terminal:**

```bash
ssh deploy@app.example.com
```

**Linux VPS, inside the SSH session:**

```bash
bash
set -euo pipefail
umask 077

APP_DIR='/srv/my-app'
PROJECT='my-app'
read -r -p 'Paste the commit SHA printed on the build machine: ' RELEASE_SHA
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

**Check:** configuration validates, the project is correct, and disk space is sufficient. Keep resolved secrets out of logs.

Capture the previous image. This example requires API and worker to share one digest-pinned reference:

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

**Check:** the prior digest and running image IDs are recorded. For differing images, replicas, or mutable tags, capture a verified per-service recovery set before proceeding.

## 9. Transfer and validate the candidate

**Mac Terminal, back in the build session:** set the VPS login and its absolute record directory. Change `/home/deploy` if that user has a different home directory:

```bash
DEPLOY_TARGET='deploy@app.example.com'
REMOTE_RECORD="/home/deploy/release-records/$RELEASE_SHA"

scp "$RELEASE_DIR/candidate.yml" \
    "$RELEASE_DIR/image-ref.txt" \
    "$RELEASE_DIR/source-sha.txt" \
    "$DEPLOY_TARGET:$REMOTE_RECORD/"
```

**Linux VPS, back in the SSH session:**

```bash
test "$(cat "$HOST_RECORD/source-sha.txt")" = "$RELEASE_SHA"
candidate=("${base[@]}" -f "$HOST_RECORD/candidate.yml")

"${candidate[@]}" config --quiet
"${candidate[@]}" pull api worker migrate
```

**Check:** validation and pulls succeed before any container switch. Reassess if runtime configuration changed after the snapshot.

## 10. Run the migration, then switch

Use this order only for backward-compatible migrations that can run alongside the old application. The migration command must exit nonzero on failure. Plan breaking schema changes separately.

**Linux VPS, inside the SSH session:**

```bash
"${candidate[@]}" run --rm --no-deps -T migrate \
  > "$HOST_RECORD/migration.log" 2>&1
printf 'passed\n' > "$HOST_RECORD/migration.status"

"${candidate[@]}" up -d --no-build --no-deps api worker
```

**Check:** migration exits zero before recreation. A failure stops the session; inspect its state before retrying. Compose receives candidate pins before the switch, which can interrupt service.

## 11. Check health and a real user outcome

**Linux VPS, inside the SSH session:**

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

**Check:** both services are healthy, their image references match, and your real health endpoint succeeds. Then run an authorised user workflow, including its background job if applicable. Record acceptance after it passes:

```bash
date -u '+%Y-%m-%dT%H:%M:%SZ' > "$HOST_RECORD/accepted-at.txt"
```

Persist the accepted image set through your normal deployment configuration. Future recreations must use the same pins and Compose file order.

## 12. Recover explicitly if the candidate fails

Confirm the prior application remains compatible with the migrated database before restoring its images. A failed health check does not perform recovery automatically.

**Linux VPS, in a fresh Bash session:** restore `APP_DIR`, `PROJECT`, `HOST_RECORD`, and the exact `base` array from step 8:

```bash
cd "$APP_DIR"
rollback=("${base[@]}" -f "$HOST_RECORD/prior.yml")

"${rollback[@]}" config --quiet
"${rollback[@]}" pull api worker
"${rollback[@]}" up -d --no-build --no-deps \
  --wait --wait-timeout 120 api worker
```

**Check:** repeat step 11 against the image references in `prior.yml`, including health, public, and user-workflow checks. Reconcile the accepted deployment inputs.

An incompatible schema requires a separate database recovery plan. Restoring an old database may discard new writes.

## What survived the lost credits

GitHub kept the source and GHCR kept the images. Another executor ran the checks and build. The release still recorded its source, artifact, verification, and recovery target.

Next, I exposed those steps through GroundControl so an agent could coordinate the pipeline.

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

