# Runbook Relay site package

This is the code-first site package for `runbookrelay.com`.

## What this package includes

- A premium multi-page Runbook Relay website with routes for:
  - `/`
  - `/about`
  - `/ops`
  - `/law-firms`
  - `/med-spa`
  - `/home-services`
  - `/thank-you`
- A reusable audit-intake form flow that routes visitors to an on-site scheduler page
- Built-in analytics hooks for:
  - Google Analytics 4
  - PostHog
  - Microsoft Clarity
- Tracking for:
  - page loads
  - CTA clicks
  - outbound link clicks
  - FAQ opens
  - scroll depth milestones
  - time-on-page milestones
  - first contentful paint
  - navigation timing
  - largest contentful paint
  - cumulative layout shift
- GitHub Pages-ready file structure
- Lighthouse CI starter config for recurring performance checks

## Recommended analytics stack

Use this stack first:

1. GA4 for traffic, attribution, campaign performance, and conversion reports
2. Search Console for search visibility and queries
3. PostHog for behavior analytics, session replay, funnels, and experiments
4. Microsoft Clarity for another free layer of session replay and heatmaps
5. Lighthouse CI for recurring performance, accessibility, SEO, and best-practices monitoring

This gives you:

- traffic source truth
- on-page behavior truth
- replay and friction truth
- search performance truth
- page quality truth

## Setup steps

1. Replace the placeholder Calendly URL in `assets/config.js`
2. Replace the GA4 measurement ID in `assets/config.js`
3. Add your PostHog public project key and host to `assets/config.js`
4. Add your Clarity project ID to `assets/config.js`
5. Deploy this folder to GitHub Pages or Cloudflare Pages
6. Point `runbookrelay.com` to the deployed site
7. Verify the domain in Search Console
8. Let the site run for a few days before making conversion changes

## Files you will edit

- `assets/config.js`
- `index.html`

## Suggested deployment

### GitHub Pages

- Create a repo such as `runbookrelay-site`
- Upload the contents of this folder
- Enable GitHub Pages on the `main` branch
- Set the custom domain to `runbookrelay.com`

### Cloudflare Pages

- Create a new Pages project from the repo
- No build command is required
- Publish the root directory

## Search Console

Use domain verification if possible so the root domain and subdomains are covered together.

## Events tracked out of the box

- `rr_page_loaded`
- `rr_cta_click`
- `rr_jump_click`
- `rr_outbound_click`
- `rr_faq_open`
- `rr_scroll_depth`
- `rr_time_on_page`
- `rr_navigation_timing`
- `rr_first_contentful_paint`
- `rr_largest_contentful_paint`
- `rr_cumulative_layout_shift`
- `rr_audit_form_submit`
- `rr_audit_form_invalid`
- `rr_thank_you_view`
- `rr_scheduler_embed_loaded`

## Important note

You do not need every dashboard open every day.

Use them like this:

- GA4 = traffic and campaign performance
- Search Console = search queries and indexing
- PostHog = user behavior, friction, and experiments
- Clarity = replay and heatmap spot checks
- Lighthouse CI = technical regressions

## Form-first flow

The current site now uses:

1. short qualification form
2. thank-you page with inline scheduler
3. optional webhook handoff for CRM / email / SMS automation later

Captured fields:

- first name
- email
- phone
- business name
- website
- industry
- biggest issue
- notes
- source page
- source path
- source URL
- UTM source
- UTM medium
- UTM campaign
- submitted timestamp

## Next upgrades

- connect `leadCaptureWebhook` to HubSpot / Zapier / Make
- add instant email + SMS confirmation after form submit
- add no-booking and no-show follow-up sequences
- add UTM-tagged outbound links in email/SMS follow-up
- wire PostHog experiments to headline and CTA tests
