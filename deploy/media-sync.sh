#!/usr/bin/env bash
# ============================================================================
# Mirror uploaded media from OVH to ServerByt (media.markui.lk) over SSH.
#
#   media-sync.sh            push new files, then verify them by SHA-256
#   media-sync.sh --full     re-verify every local file, not just new ones
#   media-sync.sh --dry-run  show what would be copied; change nothing
#   media-sync.sh --prune    after verifying, delete LOCAL copies that
#                            ServerByt holds byte-for-byte (see below)
#
# The app pushes each upload to ServerByt itself (lib/media-remote.ts). This
# timer is the safety net: anything the app could not push (ServerByt down,
# a crash mid-upload) is still on local disk and gets copied here.
#
# Safety:
#   - never deletes or overwrites anything on ServerByt (no --delete,
#     --ignore-existing); a remote file that differs is reported, not fixed
#   - only files untouched for 2+ minutes are copied, so a file still being
#     written is never mirrored half-done
#   - a file counts as synced only once ServerByt's own sha256sum matches
#   - --prune (or MEDIA_SYNC_PRUNE=1) re-checks each file's remote SHA-256
#     immediately before removing the local copy, and only touches regular
#     files with the app's own name patterns inside $LOCAL_DIR
#
# Runs as the markui user from markui-media-sync.timer. Exits non-zero on any
# failure, so systemd marks the run failed and the next run tries again.
# ============================================================================
set -euo pipefail

LOCAL_DIR="${MEDIA_SYNC_LOCAL_DIR:-/srv/markui/data/uploads}"
REMOTE_HOST="${MEDIA_SYNC_REMOTE_HOST:-markui.lk@ssh.us.stackcp.com}"
# Relative to the ServerByt home: the folder media.markui.lk serves as its root.
REMOTE_DIR="${MEDIA_SYNC_REMOTE_DIR:-public_html/markui-media/srv/markui/data/uploads}"
SSH_KEY="${MEDIA_SYNC_SSH_KEY:-/srv/markui/.ssh/serverbyt_media}"
KNOWN_HOSTS="${MEDIA_SYNC_KNOWN_HOSTS:-/srv/markui/.ssh/known_hosts}"
STATE_DIR="${MEDIA_SYNC_STATE_DIR:-/srv/markui/media-sync}"
MIN_AGE_MIN="${MEDIA_SYNC_MIN_AGE_MIN:-2}"
PRUNE="${MEDIA_SYNC_PRUNE:-0}"

FULL=0
DRY=0
for arg in "$@"; do
  case "$arg" in
    --full) FULL=1 ;;
    --dry-run) DRY=1 ;;
    --prune) PRUNE=1 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

log() { echo "[media-sync] $*"; }

# Only names the app itself creates: <uuid>.<ext> at the top level, and
# <uuid>[-display|-thumb|-poster].<ext> under vault/.
NAME_RE='^\./([0-9a-f-]{36}\.[a-z0-9]+|vault/[0-9a-f-]{36}(-(display|thumb|poster))?\.[a-z0-9]+)$'
[[ "$REMOTE_DIR" =~ ^[A-Za-z0-9._/-]+$ && "$REMOTE_DIR" != *..* ]] || { log "bad REMOTE_DIR"; exit 2; }

umask 077
mkdir -p "$STATE_DIR"
VERIFIED="$STATE_DIR/verified.sha256"
touch "$VERIFIED"

# One run at a time; a slow upload must not overlap the next timer tick.
exec 9>"$STATE_DIR/lock"
flock -n 9 || { log "another run is in progress, skipping"; exit 0; }

SSH=(ssh -F /dev/null -i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes
     -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$KNOWN_HOSTS"
     -o ConnectTimeout=20 -o ServerAliveInterval=30 -o ServerAliveCountMax=4)

# ServerByt now and then refuses a connection outright (seen as "Permission
# denied (publickey)" between two good ones), so every call gets three tries.
# Exit 1 is a real answer from the remote command (sha256sum -c: a file
# differs), not a connection problem, and is returned at once. Stdin is
# buffered to a file first so a retry can send it again.
remote() {
  local input rc n
  input=$(mktemp "$STATE_DIR/stdin.XXXXXX")
  cat > "$input"
  for n in 1 2 3; do
    rc=0
    "${SSH[@]}" "$REMOTE_HOST" "$1" < "$input" || rc=$?
    if [[ $rc == 0 || $rc == 1 ]]; then rm -f "$input"; return $rc; fi
    log "ssh attempt $n failed (exit $rc)"
    sleep $((n * 15))
  done
  rm -f "$input"
  return 255
}

[[ -d "$LOCAL_DIR" ]] || { log "missing $LOCAL_DIR"; exit 1; }
remote "test -d '$REMOTE_DIR'" < /dev/null \
  || { log "remote folder $REMOTE_DIR not found or SSH failed"; exit 1; }

cd "$LOCAL_DIR"

# ── 0. Which local files are ours and settled ───────────────────────────────
ALL="$STATE_DIR/local-files.txt"
: > "$ALL"
skipped=0
while IFS= read -r -d '' f; do
  if [[ "$f" =~ $NAME_RE ]]; then printf '%s\n' "${f#./}" >> "$ALL"
  else skipped=$((skipped + 1)); fi
done < <(find . -type f -mmin "+$MIN_AGE_MIN" ! -name '*.part' ! -name '.*' -print0 | sort -z)
(( skipped == 0 )) || log "ignored $skipped file(s) whose names the app does not create"

# ── 1. Copy ─────────────────────────────────────────────────────────────────
RSYNC_OPTS=(-rt --ignore-existing --chmod=D755,F644 --files-from="$ALL"
            --itemize-changes --stats --timeout=300)
[[ $DRY == 1 ]] && RSYNC_OPTS+=(--dry-run)
log "checking $(wc -l < "$ALL") settled local file(s) against ServerByt:$REMOTE_DIR/"
copied=0
out=""
for n in 1 2 3; do
  if out=$(rsync "${RSYNC_OPTS[@]}" -e "${SSH[*]}" . "$REMOTE_HOST:$REMOTE_DIR/" 2>&1); then
    copied=1; break
  fi
  log "rsync attempt $n failed: $(tail -2 <<<"$out" | tr '\n' ' ')"
  sleep $((n * 15))
done
grep -E '^<f|^Number of regular files transferred|^Total transferred file size' <<<"$out" || true
[[ $copied == 1 ]] || { log "FAILED: could not copy to ServerByt; local files kept"; exit 1; }
[[ $DRY == 1 ]] && { log "dry run, nothing copied or verified"; exit 0; }

# ── 2. Verify ───────────────────────────────────────────────────────────────
declare -A done_set=()
if [[ $FULL == 0 ]]; then
  while read -r _ f; do done_set["$f"]=1; done < "$VERIFIED"
fi
TODO="$STATE_DIR/todo.sha256"
: > "$TODO"
while IFS= read -r f; do
  [[ -n "${done_set["./$f"]:-}" ]] || sha256sum "./$f" >> "$TODO"
done < "$ALL"

count=$(wc -l < "$TODO")
RESULT="$STATE_DIR/last-check.txt"
if [[ $count -gt 0 ]]; then
  log "verifying $count file(s) on ServerByt"
  if remote "cd '$REMOTE_DIR' && sha256sum -c -" < "$TODO" > "$RESULT" 2>&1; then
    cat "$TODO" >> "$VERIFIED"
    sort -u -k2 -o "$VERIFIED" "$VERIFIED"
    log "OK: $count verified, $(wc -l < "$VERIFIED") total"
  else
    bad=$(grep -vc ': OK$' "$RESULT" || true)
    log "FAILED: $bad file(s) missing or different on ServerByt (local copies kept):"
    grep -v ': OK$' "$RESULT" | head -50
    grep ': OK$' "$RESULT" | sed 's/: OK$//' | awk 'NR==FNR{ok[$0]=1;next} ok[$2]' - "$TODO" >> "$VERIFIED" || true
    sort -u -k2 -o "$VERIFIED" "$VERIFIED"
    exit 1
  fi
else
  log "nothing new to verify ($(wc -l < "$VERIFIED") files verified so far)"
fi

# ── 3. Prune local copies (opt-in) ──────────────────────────────────────────
[[ $PRUNE == 1 ]] || exit 0

# Every settled local file, hashed now, then checked against ServerByt now.
CAND="$STATE_DIR/prune-candidates.sha256"
: > "$CAND"
while IFS= read -r f; do sha256sum "./$f" >> "$CAND"; done < "$ALL"
[[ -s "$CAND" ]] || { log "prune: nothing local to remove"; exit 0; }

PRUNE_CHECK="$STATE_DIR/prune-check.txt"
remote "cd '$REMOTE_DIR' && sha256sum -c -" < "$CAND" > "$PRUNE_CHECK" 2>&1 || true
removed=0; freed=0; kept=0
while IFS= read -r line; do
  f="${line%: OK}"
  [[ "$line" == *": OK" && "$f" =~ $NAME_RE ]] || { kept=$((kept + 1)); continue; }
  [[ -f "$f" && ! -L "$f" ]] || continue
  # The file must still have the hash that was just verified remotely.
  want=$(awk -v f="$f" '$2==f{print $1}' "$CAND")
  have=$(sha256sum "$f" | cut -d' ' -f1)
  [[ -n "$want" && "$have" == "$want" ]] || { kept=$((kept + 1)); continue; }
  size=$(stat -c %s "$f")
  rm -f -- "$f" && { removed=$((removed + 1)); freed=$((freed + size)); }
done < "$PRUNE_CHECK"
log "prune: removed $removed local file(s), freed $((freed / 1024 / 1024)) MB; kept $kept not verified remotely"
