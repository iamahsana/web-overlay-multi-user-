# Web Overlay Multi-User

A free Google Apps Script + Google Sheets web app for multi-user account notes and public browser-source overlays (W/L and text).

## Architecture
- Google Apps Script serves both dashboard and transparent overlay pages.
- Google Identity Services authenticates each user with a Google account.
- Google Sheets stores user-scoped rows. Every read/write checks the verified Google ID token and scopes records to its immutable Google subject ID.
- Overlay URLs contain an opaque record ID, not a user's login token. Overlay endpoints are read-only and refresh every 2.5 seconds.
- GitHub repository is the source/deployment archive; the live application runs on Google Apps Script.

## Setup (one-time)
1. Create a Google Cloud project and configure OAuth consent screen (External; publish for public use). Create an OAuth Client ID of type **Web application**.
2. Add the Apps Script web app URL origin to Authorized JavaScript origins if required by Google Identity Services. Set the client ID in Apps Script **Project Settings → Script Properties** as `GOOGLE_CLIENT_ID`.
3. Open script.google.com, create a project, and copy `Code.gs`, `Index.html`, and `Overlay.html` from this repository into matching Apps Script files.
4. In Apps Script editor, select and run `setup` once; approve the requested Google Sheets permission. This creates the spreadsheet database.
5. Deploy → New deployment → Web app. Execute as **Me**; Who has access: **Anyone**. Copy the deployment URL.
6. In `Index.html`, replace both occurrences of `__CLIENT_ID__` with the OAuth client ID. Save and deploy a new version.
7. Open the deployment URL, sign in with Google, and create overlays. Copy the generated overlay URL into OBS/streaming browser source.

## Sheets
The setup function creates Users, Catatan, and Overlays tabs. The application creates per-user rows and enforces ownership in the Apps Script backend.

## Important limits
Google Apps Script and Google Sheets have free quotas and rate limits; this is free-tier software, not unlimited-capacity infrastructure. Overlay polling is every 2.5 seconds to reduce unnecessary calls. Public overlay IDs are unguessable UUIDs; treat them as shareable public URLs. Do not put passwords or other secrets in notes.

## Security
The app validates Google ID tokens against the configured OAuth audience on every dashboard API call. Public overlay requests expose only the selected overlay payload. Do not share the spreadsheet itself publicly. Keep its owner account secure.
