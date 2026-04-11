# Runbook Relay GitHub Pages setup

Use this exact setup for `runbookrelay.com`.

## 1. Create the GitHub repo

Create a new public repository in your GitHub account:

- Owner: `javcox`
- Repo name: `runbookrelay-site`
- Visibility: `Public`

Why public:

- GitHub Pages works cleanly with a public repo for a simple static business site
- easier first deployment

## 2. Upload the site files

Upload the contents of this folder into the repo root:

- `index.html`
- `CNAME`
- `robots.txt`
- `sitemap.xml`
- `.nojekyll`
- `.lighthouserc.json`
- `assets/`
- `.github/workflows/`

The `CNAME` file is already set to:

```text
runbookrelay.com
```

## 3. Turn on GitHub Pages

In the repo:

1. Open `Settings`
2. Open `Pages`
3. Under `Build and deployment`
4. Set:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`

After saving, GitHub Pages will publish the site.

## 4. Set the custom domain

In the same `Pages` screen:

- Custom domain: `runbookrelay.com`

Save it.

Once DNS is correct and the site is published, enable:

- `Enforce HTTPS`

## 5. Exact Namecheap DNS records

In Namecheap `Advanced DNS`, update **Host Records** like this.

### Delete these conflicting records

Delete these if they still exist:

- `CNAME` record:
  - Host: `www`
  - Value: `parkingpage.namecheap.com.`
- `URL Redirect Record`:
  - Host: `@`
  - Value: your current redirect target

Do **not** delete:

- your Google Workspace MX records
- your Google site verification TXT record
- your SPF TXT record

### Add these GitHub Pages records

#### Apex domain records for `runbookrelay.com`

Add these four `A` records:

1. Type: `A Record`
   - Host: `@`
   - Value: `185.199.108.153`
   - TTL: `Automatic`

2. Type: `A Record`
   - Host: `@`
   - Value: `185.199.109.153`
   - TTL: `Automatic`

3. Type: `A Record`
   - Host: `@`
   - Value: `185.199.110.153`
   - TTL: `Automatic`

4. Type: `A Record`
   - Host: `@`
   - Value: `185.199.111.153`
   - TTL: `Automatic`

#### Optional IPv6 records for the apex domain

Add these four `AAAA` records if you want the full GitHub Pages recommended setup:

1. Type: `AAAA Record`
   - Host: `@`
   - Value: `2606:50c0:8000::153`
   - TTL: `Automatic`

2. Type: `AAAA Record`
   - Host: `@`
   - Value: `2606:50c0:8001::153`
   - TTL: `Automatic`

3. Type: `AAAA Record`
   - Host: `@`
   - Value: `2606:50c0:8002::153`
   - TTL: `Automatic`

4. Type: `AAAA Record`
   - Host: `@`
   - Value: `2606:50c0:8003::153`
   - TTL: `Automatic`

#### `www` subdomain record

Add this `CNAME` record:

- Type: `CNAME Record`
- Host: `www`
- Value: `javcox.github.io`
- TTL: `Automatic`

## 6. Keep these email-related records

Leave these alone:

- Google Workspace MX records
- Google verification TXT
- SPF TXT

GitHub Pages records and Google Workspace records can coexist.

## 7. Analytics setup after deploy

Before going live, update the inline `window.RUNBOOK_RELAY_CONFIG` block used
by the site pages.

Fill in:

- your real Calendly URL
- your GA4 measurement ID
- your PostHog public key
- your Clarity project ID

Do not put a raw Zapier hook URL in public client-side JavaScript.

If you want browser form submissions to reach Zapier, use a server-side relay
you control and point `leadCaptureWebhook` at that relay instead.

## 8. What should happen after setup

Once this is done:

- `runbookrelay.com` should load the site
- `www.runbookrelay.com` should resolve through GitHub Pages
- GitHub Pages should issue HTTPS
- analytics will start tracking as soon as keys are added

## 9. If GitHub Pages says the domain is not ready

Wait a little.

DNS can take time to settle.

Usually check again after:

- 10 minutes
- 30 minutes
- up to a few hours if needed

## 10. Final sanity check

After deployment:

1. Open `https://runbookrelay.com`
2. Open `https://www.runbookrelay.com`
3. Confirm both load
4. In GitHub Pages settings, confirm the custom domain is saved
5. Turn on `Enforce HTTPS`
