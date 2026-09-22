#!/usr/bin/env bash
#
# Installs the nightly backup as a systemd timer. Run once, as root:
#   bash /srv/markui/app/deploy/install-backup.sh

set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run as root." >&2; exit 1; }

cat > /etc/systemd/system/markui-backup.service <<'UNIT'
[Unit]
Description=Mark UI nightly backup (MySQL + uploads)

[Service]
Type=oneshot
ExecStart=/usr/bin/env bash /srv/markui/app/deploy/backup.sh
UNIT

cat > /etc/systemd/system/markui-backup.timer <<'UNIT'
[Unit]
Description=Run the Mark UI backup nightly

[Timer]
OnCalendar=*-*-* 03:15:00
# Catches up after a reboot rather than skipping a night.
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now markui-backup.timer
systemctl start markui-backup.service

echo
echo "Backups enabled. Check with:"
echo "  systemctl list-timers markui-backup.timer"
echo "  ls -lh /var/backups/markui"
