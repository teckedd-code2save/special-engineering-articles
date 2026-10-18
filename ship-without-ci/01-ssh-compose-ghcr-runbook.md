# Ship Without CI: An SSH + Compose + GHCR Release Runbook

[Series index](README.md) | [Next: From runbook to capability](02-mcp-release-tool.md)

**Written 18 October 2026. Part 1 of 2 — the manual fallback path when CI is down.**

*By Edward Twumasi*

---

Your GitHub Actions run never started. Billing tripped, or the control plane that normally ships your deploys is asking for a reauth. Either way, the code is merged, tested, and sitting in `main` — and production is still running last week's image.

This is the runbook for that moment. It replaces exactly one broken component with a direct path, instead of rebuilding your whole delivery platform.

## Separate the five concerns

A deploy that "goes through CI" is really five independent things holding hands:

1. **Source** — git
2. **Registry** — GHCR
3. **Build executor** — GitHub Actions / CI
4. **Control plane** — your deploy dashboard (GroundControl, etc.)
5. **Running app** — Docker Compose on the VPS

When one of them fails, you replace *that one* with a direct path. You don't rewrite the platform.

What still has to work, per fallback:

| Still working | You can |
|---|---|
| git + GHCR reachable | build on the box, push, pull, switch |
| Only SSH to the server | operate the existing Compose deployment (no new build) |
| GHCR down, images cached locally | `up -d --pull never` with pre-verified image IDs |
| Server SSH / Docker / storage down | STOP — recover infrastructure first, no unrelated changes |

Two honest caveats up front: this is **not an offline procedure** (a new build still needs base images and npm/OS dependency registries), and it's **not zero-downtime**.

## The workflow

Variables first, because vague scripts are how servers get bricked:

```
RELEASE_SHA   # explicit full SHA — never a moving tag
APP_DIR       # prod checkout
PROJECT       # compose project name
REGISTRY      # e.g. ghcr.io/org
COMPONENTS    # e.g. "api web"
SERVICES      # compose services to switch
KEY, HOST     # SSH
```

### 1. Preflight — record what is running

Snapshot the current state before touching anything:

```bash
ssh -T -o BatchMode=yes -o ConnectTimeout=10 -i "$KEY" "root@$HOST" '
  cd '"$APP_DIR"' && git status --short && git rev-parse HEAD
  docker ps --filter label=com.docker.compose.project='"$PROJECT"'
  df -h /'
```

Record: the prior commit, both prior image digests + image IDs, service health, runtime flags, compose file identities, migration state. Check disk headroom **before** building — retain the active + rollback image pairs, and never solve space pressure with an indiscriminate `docker image prune`. Never disable host-key checking to get past an identity change.

### 2. Isolate the build

Build in a detached worktree so source never mixes with the live `.env`:

```bash
ssh "root@$HOST" 'cd '"$APP_DIR"' &&
  git fetch origin main &&
  test "$(git rev-parse origin/main)" = "'"$RELEASE_SHA"'" &&
  git worktree add --detach "'"$APP_DIR-build-$RELEASE_SHA"'" "'"$RELEASE_SHA"'" &&
  git -C "'"$APP_DIR-build-$RELEASE_SHA"'" diff --quiet &&
  git -C "'"$APP_DIR-build-$RELEASE_SHA"'" diff --cached --quiet'
```

Build contexts must not contain credentials — review `.dockerignore` and untracked files. On an ARM workstation, pass an explicit `--platform linux/amd64`; the tested path builds natively on the x86_64 server.

### 3. Build + push with a revision label

```bash
export DOCKER_CONFIG=/root/.groundcontrol/docker   # reuse existing login, never print it
for c in $COMPONENTS; do
  docker build --label "org.opencontainers.image.revision=$RELEASE_SHA" \
    -t "$REGISTRY/app-$c:$RELEASE_SHA" "context-for-$c"
  docker push "$REGISTRY/app-$c:$RELEASE_SHA"
done
```

A commit alone doesn't promise a byte-for-byte reproducible build — `npm install` vs `npm ci`, unpinned base images. Keep the actual digests.

### 4. Verify the exact artifacts

For each image, assert three things:
- `Architecture == amd64`
- the OCI revision label (`org.opencontainers.image.revision`) == `RELEASE_SHA`
- the recorded digest appears in `RepoDigests`

Check each image against **its own** expected revision — don't flatten a per-service check into a no-op ternary. A tag is not proof of code; the digest + revision label is.

### 5. Switch

```bash
cd "$APP_DIR"
git diff --quiet && git diff --cached --quiet
test "$(git rev-parse HEAD)" = "$PRIOR_SHA"   # refuse a dirty or advanced checkout
git merge --ff-only "$RELEASE_SHA"
compose=(docker compose -p "$PROJECT" -f docker-compose.yml -f .groundcontrol/*.override.yml)
"${compose[@]}" config --quiet                # validate WITHOUT printing resolved secrets
"${compose[@]}" up -d --no-build $MIGRATE_SVC $SERVICES
```

Never invoke a generic deploy script that does `git reset --hard` over unexplained server changes. `config --quiet` only — don't paste `docker compose config` or `inspect ...Config.Env` dumps into chat; override files can carry inline secrets.

### 6. Gate on health + migration exit 0

Wait for every long-running service to reach `healthy`. Then assert the one-shot migration container is `exited` with `ExitCode == 0` — its inherited HTTP healthcheck is meaningless after it exits. Only after **both** do you persist the new image pins to `.env` so a later Compose recreation survives. If the health gate fails, stop: the script must not save the new pins, and it does not auto-restore already-replaced containers.

### 7. Verify the product, not just the badges

Three layers:
- **Artifact** — SHA → digest → revision → tests
- **Operation** — health, migration exit 0, public HTTPS/API responses, bounded log review
- **Product** — a real authorized account / app-service check; queued jobs reaching a terminal state with a meaningful outcome

A 200 app shell does not prove a private owner workflow works.

### 8. Record the rollback pair

Capture the prior digests + commit **before** switching. Rollback = verify prior identity → `docker pull` the prior digest-pinned refs → `up -d --no-build --no-deps` → re-verify health → persist prior pins. For a schema-changing release, image rollback is not enough — confirm the old binary can read the new schema, or run a reviewed migration recovery. Never `down -v`, drop databases, undo migrations blindly, or restore an old DB over current writes.

## The pitfalls that actually happened

- **A finished push is not success.** Use a `trap 'echo $? > /path/release.exit' EXIT` and read the marker, with unique names per release. A stale `.exit` from a prior attempt is not this attempt.
- **git-mode `up -d --build` re-tags new code with the old image name.** The container runs new code under the old tag; a later `docker compose pull` (or a control-plane auto-redeploy) silently reverts it. For anything you need to keep, use image-mode: build with a real SHA tag, push to GHCR, then point the `.env` pins at the new tag.
- **Compose precedence:** `environment` overrides `env_file`. Changing one file may not change the running API — check the effective flag in each consumer.
- **A `*_IMAGE` env var inside a container is not proof of the running image.** Use `Config.Image`, image ID, digest, and OCI revision.
- **One release owner at a time.** There is no automatic coordination between a manual SSH release and a recovered CI rollout — a stale automatic deploy can overwrite a newer manual one.
- **"Completed" ≠ "done well."** A job can finish because useful sources ran out, not because the objective is met. Distinguish no-new-data from partial-improvement from complete.

## Definition of done

Approved source SHA + both digests + image IDs + exact compose command + prior rollback pair + environment changes + migration result + tests + live HTTP/product checks + log window + unresolved defects + control-plane drift — all in the release record, with secrets and customer data left out.

## Next: the runbook becomes a capability

The manual path works, but it has a ceiling: whoever runs it needs an SSH key, a shell, and the nerve to type destructive commands on a production box.

There's a better abstraction — and it's now built, not just sketched. [Part 2](02-mcp-release-tool.md) documents the scoped MCP tools (`deployment.build_publish` and `deployment.release`) that expose this exact playbook as an OAuth-gated capability with no SSH key and no unrestricted shell, plus the off-host Docker Agentic Platform build executor that moves the build entirely off the production box. The same preflight, digest verification, health gate, and rollback pair the manual path demands are still there — minus the key, and minus the build competing with production for CPU and RAM.

That's the point where a "runbook" stops being a document someone reads under pressure and becomes a capability you can hand to a machine — with the same evidence and reversibility the manual path demands, minus the key.
