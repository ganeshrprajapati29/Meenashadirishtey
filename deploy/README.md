# Deployment – VPS (Ubuntu/Debian)

## 1. One-command install

SSH into the VPS as root and run:

```bash
curl -fsSL https://raw.githubusercontent.com/ganeshrprajapati29/Meenashadirishtey/main/deploy/install.sh -o msr-install.sh
bash msr-install.sh
```

> If the GitHub repo is **private**, `curl` above will fail. Instead:
> ```bash
> git clone https://github.com/ganeshrprajapati29/Meenashadirishtey.git /opt/msr/app   # username + Personal Access Token
> bash /opt/msr/app/deploy/install.sh
> ```

At the end it prints the website link, admin link and the **admin password** (randomly generated, stored in `/opt/msr/backend.env`).

Default domain: `msr.<ip-with-dashes>.sslip.io` → for this server **https://msr.72-60-110-25.sslip.io** (free SSL via Let's Encrypt).
Use your own domain later with: `DOMAIN=www.meenashadirishtey.com bash /opt/msr/app/deploy/install.sh` (point the domain's A record to the VPS first).

## 2. Update to latest code

```bash
bash /opt/msr/app/deploy/install.sh
```
(Safe to re-run – keeps the database, uploads and `.env`.)

## 3. It does not touch other apps on the server

| Thing | Where | Shared with others? |
|---|---|---|
| Code | `/opt/msr/app` | no |
| Node.js runtime | `/opt/msr/node` (private copy) | no – system node untouched |
| API process | systemd `msr-api` → `127.0.0.1:5055` | no |
| MongoDB | Docker container `msr-mongo` → `127.0.0.1:27027`, data in `/opt/msr/mongo-data` | no – existing MongoDB untouched |
| Photos/uploads | `/opt/msr/uploads` | no |
| Web server | one new file `/etc/nginx/sites-available/msr.conf` | nginx is shared, other sites untouched |

The script stops (without changing anything) if port 5055/27027 is busy or if port 80 is served by something other than nginx.

## 4. Useful commands

```bash
systemctl status msr-api          # API status
tail -f /opt/msr/api.log          # API logs
systemctl restart msr-api         # after editing /opt/msr/backend.env
docker logs msr-mongo             # database logs
cd /opt/msr/app/backend && PATH=/opt/msr/node/bin:$PATH node src/seed.js --clear-demo   # remove demo profiles before launch
```

## 5. Going live checklist

- [ ] Change admin password (edit `ADMIN_PASSWORD` is only used at first seed → change via DB or re-create admin)
- [ ] Remove demo data: `node src/seed.js --clear-demo`
- [ ] SMS OTP: set `OTP_MODE=sms`, `SMS_PROVIDER` (msg91 / fast2sms), `SMS_API_KEY`, `SMS_TEMPLATE_ID` in `/opt/msr/backend.env`, restart
- [ ] Payments: set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`, restart (demo mode turns off automatically)
- [ ] Update contact number / WhatsApp / social links in Admin → Settings
- [ ] Backups: `docker exec msr-mongo mongodump --archive > msr-$(date +%F).archive`
