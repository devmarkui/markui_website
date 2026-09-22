# Deploying markui.lk to the OVH VPS

The runbook for the official Mark UI site. Follow it top to bottom the first
time; after that only **[Shipping a change](#shipping-a-change)** matters.

**The VPS** — OVH VPS-1 2027, Singapore (`vps-45f35a9e.vps.ovh.ca`), Ubuntu
24.04.4 LTS, 2 vCores, 3.7 GB RAM + 4 GB swap, 38 GB disk. SSH as
`ssh ubuntu@139.99.90.67`.

## Read this first: the box is shared

`139.99.90.67` is **not** a clean server. It already runs, in production:

| | |
| --- | --- |
| nginx vhosts | `tableflow.markui.lk`, `yova.markui.lk`, `travel-basic.markui.lk`, `travel-premium.markui.lk`, `vikkaa.lk` |
| Databases | **MariaDB 10.11** on `:3306` (`vikkaa_production`), PostgreSQL 16 on `:5432`, Redis on `:6379` |
| Runtimes | Node 22.23.1, PHP 8.4-FPM, Java, Docker, PM2 |
| Ports already taken | `3000` (yohobed), `3001`, `3002`, `3010` (tableflow), `8081` |

So everything in `deploy/` is **additive**, and deliberately so:

- **No `apt upgrade`, no Node reinstall.** Node 22.23.1 is already there and
  other services depend on it.
- **No MySQL on the host.** MariaDB owns `:3306` and belongs to `vikkaa`.
  MariaDB *cannot* load `database/schema.sql` — it needs real MySQL 8.0.16+ for
  expression defaults, `CHECK` constraints and `utf8mb4_0900_ai_ci`. Ours runs
  as the **`markui-mysql` Docker container on `127.0.0.1:3307`**, with its own
  volume, capped at 768 MB.
- **The app listens on `:3005`**, the only free port in that range.
- **No `default_server`, no editing shared nginx files, and never delete
  `/etc/nginx/sites-enabled/default`** — an unmatched hostname has to keep
  landing wherever it lands today.
- **`nginx -s reload`, never `restart`.** Five other sites are live.
- **`certbot certonly --webroot`, never `certbot --nginx`.** The nginx plugin
  rewrites vhost files.
- Builds run inside `systemd-run --scope -p MemoryMax=2G` so a runaway build is
  killed in its own cgroup instead of the kernel picking MariaDB as the victim.

## How it fits together

```
visitor ─▶ nginx :443 ─▶ markui.service :3005 ─▶ markui-mysql container :3307
             │                   │
             │                   └── /srv/markui/data/uploads   admin media
             └── /srv/markui/app/public     hero videos, straight off disk
```

Three facts about this app shape the setup:

- **The build reads the database.** `/services/[slug]` enumerates the services
  at build time, so MySQL must be up with the schema loaded *before* the first
  `npm run build`. A missing `DATABASE_URL` fails the build, not just a request.
- **It needs a persistent disk.** Admin uploads go to `.data/uploads` and the
  ISR cache to `.next/cache`.
- **Uploads are up to 25 MB.** nginx's `client_max_body_size`,
  `serverActions.bodySizeLimit` and `experimental.proxyClientMaxBodySize` all
  have to agree, or large videos arrive truncated.

---

## 1. Provision the server

Already done once. Re-runnable — every step checks for its own result first.

```bash
ssh ubuntu@139.99.90.67
sudo bash /srv/markui/app/deploy/server-setup.sh
```

It creates the `markui` user, clones the repo to `/srv/markui/app`, starts the
MySQL 8 container, loads the schema, generates the database password and the
admin credentials, builds, starts `markui.service` on `:3005`, and installs the
**HTTP-only** vhost for `markui.lk`.

**It prints the admin password once.** It is hashed on disk and cannot be read
back.

Verify before DNS moves anywhere:

```bash
systemctl status markui
curl -sI http://127.0.0.1:3005/ | head -1                    # app direct
curl -sI -H 'Host: markui.lk' http://127.0.0.1/ | head -1    # through nginx
```

### If the repository is private

```bash
sudo -u markui ssh-keygen -t ed25519 -f /srv/markui/.ssh/id_ed25519 -N "" -C "markui-vps"
sudo cat /srv/markui/.ssh/id_ed25519.pub
```

Add it at **github.com/devmarkui/markui_website → Settings → Deploy keys**,
write access *off*, then re-run with
`REPO_URL="git@github.com:devmarkui/markui_website.git"`.

## 2. The DNS cutover — this is the live step

`markui.lk` and `www.markui.lk` currently resolve to **`185.146.167.197`**
(ServerByt shared hosting), not to the VPS. The nameservers are ServerByt's
(`ns1..ns4.serverbyt.net`), so the records are changed in **ServerByt's control
panel** — not in OVH's.

Nothing is live on the apex: `https://markui.lk/` answers **`404` with an empty
body** from Apache/StackCDN. So this cutover replaces nothing and there is no
downtime to protect — it fills an empty slot.

**Email is on this domain and must not be touched.** `MX` points at
`mx.stackmail.com` and the SPF `TXT` is
`v=spf1 include:spf.stackmail.com a mx -all`. Change only the address records.
The SPF `a` mechanism follows the `A` record, so after the cutover it authorises
the VPS instead of the ServerByt IP; StackMail's own sending is covered by the
`include`, so nothing breaks. Avoid any "point domain to…" or "change hosting"
wizard in the panel — those rewrite the whole zone, `MX` included. Edit the
individual records.

The other `markui.lk` subdomains (`tableflow`, `yova`, `travel-*`) already point
at `139.99.90.67`, so this is a change you have made before in that panel.

**Lower the TTL first.** A day ahead if you can: set the TTL on the existing
`markui.lk` and `www` records to 300. Then a mistake costs five minutes instead
of a day.

When you are ready:

| Type | Name | Change to | TTL |
| --- | --- | --- | --- |
| `A` | `@` | `139.99.90.67` | 300 |
| `A` | `www` | `139.99.90.67` | 300 |

Both names, not just one: `www` needs its own record so the certificate covers
it and nginx can redirect it to the apex. A visitor who types the `www` in by
habit should not meet a certificate warning.

Watch it move:

```bash
dig +short markui.lk
dig +short www.markui.lk
```

**The `AAAA` records must move too.** The apex and `www` both have one today
(`2a07:7800::213`, ServerByt). Changing only the `A` records leaves every
IPv6-preferring visitor landing on ServerByt's 404 — and that is the hardest
class of failure to diagnose, because it works perfectly from any IPv4 network
you test from.

| Type | Name | Change to | TTL |
| --- | --- | --- | --- |
| `AAAA` | `@` | `2402:1f00:8000:800::111b` | 300 |
| `AAAA` | `www` | `2402:1f00:8000:800::111b` | 300 |

Verified before recommending it: the VPS reaches the v6 internet outbound, nginx
listens on `[::]:80` and `[::]:443`, `ufw` allows it, an external IPv6 client
gets a `200` from the markui vhost, and `yova.markui.lk` already runs on that
same address. Deleting the `AAAA` records instead also works — but it drops
IPv6 support the site otherwise has.

There is a short window between the DNS change and step 3 when the site answers
on plain HTTP only. That is deliberate: a redirect to a port with no certificate
is worse than no redirect.

## 3. Go live with HTTPS

Only once `dig +short markui.lk` returns `139.99.90.67`:

```bash
sudo bash /srv/markui/app/deploy/go-live.sh
```

It refuses to run if DNS has not moved, proves the ACME challenge path works
before asking Let's Encrypt for anything, backs up `/etc/nginx`, issues the
certificate over the webroot, swaps in the TLS vhost, and rolls the HTTP one
back if `nginx -t` fails. Renewal is the system certbot timer that already
renews the other five sites.

After a day or two, uncomment the `Strict-Transport-Security` line in
[deploy/nginx/markui.lk-https.conf](deploy/nginx/markui.lk-https.conf) and
re-run the script. It is off at first on purpose — browsers cache HSTS for a
year and it is very awkward to undo.

## 4. First sign-in

At `https://markui.lk/admin/login`, sign in with the password from step 1 and
change it under **Admin → Account**. Then set the portfolio URL under
**Admin → Settings** — that is what the *Check our portfolio* button on every
service page points at, and it stays hidden while blank.

## 5. Backups

```bash
sudo bash /srv/markui/app/deploy/install-backup.sh
```

Nightly at 03:15, 14 days in `/var/backups/markui`: a `mysqldump` from the
container, a tarball of the uploads, and copies of `.env.local` and the MySQL
root password — you need those to sign in to a restored database.

They sit on the same disk as the site, which covers a bad edit but not losing
the VPS. In the OVH panel, **Virtual private servers → vps-45f35a9e →
Automated backup** takes a nightly image of the whole machine. For the official
site, turn it on — and note it covers the other five sites too.

---

## Shipping a change

Push to `main`, then:

```bash
ssh ubuntu@139.99.90.67
sudo bash /srv/markui/app/deploy/deploy.sh
```

Pull, `npm ci`, memory-capped build, restart, health check on `:3005`. It
refuses to merge if the server's checkout has drifted, and names the commit to
roll back to if the site does not answer.

The build runs while the old server still serves, so downtime is the restart — a
second or two. During the build a visitor mid-navigation can miss a chunk and
get a full page reload. Harmless, but a reason to deploy off-hours.

### Rolling back

```bash
cd /srv/markui/app
sudo -u markui git reset --hard <previous-commit>
sudo bash deploy/deploy.sh
```

A rollback does not undo database changes. Content edited in the admin is
independent of the deployed code.

## Changing the database schema

`database/schema.sql` is the initial schema, not a migration: bare
`CREATE TABLE` plus a seed of `site_settings`, so re-running it against a live
database errors out. Write the `ALTER`/`CREATE` by hand and apply it **before**
deploying the code that needs it:

```bash
sudo bash /srv/markui/app/deploy/backup.sh          # dump first
sudo docker exec -i -e MYSQL_PWD="$(sudo cat /srv/markui/.mysql-root-password)" \
  markui-mysql mysql -u root markui < migration.sql
sudo bash /srv/markui/app/deploy/deploy.sh
```

## Restoring from a backup

```bash
cd /var/backups/markui
sudo systemctl stop markui

ROOT_PW="$(sudo cat /srv/markui/.mysql-root-password)"
gunzip -c db-YYYYMMDD-HHMMSS.sql.gz \
  | sudo docker exec -i -e MYSQL_PWD="$ROOT_PW" markui-mysql mysql -u root markui
sudo tar -xzf uploads-YYYYMMDD-HHMMSS.tar.gz -C /srv/markui/data
sudo chown -R markui:markui /srv/markui/data

sudo systemctl start markui
```

Restoring onto a *rebuilt* server? Put `env-<stamp>.local` back at
`/srv/markui/app/.env.local` (mode 0600, owned by `markui`) first, or the
restored admin account will not accept the old password and every existing
session cookie will be rejected.

## Day to day

| | |
| --- | --- |
| Follow the logs | `journalctl -u markui -f` |
| Restart the app | `sudo systemctl restart markui` |
| Database logs | `sudo docker logs --tail 50 markui-mysql` |
| MySQL shell | `sudo docker exec -it -e MYSQL_PWD="$(sudo cat /srv/markui/.mysql-root-password)" markui-mysql mysql -u root markui` |
| nginx logs | `/var/log/nginx/markui.{access,error}.log` |
| Reload nginx | `sudo nginx -t && sudo systemctl reload nginx` — never `restart` |
| Disk and memory | `df -h /`, `free -h` |
| Reset the admin password | `cd /srv/markui/app && sudo -u markui npm run admin:setup && sudo systemctl restart markui` |

Watch memory and disk. This box carries six sites on 3.7 GB and 38 GB; the
checkout, `node_modules`, the build output, uploads and 14 days of backups all
land on the same disk.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `502 Bad Gateway` | The app is not running | `journalctl -u markui -n 50` — usually a bad `.env.local` or the DB container down |
| Build fails on `/services/[slug]` | Cannot reach MySQL | `docker ps \| grep markui-mysql`, check `DATABASE_URL` uses port **3307** |
| `Unknown collation utf8mb4_0900_ai_ci` | You pointed at MariaDB on 3306 | `DATABASE_URL` must be `127.0.0.1:3307` |
| Build killed | Memory cap or the box is busy | Re-run off-hours; the 2 GB cap is protecting the other five sites |
| `ADMIN_SESSION_SECRET is not set` | Env file missing or unreadable | `/srv/markui/app/.env.local`, owned by `markui`, mode 0600 |
| Large video upload arrives broken | A body limit in the chain | All three must allow it: nginx `client_max_body_size`, `serverActions.bodySizeLimit`, `proxyClientMaxBodySize` |
| certbot: "challenge failed" | DNS has not moved yet | `dig +short markui.lk` must return `139.99.90.67` |
| Signed out on every page load | Cookie is `Secure` in production | Finish step 3; the site must be on HTTPS |
| `nginx -t` fails | A bad vhost | Remove the symlink, re-test. Full restore: `cp -a /root/nginx-backup-<date>/. /etc/nginx/` |
| Another site broke | Something was not additive | Restore `/etc/nginx` from the dated backup and reload |

## What is where

| Path | |
| --- | --- |
| `/srv/markui/app` | The checkout, owned by `markui` |
| `/srv/markui/app/.env.local` | `DATABASE_URL` + admin credentials, mode 0600 |
| `/srv/markui/.mysql-root-password` | Container root password, mode 0600 |
| `/srv/markui/data/uploads` | Admin media, symlinked to `app/.data` |
| `/etc/systemd/system/markui.service` | The Next server on `:3005` |
| `/etc/nginx/sites-available/markui.lk.conf` | The vhost |
| `/etc/nginx/snippets/markui-{body,proxy}.conf` | Shared between the HTTP and TLS vhosts |
| `/etc/nginx/conf.d/markui-ratelimit.conf` | Rate-limit zones |
| `/root/nginx-backup-<date>/` | Copies of `/etc/nginx` from before each change |
| `/var/backups/markui` | Nightly backups, 14 days |

Sources: [deploy/](deploy/) — `server-setup.sh`, `go-live.sh`, `deploy.sh`,
`backup.sh`, `install-backup.sh`, `markui.service`, `nginx/`, and
`env.production.example` for what `.env.local` must contain.
