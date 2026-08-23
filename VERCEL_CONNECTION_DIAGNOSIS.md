# Vercel Connection Diagnosis

## 1. Root Cause / Most Likely Cause

The project is not responsible for the reported `ERR_CONNECTION_RESET` during the TLS handshake.

The failure occurs before HTTP reaches the application. This project is a static HTML deployment with no server process, middleware, API route, Edge Function, custom TLS code, proxy, or authentication gate that can reset a TLS handshake.

Most likely causes, in order:

1. A client, security product, ISP, or network path on the affected Windows laptop is resetting the TLS connection to the Vercel edge.
2. DNS/registrar configuration should be reconciled: Vercel reports that the domain is assigned, but the domain's current Name.com nameservers do not match Vercel-managed nameservers. The DNS records currently resolve to Vercel edge addresses, so this is not proof of a bad record, but it is an important configuration warning.
3. Vercel custom-domain certificate or domain settings should be confirmed in the Vercel Dashboard.

The public site was tested from a normal browser during this audit:

- `https://rgdtiaportal.live/` returned HTTP 200 and resolved to `https://www.rgdtiaportal.live/`.
- `https://www.rgdtiaportal.live/` returned HTTP 200.
- The latest Vercel deployment completed successfully and reported `status Ready`.

This means the production edge and application are reachable from at least one network path. It does not prove that the affected laptop, antivirus, firewall, ISP, or route can complete TLS successfully.

## 2. Evidence

- The supplied Windows `curl -4 -v` output resets during Schannel TLS negotiation, before an HTTP request or response exists.
- DNS resolves successfully and ping succeeds, so basic name resolution and ICMP reachability work.
- The shared browser successfully loaded the production application over HTTPS.
- Vercel deployment logs show dependency installation, `npm run build`, output deployment, and `Ready` status.
- Vercel domain inspection shows both `rgdtiaportal.live` and `www.rgdtiaportal.live` assigned to the `employee-management` project.
- Current DNS lookup observed:
  - `www.rgdtiaportal.live` CNAME -> `7634467ad290d388.vercel-dns-017.com`
  - CNAME A answers -> `216.198.79.1` and `64.29.17.1`
  - `rgdtiaportal.live` A -> `216.198.79.1`
- Vercel reports the registrar as Third Party and current nameservers as:
  - `ns1hwy.name.com`
  - `ns2kry.name.com`
  - `ns3flt.name.com`
  - `ns4cjp.name.com`
- Vercel marks the current nameservers as not matching its intended nameservers. This should be reconciled in the Vercel Dashboard and Name.com, using the exact values Vercel provides for this project.
- Vercel certificate inspection shows issued certificates for both `rgdtiaportal.live` and `www.rgdtiaportal.live`, each expiring in about 59 days at the time of the check.
- Browser checks confirmed both HTTP entry points upgrade to `https://www.rgdtiaportal.live/`, and both HTTPS hostnames return HTTP 200.

## 3. Files Inspected

- `package.json`
- `vercel.json`
- `.gitignore`
- `.env.local` (variable names only; secret values were not exposed)
- `.vercel/repo.json`
- `.vercel/README.txt`
- `index.html`
- `keyman-duty-pdf.html`
- `ta-journal-pdf.html`
- `Railsaathi.svg`
- `railsaathi-logo.png`
- `APPROVAL_FIX_GUIDE.md`
- `create-gps-duty-numbers-table.sql`
- `debug-approval-issue.sql`
- `fix-rls-policies.sql`
- `test-approval-in-browser.js`

Absent from the workspace:

- `next.config.js`, `next.config.mjs`, `next.config.ts`
- `middleware.js`, `middleware.ts`
- `pages/`, `app/`, or `api/` route directories
- Node server source
- Vercel Edge or Serverless Function source

## 4. Configuration Findings

### Build and server

`package.json` contains only:

- `dev`: `python -m http.server 5000`
- `build`: `node -p 0`
- `start`: `python -m http.server 5000`

There is no production application server or Node runtime involved in the deployed site.

`vercel.json` contains only Vercel version 2 and `outputDirectory: "."`, which publishes the static files in the repository root. The latest deployment succeeded with this configuration.

### Redirects and rewrites

No Vercel redirects or rewrites are configured. The application uses a browser hash (`#login`) for in-page navigation; it does not redirect HTTP requests.

The apex/www behavior observed externally is valid: the apex reaches the www canonical URL and the www URL returns HTTP 200. No redirect loop was observed.

### Headers, CSP, HSTS, and TLS

No custom CSP, certificate, TLS, proxy, or HTTP/3/QUIC configuration exists in the project. A standard HSTS response header is now configured in `vercel.json` and was verified in production as `max-age=31536000; includeSubDomains`.

The HTML contains normal browser-side HTTPS requests to third-party services such as Supabase, Google Fonts, Font Awesome, image hosts, and Google Input Tools. These execute only after the page has been delivered and cannot cause a TLS reset on the initial request to Vercel.

### Authentication and database

Supabase is initialized in browser JavaScript after page load. There is no authentication middleware and no route interception. Firebase is not configured as a deployed server component. SQL files are documentation/scripts for Supabase and are not executed by Vercel.

### Environment variables

`.env.local` exposes only the variable name `VERCEL_OIDC_TOKEN` in this audit. No environment variable is read by the application code for TLS, routing, redirects, or server startup.

## 5. Changes Made

No application, routing, authentication, database, or security code was changed. The only project change for the browser warning was the standard HSTS header in `vercel.json`; it does not replace certificate or DNS configuration and takes effect after a browser receives a valid HTTPS response.

This report is the only new project file created by the diagnosis.

## 6. Vercel Dashboard Settings To Check

In the Vercel project `employee-management`:

1. Open Settings -> Domains.
2. Confirm both `rgdtiaportal.live` and `www.rgdtiaportal.live` are assigned to the intended production project.
3. Confirm one canonical domain, preferably `www.rgdtiaportal.live`, and confirm the apex redirects to it.
4. Confirm the SSL certificate status is valid, issued, and not pending or misconfigured.
5. Confirm there is no protection, password deployment, access-control rule, or project-level redirect affecting the production domain.
6. Confirm the production deployment is the current Ready deployment.
7. Use the exact DNS records or nameservers shown by Vercel for this project. Do not substitute values from another Vercel project.

## 7. DNS / Registrar Checks

The domain currently uses Name.com nameservers while Vercel reports a nameserver mismatch. At Name.com, verify the authoritative DNS zone actually contains the records Vercel requests.

Check the following, using the exact target values displayed by Vercel:

- Apex `@`: Vercel-required A record.
- `www`: Vercel-required CNAME record.
- Remove conflicting A, AAAA, CNAME, or URL-forwarding records for the same host.
- Confirm there is no DNS provider HTTPS redirect or forwarding service in front of Vercel.
- Confirm DNSSEC is valid, or temporarily disable/fix a broken DNSSEC chain if the registrar reports one.
- Verify both IPv4 and IPv6 answers. The supplied test used IPv4, so a bad AAAA record is not the direct explanation for that exact test, but it can affect normal browser behavior.

Do not blindly change DNS. Compare the live records with the values shown in Vercel Domains and the Name.com authoritative zone first.

## 8. Windows Commands To Verify The Fix

Run these from the affected Windows 10/11 laptop:

```powershell
nslookup www.rgdtiaportal.live
nslookup rgdtiaportal.live
netsh winhttp show proxy
curl -4 -I https://www.rgdtiaportal.live/
curl -4 -v https://www.rgdtiaportal.live/
curl -4 -I https://www.google.com
curl -4 -I https://vercel.com
```

The last two commands are controls:

- If Google and Vercel also fail during TLS, the problem is local Windows security software, firewall, ISP, or network routing.
- If Google and Vercel succeed but Railsaathi fails, compare DNS answers, test the Vercel deployment URL, and check the Vercel custom-domain certificate and Name.com records.

Useful additional comparisons:

```powershell
curl.exe -4 -v https://employee-management-5agbpr1bs-211adityaraj-2495s-projects.vercel.app/
Test-NetConnection www.rgdtiaportal.live -Port 443
Resolve-DnsName www.rgdtiaportal.live -Type A
Resolve-DnsName www.rgdtiaportal.live -Type AAAA
```

If the deployment URL works but the custom domain fails, the issue is domain/certificate/DNS-specific. If both fail only on the laptop, test with a phone hotspot and temporarily review antivirus HTTPS inspection, firewall, VPN, and endpoint web-filtering policies.

## 9. Final Verification Checklist

- [ ] Vercel Domains shows both apex and www assigned to `employee-management`.
- [ ] Vercel SSL certificate is valid and issued.
- [ ] Canonical domain and apex-to-www redirect are intentional and loop-free.
- [ ] Name.com authoritative nameservers and DNS records match Vercel's displayed requirements.
- [ ] No conflicting A, AAAA, CNAME, URL forwarding, or DNSSEC configuration remains.
- [ ] `curl -4 -I https://www.rgdtiaportal.live/` returns an HTTP status.
- [ ] `curl -4 -v https://www.rgdtiaportal.live/` completes TLS and shows an HTTP response.
- [ ] `curl -4 -I https://www.google.com` succeeds.
- [ ] `curl -4 -I https://vercel.com` succeeds.
- [ ] Chrome, Edge, and Firefox load the site from the affected laptop.
- [ ] The test succeeds on both the normal network and a phone hotspot, or the network-specific cause is identified.

## Conclusion

No code-level fix is justified for the reported TLS handshake reset. The project builds and serves normally, and the public domain is reachable from an independent browser path. The next required actions are Vercel SSL/domain verification, reconciliation of the Name.com/Vercel DNS ownership configuration, and Windows/network comparison tests on the affected laptop.
