#!/usr/bin/env bash
#
# Mark UI — put the Creative Vault (creative.markui.lk) on this server.
#
# The Vault is part of the markui.lk app (app/vault, rewritten in by host in
# next.config.ts), so there is no new service to run: this only adds the
# nginx vhost for the subdomain, the upload route's larger body limit on
# markui.lk, and the certificate.
#
#   sudo bash /srv/markui/app/deploy/creative-vault.sh prepare
#       Before DNS moves. Installs the snippets and the HTTP-only vhost (it
#       answers for creative.markui.lk only, so it is harmless while DNS
#       still points at Vercel) and checks the app serves the Vault when
#       asked for that host.
#
#   sudo bash /srv/markui/app/deploy/creative-vault.sh go-live
#       Right after the creative.markui.lk A record points at this box (and
#       any AAAA is removed). Issues the certificate and switches to HTTPS.
#       Until it finishes, HTTPS visitors get a certificate warning, so run it
#       straight after the DNS change, with the TTL lowered beforehand.
#
# Additive only, like go-live.sh: exact server_name, reload never restart,
# /etc/nginx backed up first.

set -euo pipefail

APP_DIR="/srv/markui/app"
DOMAIN="creative.markui.lk"
WEBROOT="/var/www/letsencrypt"
EMAIL="${EMAIL:-admin@markui.lk}"
VHOST="/etc/nginx/sites-available/$DOMAIN.conf"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root (sudo bash $0 prepare|go-live)."
step="${1:-}"

backup_nginx() {
  local backup="/root/nginx-backup-$(date +%F-%H%M)"
  [[ -d "$backup" ]] || { cp -a /etc/nginx "$backup"; log "Backed up /etc/nginx to $backup"; }
}

reload_or_restore() {
  local fallback="$1"
  if ! nginx -t; then
    if [[ -n "$fallback" ]]; then install -m 644 "$fallback" "$VHOST"; else rm -f "/etc/nginx/sites-enabled/$DOMAIN.conf"; fi
    nginx -t >/dev/null 2>&1 || true
    die "nginx -t failed; the previous state has been restored and nothing was reloaded."
  fi
  systemctl reload nginx
}

case "$step" in
  prepare)
    backup_nginx
    log "Installing the snippets"
    install -m 644 "$APP_DIR/deploy/nginx/creative-body.conf" /etc/nginx/snippets/creative-body.conf
    # markui.lk's body gained the Vault upload route and /media/vault/.
    install -m 644 "$APP_DIR/deploy/nginx/markui-body.conf" /etc/nginx/snippets/markui-body.conf

    mkdir -p /srv/markui/data/uploads/vault
    chown markui:markui /srv/markui/data/uploads/vault

    if [[ ! -f "$VHOST" ]]; then
      log "Installing the HTTP vhost for $DOMAIN"
      install -m 644 "$APP_DIR/deploy/nginx/$DOMAIN-http.conf" "$VHOST"
      ln -sf "$VHOST" "/etc/nginx/sites-enabled/$DOMAIN.conf"
    else
      log "$VHOST already exists — leaving it"
    fi
    reload_or_restore ""

    log "Checking the app answers for $DOMAIN"
    code="$(curl -sS -o /dev/null -w '%{http_code}' -H "Host: $DOMAIN" http://127.0.0.1:3005/ || true)"
    [[ "$code" == "200" ]] || die "The app answered $code for Host: $DOMAIN. Is the latest build deployed (deploy.sh) and migration 005 applied?"
    code="$(curl -sS -o /dev/null -w '%{http_code}' -H "Host: $DOMAIN" http://127.0.0.1/ || true)"
    [[ "$code" == "200" ]] || die "nginx answered $code for Host: $DOMAIN on port 80."
    log "Ready. Now point the $DOMAIN A record at this box, remove any AAAA, and run: $0 go-live"
    ;;

  go-live)
    my_v4="$(curl -4 -fsS --max-time 10 https://ifconfig.me || echo unknown)"
    got4="$(dig +short "$DOMAIN" A | tail -1)"
    [[ "$got4" == "$my_v4" ]] || die "$DOMAIN A -> ${got4:-nothing}, not this box ($my_v4). Change it at the DNS provider and wait for the TTL."
    got6="$(dig +short "$DOMAIN" AAAA | tail -1)"
    [[ -z "$got6" ]] || log "Note: $DOMAIN also has an AAAA record ($got6). Remove it unless it is this box's IPv6."

    mkdir -p "$WEBROOT/.well-known/acme-challenge"
    token="creative-preflight-$RANDOM"
    echo "$token" > "$WEBROOT/.well-known/acme-challenge/$token"
    got="$(curl -fsS --max-time 15 "http://$DOMAIN/.well-known/acme-challenge/$token" || true)"
    rm -f "$WEBROOT/.well-known/acme-challenge/$token"
    [[ "$got" == "$token" ]] || die "The ACME challenge path isn't served for $DOMAIN. Run '$0 prepare' first."

    backup_nginx
    if [[ ! -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
      log "Requesting the certificate for $DOMAIN"
      certbot certonly --webroot -w "$WEBROOT" -d "$DOMAIN" \
        --email "$EMAIL" --agree-tos --no-eff-email --non-interactive
    fi

    log "Switching the vhost to TLS"
    install -m 644 "$APP_DIR/deploy/nginx/$DOMAIN-https.conf" "$VHOST"
    reload_or_restore "$APP_DIR/deploy/nginx/$DOMAIN-http.conf"

    sleep 1
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "https://$DOMAIN/" || true)"
    [[ "$code" == "200" ]] || die "https://$DOMAIN/ answered $code — check journalctl -u markui and /var/log/nginx/creative.error.log."
    log "https://$DOMAIN is live (200)"
    certbot renew --dry-run --cert-name "$DOMAIN" >/dev/null 2>&1 && log "Renewal dry-run passed" || \
      printf '\033[1;33m[!]\033[0m Renewal dry-run failed — run: certbot renew --dry-run --cert-name %s\n' "$DOMAIN"
    cat <<DONE

Done. Now:
  - Ask whoever owns the old Vercel project to pause or delete it.
  - In Admin -> Portfolio Settings, set the portfolio URL to https://$DOMAIN (optional:
    service pages already link to the Vault when it has work for that service).

DONE
    ;;

  *)
    die "Usage: sudo bash $0 prepare|go-live"
    ;;
esac
