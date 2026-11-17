# Web Overlay Multi-User

A free-tier Google Apps Script + Google Sheets web app for multi-user account notes and public browser-source overlays (W/L and text).

## Architecture
- Google Apps Script serves the dashboard and transparent overlay pages.
- Google Identity Services authenticates each dashboard user with a Google account.
- Google Sheets stores user-scoped rows. Dashboard reads and writes verify the Google ID token and scope records to its immutable Google subject ID.
- Public overlay URLs use an opaque UUID and expose only the selected overlay data. The overlay refreshes every 2.5 seconds.
- GitHub is the source archive. The live app runs on Google Apps Script.

## Deploy with clasp
1. Create a Google Apps Script project and enable the Apps Script API in Google account settings.
2. In a trusted local/cloud terminal, install clasp: `npm install -g @google/clasp`.
3. Authenticate using `clasp login`. Complete Google authorization in your own browser; never share OAuth codes or tokens.
4. In the repository root, create a local `.clasp.json` containing the Apps Script project ID:
   `{"scriptId":"YOUR_SCRIPT_ID","rootDir":"."}`
   This file is ignored by Git and must not be committed.
5. Run `clasp push -f` to upload `Code.gs`, `Index.html`, `Overlay.html`, and `appsscript.json`.
6. Create a Google Cloud OAuth client ID of type **Web application** and configure the OAuth consent screen. Configure its authorized JavaScript origins as required by Google Identity Services.
7. In Apps Script → Project Settings → Script Properties, set `GOOGLE_CLIENT_ID` to that client ID. Replace both `__CLIENT_ID__` placeholders in `Index.html` with the same client ID, then push the updated files again.
8. In Apps Script editor, run `setup()` once and approve the requested Google Sheets permission. This creates the database spreadsheet.
9. Deploy → New deployment → Web app. Execute as **Me**; Who has access: **Anyone**. Copy the deployment URL.
10. Open the deployment URL, sign in with Google, and create overlays. Copy the generated overlay URL into your streaming software's browser source.

## Sheets
The `setup()` function creates `Users`, `Catatan`, and `Overlays` tabs. The application stores per-user rows and enforces ownership in the Apps Script backend.

## Important limits
Google Apps Script and Google Sheets have free quotas and rate limits; this is free-tier software, not unlimited-capacity infrastructure. Overlay polling is every 2.5 seconds. Public overlay IDs are shareable public URLs; anyone who has one can view that overlay. Do not put passwords or other secrets in notes.

## Security notes
- The dashboard validates Google ID tokens against the configured OAuth audience on every dashboard API call.
- Public overlay requests are read-only and expose only the selected overlay payload.
- Do not share the spreadsheet publicly. Keep the Google account that owns the script and spreadsheet secure.
- Keep `.clasp.json` and `.clasprc.json` private. Never commit credentials, OAuth codes, or tokens.
- Before public launch, test user isolation with two separate Google accounts and verify that one user cannot read or modify another user's records.
