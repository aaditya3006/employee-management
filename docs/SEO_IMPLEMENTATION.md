# SEO Implementation

## Target keywords

The homepage targets the following related intents naturally:

- online TA journal
- online TA Journal for railway employees
- railway TA journal online
- railway TA journal form and format
- travelling allowance journal railway
- railway TA bill
- railway employee travel allowance
- digital TA journal

The copy uses related phrases such as Railway TA Journal, Travel Allowance Journal, and Railway Employee TA without repeating them unnaturally.

## Search intent analysis

A live Google search for `online TA journal railway employees` showed that users expect:

- A working digital journal or calculator
- A printable or PDF-style railway form
- Guidance on required fields such as employee details, stations, timings, distance and rates
- Help understanding allowance percentages and claim preparation
- Clear separation between third-party tools and official railway submission systems

The homepage now answers those needs with a direct login/download path, field guidance, journey-record explanation, and an FAQ. It does not claim government affiliation.

## Pages created

No doorway pages were created. This project is a single static application with one public landing page and private/authenticated application surfaces. One strong, useful homepage is preferable to several near-duplicate URLs.

Public indexable URL:

- `https://www.rgdtiaportal.live/`

The `#login` fragment is an in-page login state, not a separate sitemap URL.

## Title and description

Title:

`Online TA Journal for Railway Employees | Railway TA Journal`

Description:

`Create, manage and maintain your Railway TA Journal online. Record journeys, calculate travel allowance, manage TA entries and generate professional TA Journal records digitally.`

The homepage has one public SEO H1: `Online TA Journal for Railway Employees`.

## Content structure

- H1: Online TA Journal for Railway Employees
- H2: A practical Railway TA Journal for everyday records.
- H2: Answers about Railway TA Journal records.
- Visible guidance covers users, monthly maintenance, journey fields, organization, verification and PDF printing.
- FAQ covers TA Journal definitions, online maintenance, required information, TA Journal versus TA Bill, downloading, calculation, and official-status clarification.

## Canonical strategy

The canonical URL is `https://www.rgdtiaportal.live/`.

All public SEO references use the `www` HTTPS hostname. The apex domain should continue redirecting to this canonical hostname at Vercel. Private dashboard and login-only states are not included in the sitemap.

## Sitemap and robots strategy

- `robots.txt` allows normal crawling and points to the sitemap.
- `sitemap.xml` contains only the canonical public homepage.
- No private pages, dashboard states, API paths, query variants or fragments are included.

## Structured data

The homepage includes honest JSON-LD using:

- `WebSite`
- `WebApplication`
- `Organization`
- `FAQPage`

No fake reviews, ratings, prices, awards or government claims were added.

## Social metadata and images

The page includes Open Graph and Twitter/X title, description, URL, image and image-alt metadata. The existing Railsaathi PNG is used as the social image and favicon. Existing meaningful image alt text was preserved; the main logo references remain descriptive rather than keyword-stuffed.

## Core Web Vitals and accessibility work

Implemented in this pass:

- Crawlable server-rendered landing copy in the static HTML
- Explicit canonical and robots metadata
- Stable favicon/social image references
- Visible semantic headings, lists, paragraphs and native FAQ `details` controls
- No new JavaScript dependency or route layer
- Existing responsive landing layout retained

Remaining performance opportunities:

- Replace the runtime Tailwind CDN with a production-built CSS bundle.
- Self-host or reduce font families and weights.
- Host and optimize remote hero and leadership images, with explicit dimensions where practical.
- Measure LCP, CLS and INP in PageSpeed Insights and Chrome UX Report after real traffic exists.
- Consider reducing non-critical third-party image and translation requests.

## Google Search Console setup

1. Verify `www.rgdtiaportal.live` in Google Search Console using a DNS or HTML verification method.
2. Submit `https://www.rgdtiaportal.live/sitemap.xml`.
3. Use URL Inspection for the homepage and request indexing after the production deployment is live.
4. Confirm the canonical Google selected matches the `www` URL.
5. Monitor indexing, Core Web Vitals, mobile usability and any security/manual-action reports.
6. Add useful original content only when it serves a distinct user need; do not create keyword variants or doorway pages solely for rankings.

## Validation

Available project command:

- `npm run build` runs successfully.

No `lint` script exists in `package.json`.

Recommended production checks:

```powershell
curl -I https://www.rgdtiaportal.live/
curl -I https://www.rgdtiaportal.live/robots.txt
curl -I https://www.rgdtiaportal.live/sitemap.xml
```

Then inspect the homepage source for title, description, canonical, H1 and JSON-LD. Validate the JSON-LD with Google's Rich Results Test or Schema Markup Validator. Search visibility and ranking cannot be guaranteed; indexing depends on Google crawling, quality signals, competition and domain history.
