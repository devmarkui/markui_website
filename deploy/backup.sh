#!/usr/bin/env bash
#
# Mark UI website — nightly backup.
#
# Two things are irreplaceable: the MySQL content and the uploaded media in
# /srv/markui/data/uploads. The checkout is not — it is in git.
#
# The database lives in the markui-mysql container (MariaDB on :3306 belongs to
# another site), so the dump goes through `docker exec`.
#
# Installed by install-backup.sh to run at 03:15 daily. Run by hand any time:
#   sudo bash /srv/markui/app/deploy/backup.sh

set -euo pipefail

APP_HOME="/srv/markui"
APP_DIR="$APP_HOME/app"
DATA_DIR="$APP_HOME/data"
BACKUP_DIR="/var/backups/markui"
DB_CONTAINER="markui-mysql"
DB_NAME="markui"
KEEP_DAYS=14

stamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

DB_ROOT_PASS="$(cat "$APP_HOME/.mysql-root-password" 2>/dev/null || true)"
[[ -n "$DB_ROOT_PASS" ]] || { echo "No $APP_HOME/.mysql-root-password" >&2; exit 1; }
docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER" \
  || { echo "$DB_CONTAINER is not running" >&2; exit 1; }

# --single-transaction keeps InnoDB consistent without locking the site out
# mid-dump; --set-gtid-purged=OFF keeps the dump restorable into a fresh server.
docker exec -e MYSQL_PWD="$DB_ROOT_PASS" "$DB_CONTAINER" \
  mysqldump -u root \
    --single-transaction --quick --routines --triggers \
    --set-gtid-purged=OFF \
    "$DB_NAME" | gzip -9 > "$BACKUP_DIR/db-$stamp.sql.gz"

# A dump that failed halfway still leaves a valid gzip of a truncated file, so
# check the tail marker rather than trusting the exit code of a pipeline.
zcat "$BACKUP_DIR/db-$stamp.sql.gz" | tail -5 | grep -q "Dump completed" \
  || { echo "mysqldump did not finish — keeping the previous backups" >&2
       rm -f "$BACKUP_DIR/db-$stamp.sql.gz"; exit 1; }

tar -czf "$BACKUP_DIR/uploads-$stamp.tar.gz" -C "$DATA_DIR" uploads

# The env file holds the session secret and the admin hash; without it a
# restored database still cannot be signed into.
cp "$APP_DIR/.env.local" "$BACKUP_DIR/env-$stamp.local"
cp "$APP_HOME/.mysql-root-password" "$BACKUP_DIR/mysql-root-$stamp.txt"

chmod 600 "$BACKUP_DIR"/*
find "$BACKUP_DIR" -type f -mtime "+$KEEP_DAYS" -delete

echo "Backed up to $BACKUP_DIR (db-$stamp.sql.gz, uploads-$stamp.tar.gz)"
echo "These sit on the same disk as the site. OVH's Automated backup tab in the"
echo "VPS panel is the copy that survives losing the disk."
