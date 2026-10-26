# TechBloom Essentials POS

Phase 1 is a static, frontend-only POS prototype built with HTML, CSS, and
JavaScript. It requires no Laravel, Python, database, package installation, or
paid service to preview.

## Run locally

Open `index.html` in a current desktop or mobile browser. In VS Code, you can
also open the project folder and use an optional static preview extension such
as Live Server. The app loads these local files using paths relative to the
HTML page:

- `styles.css`
- `app.js`
- `Techbloom Essential Logo.jpg`

Google Fonts are an optional enhancement; system fonts are used if they are
unavailable.

## Publish with GitHub Pages

1. Create or open the GitHub repository for this project.
2. Add the root-level `index.html`, `styles.css`, `app.js`, the logo image, and
   this README. Keep the logo filename and capitalization unchanged.
3. Push the files to the branch you want to publish (commonly `main`).
4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**; select the
   branch and the `/(root)` folder, then save.
6. Wait for deployment to finish and open the URL shown on the Pages settings
   screen.

The relative asset paths work both at a project URL such as
`https://OWNER.github.io/REPOSITORY/` and when opened locally.

## What works in this prototype

- Responsive dashboard, POS, inventory, sales history, reports, and settings
- Product search, cart quantity changes, discount/total calculations, cash
  change preview, demo checkout, and printable demo receipt
- Initial prices: Mini USB Fan ₱50.00, Sweet Night Sugar Perfume ₱70.00, and
  Venom Perfume ₱60.00
- Demo checkout and products added during a session are not saved or synced

The welcome screen is a **demo entry screen, not a login**. It does not
authenticate users or protect routes or data. Do not enter passwords or private
business information into this public static demo.

## Not included

GitHub Pages serves static files. Real authentication and password hashing,
protected server routes, administrator setup/recovery, persistent sales and
inventory, multi-device sync, permissions, and workbook synchronization
require a separately implemented backend and are not provided by this
prototype.

`server.py` and `start_server.bat`, if present in the working folder, are not
needed for local static preview or GitHub Pages. Do not use them as an
authentication or public-hosting solution.
