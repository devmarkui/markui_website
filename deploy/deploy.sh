#!/usr/bin/env bash
#
# Mark UI website — ship the current branch to production.
#
# Run as root on the VPS:
#
#   bash /srv/markui/app/deploy/deploy.sh
#
# Pulls, reinstalls, rebuilds and restarts. The build runs while the old server
# is still serving, so the only downtime is the restart at the end — a second
# or two. During the build itself a visitor mid-navigation can miss a chunk and
# get a full page reload; deploy outside business hours if that matters.
#
# It does not touch the database. Schema changes are applied by hand before
# deploying — see DEPLOYMENT.md.

set -euo pipefail

APP_USER="markui"
APP_HOME="/srv/markui"
APP_DIR="$APP_HOME/app"
APP_PORT="3005"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root (sudo bash $0)."
[[ -d "$APP_DIR/.git" ]] || die "$APP_DIR is not a checkout — run server-setup.sh first."

as_app() { sudo -u "$APP_USER" env HOME="$APP_HOME" "$@"; }

cd "$APP_DIR"

before="$(as_app git rev-parse --short HEAD)"

log "Pulling"
# --ff-only on purpose: if the server's checkout has drifted, stop and let a
# human look rather than quietly merging on a production box.
as_app git pull --ff-only || die "Pull is not a fast-forward. Check for local edits on the server."

after="$(as_app git rev-parse --short HEAD)"
log "$before -> $after"

log "Installing dependencies"
as_app npm ci --no-audit --no-fund

# Capped because this box is shared: a runaway build gets killed inside its own
# cgroup rather than the kernel picking MariaDB or yohobed as the victim.
log "Building (capped at 2GB)"
systemd-run --scope --quiet -p MemoryMax=2G -p MemorySwapMax=2G \
  sudo -u "$APP_USER" env HOME="$APP_HOME" NODE_ENV=production npm run build

log "Restarting"
systemctl restart markui
sleep 2
systemctl is-active --quiet markui || die "markui.service did not come back — journalctl -u markui -n 50"

# Ask the app for a real page rather than trusting systemd's word for it. This
# goes straight to Next, not through nginx, so the HTTPS redirect certbot adds
# does not turn a healthy answer into a 301.
code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "http://127.0.0.1:$APP_PORT/" || true)"
[[ "$code" == "200" ]] || die "Homepage returned $code — rolling back is 'git reset --hard $before' then re-run this script."

log "Deployed $after — homepage answering 200"
