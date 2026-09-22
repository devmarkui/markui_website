#!/usr/bin/env bash
#
# Mark UI website — provisioning for the OVH VPS (vps-45f35a9e, 139.99.90.67).
#
# THIS BOX IS SHARED. It already runs tableflow.markui.lk, yova.markui.lk,
# travel-basic, travel-premium and vikkaa.lk, plus MariaDB, PostgreSQL, Redis,
# Docker and PHP-FPM. Every step here is additive:
#
#   - no `apt upgrade`, no Node reinstall (22.23.1 is already there)
#   - no MySQL on the host: MariaDB owns :3306 and cannot load our schema, so
#     MySQL 8 runs in its own container on :3307
#   - no ufw changes (already active and correct)
#   - no touching /etc/nginx/sites-enabled/default or any shared config
#   - the app listens on :3005, the only free port in the 3000s
#
# Run as root. Safe to re-run — every step checks for its own result first.
#
#   sudo bash /srv/markui/app/deploy/server-setup.sh
#
# Leaves behind:
#   /srv/markui/app        the checkout, owned by the `markui` user
#   /srv/markui/data       uploads + ISR cache, symlinked to app/.data
#   /srv/markui/app/.env.local   DATABASE_URL and admin credentials (0600)
#   markui-mysql           MySQL 8 container on 127.0.0.1:3307
#   markui.service         the Next server on 127.0.0.1:3005
#   markui.lk vhost        HTTP only — deploy/go-live.sh adds TLS after the
#                          DNS cutover

set -euo pipefail

# ─── Settings ────────────────────────────────────────────────────────────────

REPO_URL="${REPO_URL:-https://github.com/devmarkui/markui_website.git}"
BRANCH="${BRANCH:-main}"
APP_USER="markui"
APP_HOME="/srv/markui"
APP_DIR="$APP_HOME/app"
DATA_DIR="$APP_HOME/data"
APP_PORT="3005"

DB_CONTAINER="markui-mysql"
DB_VOLUME="markui-mysql-data"
DB_PORT="3307"
DB_NAME="markui"
DB_USER="markui"
DB_IMAGE="mysql:8.0"

SITE_DOMAIN="markui.lk"
SITE_ALIAS="www.markui.lk"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root (sudo bash $0)."

. /etc/os-release
log "Provisioning markui.lk on $PRETTY_NAME"

# ─── 0. Refuse to run on the wrong box ───────────────────────────────────────
# These scripts hard-code ports and paths around what is already running here.
# On a different machine they would be wrong in ways that are hard to see.

command -v docker  >/dev/null || die "Docker is not installed — this setup runs MySQL in a container."
command -v node    >/dev/null || die "Node is not installed. Expected v22.x already present."
[[ "$(node -v | cut -d. -f1)" == "v22" ]] || die "Node $(node -v) — this app needs v22."

# 3000 (yohobed), 3001, 3002 (tableflow web) and 3010 (tableflow container) are
# taken; $APP_PORT is what was left.
if ss -tln | grep -qE "[:.]$APP_PORT\b"; then
  die "Port $APP_PORT is already in use. Pick another and update markui.service to match."
fi

# ─── 1. Application user and directories ─────────────────────────────────────

if ! id -u "$APP_USER" >/dev/null 2>&1; then
  log "Creating the $APP_USER system user"
  useradd --system --create-home --home-dir "$APP_HOME" --shell /usr/sbin/nologin "$APP_USER"
fi

mkdir -p "$APP_DIR" "$DATA_DIR/uploads"
chown -R "$APP_USER:$APP_USER" "$APP_HOME"
# nginx serves public/ and .next/static off disk, so it needs to walk in.
chmod 755 "$APP_HOME" "$APP_DIR"

# ─── 2. Checkout ─────────────────────────────────────────────────────────────

if [[ ! -d "$APP_DIR/.git" ]]; then
  log "Cloning $REPO_URL"
  sudo -u "$APP_USER" git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR" || die \
    "Clone failed. If the repository is private, add a read-only deploy key — see DEPLOYMENT.md."
else
  log "Checkout already present — leaving it alone"
fi

# Uploads and the ISR cache live outside the checkout so a re-clone or a
# `git clean` can never take the customer's media with it.
if [[ ! -L "$APP_DIR/.data" ]]; then
  [[ -d "$APP_DIR/.data" ]] && mv "$APP_DIR/.data"/* "$DATA_DIR/" 2>/dev/null || true
  rm -rf "$APP_DIR/.data"
  sudo -u "$APP_USER" ln -s "$DATA_DIR" "$APP_DIR/.data"
fi

# ─── 3. MySQL 8, in a container ──────────────────────────────────────────────
# database/schema.sql needs real MySQL 8.0.16+: expression defaults, CHECK
# constraints and the utf8mb4_0900_ai_ci collation. The MariaDB 10.11 on :3306
# has none of those and belongs to vikkaa_production — it is not ours to
# replace. A container is the clean answer: own version, own data, own port,
# nothing shared.

ENV_FILE="$APP_DIR/.env.local"

if ! docker ps -a --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  # Hex alone would be rejected by MySQL's password policy, so the suffix
  # guarantees an upper, a digit and a symbol. Every character is URI-safe,
  # which matters because this goes straight into DATABASE_URL.
  DB_PASS="$(openssl rand -hex 20)-Aa1"
  DB_ROOT_PASS="$(openssl rand -hex 20)-Aa1"

  log "Starting the $DB_CONTAINER container on 127.0.0.1:$DB_PORT"
  docker volume create "$DB_VOLUME" >/dev/null
  docker run -d \
    --name "$DB_CONTAINER" \
    --restart unless-stopped \
    -p "127.0.0.1:$DB_PORT:3306" \
    -e MYSQL_ROOT_PASSWORD="$DB_ROOT_PASS" \
    -e MYSQL_DATABASE="$DB_NAME" \
    -e MYSQL_USER="$DB_USER" \
    -e MYSQL_PASSWORD="$DB_PASS" \
    -v "$DB_VOLUME:/var/lib/mysql" \
    --memory=768m \
    "$DB_IMAGE" \
    --character-set-server=utf8mb4 \
    --collation-server=utf8mb4_0900_ai_ci >/dev/null

  log "Waiting for MySQL to accept connections"
  for i in $(seq 1 60); do
    if docker exec "$DB_CONTAINER" mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
      break
    fi
    [[ $i -eq 60 ]] && die "MySQL did not come up — docker logs $DB_CONTAINER"
    sleep 2
  done

  # Append, never truncate: on a re-run the file may already hold the admin
  # credentials, and there is no recovering those from a hash.
  if [[ ! -f "$ENV_FILE" ]]; then
    install -o "$APP_USER" -g "$APP_USER" -m 600 /dev/null "$ENV_FILE"
    printf '# Mark UI production environment — never commit this file.\n' >> "$ENV_FILE"
  fi
  printf 'DATABASE_URL=mysql://%s:%s@127.0.0.1:%s/%s\n' \
    "$DB_USER" "$DB_PASS" "$DB_PORT" "$DB_NAME" >> "$ENV_FILE"
  # The root password is not in .env.local — the app never needs it. Keep it
  # where backup/restore can find it.
  printf '%s\n' "$DB_ROOT_PASS" > "$APP_HOME/.mysql-root-password"
  chmod 600 "$APP_HOME/.mysql-root-password"

  chown "$APP_USER:$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
else
  log "$DB_CONTAINER already exists — keeping it and its data"
  docker start "$DB_CONTAINER" >/dev/null 2>&1 || true
fi

[[ -f "$ENV_FILE" ]] && grep -q '^DATABASE_URL=' "$ENV_FILE" \
  || die "No DATABASE_URL in $ENV_FILE and the container already existed. Restore it from a backup."

# schema.sql uses a bare `CREATE TABLE` and seeds site_settings, so running it
# twice errors out. Load it only on a virgin database; later schema changes are
# applied by hand (see DEPLOYMENT.md).
DB_ROOT_PASS="$(cat "$APP_HOME/.mysql-root-password" 2>/dev/null || true)"
have_tables="$(docker exec -e MYSQL_PWD="$DB_ROOT_PASS" "$DB_CONTAINER" \
  mysql -N -B -u root -e \
  "SELECT 1 FROM information_schema.tables WHERE table_schema='$DB_NAME' AND table_name='services' LIMIT 1" \
  2>/dev/null || true)"

if [[ -z "$have_tables" ]]; then
  log "Loading database/schema.sql"
  docker exec -i -e MYSQL_PWD="$DB_ROOT_PASS" "$DB_CONTAINER" mysql -u root < "$APP_DIR/database/schema.sql"
else
  log "Schema already loaded — skipping"
fi

# ─── 4. Install, credentials, build ──────────────────────────────────────────

# Not --omit=dev: TypeScript, Tailwind and eslint-config-next are
# devDependencies and `next build` needs all three.
log "Installing npm dependencies"
( cd "$APP_DIR" && sudo -u "$APP_USER" env HOME="$APP_HOME" npm ci --no-audit --no-fund )

if ! grep -q '^ADMIN_PASSWORD_HASH=' "$ENV_FILE"; then
  log "Creating the admin account — the password below is shown once and never stored"
  ( cd "$APP_DIR" && sudo -u "$APP_USER" env HOME="$APP_HOME" npm run admin:setup )
else
  log "Admin credentials already present — skipping (use npm run admin:setup to reset)"
fi

# The build reads the database (/services/[slug] enumerates services at build
# time), so it has to come after the schema load.
#
# It also peaks well above what is comfortable on a box with ~2GB free and five
# other production services on it. The scope caps the whole build tree at 2GB,
# so a runaway build is killed inside its own cgroup rather than the kernel
# picking MariaDB or yohobed as the victim.
log "Building (capped at 2GB — this box is shared)"
( cd "$APP_DIR" && systemd-run --scope --quiet -p MemoryMax=2G -p MemorySwapMax=2G \
    sudo -u "$APP_USER" env HOME="$APP_HOME" NODE_ENV=production npm run build )

# ─── 5. systemd ──────────────────────────────────────────────────────────────

log "Installing markui.service"
install -m 644 "$APP_DIR/deploy/markui.service" /etc/systemd/system/markui.service
systemctl daemon-reload
systemctl enable --now markui
sleep 3
systemctl is-active --quiet markui || die "markui.service failed to start — journalctl -u markui -n 50"

code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "http://127.0.0.1:$APP_PORT/" || true)"
[[ "$code" == "200" ]] || die "App answered $code on :$APP_PORT — journalctl -u markui -n 50"
log "App is answering 200 on 127.0.0.1:$APP_PORT"

# ─── 6. nginx ────────────────────────────────────────────────────────────────
# Additive only. A dated copy of /etc/nginx first, so any mistake is one `cp`
# away from being undone.

backup="/root/nginx-backup-$(date +%F-%H%M)"
[[ -d "$backup" ]] || { cp -a /etc/nginx "$backup"; log "Backed up /etc/nginx to $backup"; }

mkdir -p /etc/nginx/snippets /var/www/letsencrypt
install -m 644 "$APP_DIR/deploy/nginx/markui-proxy.conf"     /etc/nginx/snippets/markui-proxy.conf
install -m 644 "$APP_DIR/deploy/nginx/markui-body.conf"      /etc/nginx/snippets/markui-body.conf
install -m 644 "$APP_DIR/deploy/nginx/markui-ratelimit.conf" /etc/nginx/conf.d/markui-ratelimit.conf

# Never clobber the live vhost: go-live.sh may already have swapped in the TLS
# version, and re-running this script must not undo that.
if [[ ! -f "/etc/nginx/sites-available/$SITE_DOMAIN.conf" ]]; then
  log "Installing the HTTP vhost for $SITE_DOMAIN $SITE_ALIAS"
  install -m 644 "$APP_DIR/deploy/nginx/markui.lk-http.conf" \
    "/etc/nginx/sites-available/$SITE_DOMAIN.conf"
  ln -sf "/etc/nginx/sites-available/$SITE_DOMAIN.conf" \
    "/etc/nginx/sites-enabled/$SITE_DOMAIN.conf"
else
  log "Vhost already installed — left as is"
fi

# If this fails the running nginx never picked up the change and the other five
# sites are untouched. Remove the symlink and re-test.
if ! nginx -t; then
  rm -f "/etc/nginx/sites-enabled/$SITE_DOMAIN.conf"
  die "nginx -t failed; the vhost has been unlinked and nothing was reloaded. Restore: cp -a $backup/. /etc/nginx/"
fi
systemctl reload nginx     # reload, NEVER restart — the other sites are live

# ─── Done ────────────────────────────────────────────────────────────────────

cat <<DONE

$(log "markui.lk is running on this box")

  App:        http://127.0.0.1:$APP_PORT          (systemctl status markui)
  Database:   127.0.0.1:$DB_PORT                    (docker logs $DB_CONTAINER)
  Logs:       journalctl -u markui -f
  Verify now, before DNS moves:
    curl -sI -H 'Host: $SITE_DOMAIN' http://127.0.0.1/ | head -1

markui.lk still resolves to ServerByt (185.146.167.197). Nothing is live yet.

To go live:
  1. At ServerByt, change the A record for markui.lk and www.markui.lk to
     139.99.90.67. Drop the TTL to 300 first if you can.
  2. Wait for it:  dig +short markui.lk
  3. sudo bash $APP_DIR/deploy/go-live.sh
     — issues the certificate over the ACME webroot and swaps in the TLS vhost.
  4. Sign in at https://$SITE_DOMAIN/admin/login and change the password.
  5. sudo bash $APP_DIR/deploy/install-backup.sh

DONE
