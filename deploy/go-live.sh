#!/usr/bin/env bash
#
# Mark UI website — issue the certificate and switch markui.lk to HTTPS.
#
# Run this only AFTER the A records for markui.lk and www.markui.lk point at
# 139.99.90.67. Let's Encrypt proves the domain by fetching a file over HTTP
# from this box, so DNS has to be live first.
#
#   sudo bash /srv/markui/app/deploy/go-live.sh
#
# Uses `certbot certonly --webroot`, not `certbot --nginx`: the nginx plugin
# rewrites vhost files, and on a box with six sites that is not a risk worth
# taking. Existing certificates on this machine are untouched.

set -euo pipefail

APP_DIR="/srv/markui/app"
SITE_DOMAIN="markui.lk"
SITE_ALIAS="www.markui.lk"
WEBROOT="/var/www/letsencrypt"
EMAIL="${EMAIL:-admin@markui.lk}"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root (sudo bash $0)."

# ─── 1. DNS must already point here ──────────────────────────────────────────

# -4 and -6 explicitly. A bare `curl ifconfig.me` on this box answers with the
# IPv6 address, which then never matches an A record.
my_v4="$(curl -4 -fsS --max-time 10 https://ifconfig.me || echo unknown)"
my_v6="$(curl -6 -fsS --max-time 10 https://ifconfig.me || echo none)"

for name in "$SITE_DOMAIN" "$SITE_ALIAS"; do
  got4="$(dig +short "$name" A | tail -1)"
  [[ -n "$got4" ]] || die "$name has no A record yet."
  [[ "$got4" == "$my_v4" ]] || die \
    "$name A -> $got4, not this box ($my_v4). Change it at ServerByt and wait for the TTL."

  # An AAAA left pointing elsewhere is the failure that looks fine from every
  # IPv4 network you would test from, so it is checked, not assumed.
  got6="$(dig +short "$name" AAAA | tail -1)"
  if [[ -n "$got6" && "$my_v6" != "none" && "$got6" != "$my_v6" ]]; then
    die "$name AAAA -> $got6, not this box ($my_v6). IPv6 visitors would miss the site."
  fi

  log "$name -> $got4${got6:+ / $got6}"
done

# ─── 2. The challenge path has to work before certbot tries it ───────────────

mkdir -p "$WEBROOT/.well-known/acme-challenge"
token="markui-preflight-$RANDOM"
echo "$token" > "$WEBROOT/.well-known/acme-challenge/$token"
got="$(curl -fsS --max-time 15 "http://$SITE_DOMAIN/.well-known/acme-challenge/$token" || true)"
rm -f "$WEBROOT/.well-known/acme-challenge/$token"
[[ "$got" == "$token" ]] || die \
  "The ACME challenge path is not being served. Check that the markui.lk vhost is enabled and nginx reloaded."
log "ACME challenge path works"

# ─── 3. Certificate ──────────────────────────────────────────────────────────

backup="/root/nginx-backup-$(date +%F-%H%M)"
[[ -d "$backup" ]] || { cp -a /etc/nginx "$backup"; log "Backed up /etc/nginx to $backup"; }

if [[ ! -d "/etc/letsencrypt/live/$SITE_DOMAIN" ]]; then
  log "Requesting the certificate for $SITE_DOMAIN and $SITE_ALIAS"
  certbot certonly --webroot -w "$WEBROOT" \
    -d "$SITE_DOMAIN" -d "$SITE_ALIAS" \
    --email "$EMAIL" --agree-tos --no-eff-email --non-interactive
else
  log "Certificate already present — skipping issuance"
fi

# ─── 4. Swap the vhost ───────────────────────────────────────────────────────

log "Switching the vhost to the TLS version"
install -m 644 "$APP_DIR/deploy/nginx/markui.lk-https.conf" \
  "/etc/nginx/sites-available/$SITE_DOMAIN.conf"

if ! nginx -t; then
  # Put the working HTTP vhost back rather than leaving a broken file on disk.
  install -m 644 "$APP_DIR/deploy/nginx/markui.lk-http.conf" \
    "/etc/nginx/sites-available/$SITE_DOMAIN.conf"
  nginx -t >/dev/null 2>&1 || true
  die "nginx -t failed with the TLS vhost; the HTTP one has been restored and nothing was reloaded."
fi
systemctl reload nginx     # reload, NEVER restart — five other sites are live

# ─── 5. Check it ─────────────────────────────────────────────────────────────

sleep 1
code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "https://$SITE_DOMAIN/" || true)"
[[ "$code" == "200" ]] || die "https://$SITE_DOMAIN/ answered $code — check journalctl -u markui and the nginx error log."

log "https://$SITE_DOMAIN is live (200)"
# --cert-name, because a bare `certbot renew --dry-run` simulates all six certs
# on this box against Let's Encrypt staging. That takes minutes, can fail for
# reasons that have nothing to do with markui.lk, and the scary warning it
# printed here the first time was an SSH timeout, not a renewal problem.
if certbot renew --dry-run --cert-name "$SITE_DOMAIN" >/dev/null 2>&1; then
  log "Renewal dry-run passed"
else
  printf '\033[1;33m[!]\033[0m Renewal dry-run failed — run it by hand:\n'
  printf '    certbot renew --dry-run --cert-name %s\n' "$SITE_DOMAIN"
fi

cat <<DONE

Done. Still worth doing:

  - Sign in at https://$SITE_DOMAIN/admin/login and change the password.
  - Set the portfolio URL under Admin -> Settings.
  - sudo bash $APP_DIR/deploy/install-backup.sh
  - After a day or two, uncomment the Strict-Transport-Security line in
    deploy/nginx/markui.lk-https.conf, re-run this script, and reload.

DONE
