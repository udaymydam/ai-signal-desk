# AI Signal Desk

A lightweight dashboard for keeping up with remote-friendly AI conferences and high-signal AI updates.

The current catalog contains 21 researched events spanning enterprise AI, AI engineering, MLOps, cloud infrastructure, research, policy, and major ecosystem gatherings through February 2027.

## Run it locally

From this folder, serve the files over HTTP (the browser needs HTTP to load the JSON files), then open the local address in a browser. For example, any simple static file server will work.

The UI includes:

- role-based relevance for Architect, Developer, and Other, with the best matches sorted first and a dedicated “For my role” filter;
- ranked event cards with an impact score and sorting by Recommended, Highest impact, or Soonest;
- upcoming event cards with remote/hybrid labels, architecture and policy filters, search, save-for-later state, and Register / Attend links that open the organizer’s website in a new tab;
- a shareable developer-focused entry page at `dev.html` (equivalent to `index.html?role=developer`);
- a bulk “Open registration pages” action that opens every event currently matching the active role, filters, and search;
- a curated RSS feed at `feed.xml` that can be pasted into Feedly, Inoreader, NewsBlur, or another RSS reader;
- a weekly refresh script for public AI RSS sources;
- a monthly email workflow that uses a private `DIGEST_TO` repository secret.

## Make the schedule live

The included GitHub Actions workflows are the deployment-ready version of the recurring loop:

1. Put this folder in a GitHub repository.
2. Enable Actions and allow the workflow to write repository contents.
3. `.github/workflows/weekly-refresh.yml` refreshes signals every Friday at 08:00 IST.
4. For the monthly digest, add repository secrets `RESEND_API_KEY`, `DIGEST_FROM`, and `DIGEST_TO`, where `DIGEST_FROM` is a verified sender such as `AI Signal Desk <updates@example.com>`. The first-of-month workflow sends to the private `DIGEST_TO` address.

The browser “Save preference” control is intentionally local-only in this prototype; it does not send a message or upload an email address, and no email is prefilled. The monthly workflow is the explicit opt-in delivery path.

## Data quality note

Conference dates and online-access rules can change. The event list is curated with links to official organizers. Impact scores combine field influence, architecture depth, program breadth, and official-source verification; they are editorial guidance, not an industry-standard rating. The weekly script refreshes the signal feed and rebuilds the event RSS feed. Re-check the organizer page before registering or blocking calendar time.
