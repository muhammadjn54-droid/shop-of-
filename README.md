# Shop Inventory frontend

React + TypeScript + Vite inventory CRM, retaining the compact green/white spreadsheet interface.
Backend: [shop-becend](https://github.com/muhammadjn54-droid/shop-becend).

## Development

```powershell
npm ci
$env:VITE_API_URL='http://127.0.0.1:8000'
npm run dev
```

`VITE_API_URL` is the backend origin, without `/api`. Set it before building; production needs an HTTPS API with the frontend origin included in `CORS_ALLOWED_ORIGINS`.

```powershell
npm run type-check
npm test
npm run build
```

The tests exercise actual Axios interceptors with controlled responses: concurrent refresh, transient outages, revoked sessions, delayed responses, logout/login races and migration of existing sessions. CI runs these checks on pull requests.

## Account and session behavior

- `/login`, `/register`, `/forgot-password`, `/reset-password?uid=...&token=...` implement the account flows.
- `/account` replaces the profile dialog. Username, first name and last name are editable; email is read-only. After a username change, use the new login (or email).
- Sessions persist across reloads and synchronize across tabs. Public login/reset requests do not carry stale access tokens. A temporary network/server error preserves the session and offers retry.
- Concurrent expired-token requests share one refresh. Responses from a previous account cannot populate the new account's screen. Logout clears this browser immediately and revokes the refresh token on the server when reachable.
- Product/sales pagination matches the API's 20 items per page. Search results ignore stale requests. Return values are reflected in revenue, cost and profit.
- Archiving a product keeps its sale history and permits returns from the receipt. Archived stock is reported separately.

## Release coordination

Deploy with the matching backend changes. Follow the backend [PostgreSQL/setup guide](https://github.com/muhammadjn54-droid/shop-becend/blob/main/DEPLOY.md) from the release branch before promoting production: Vercel requires PostgreSQL, Cloudinary, a stable secret and explicit frontend origins. The old temporary SQLite deployment can lose accounts regardless of frontend fixes.

SMTP and `FRONTEND_URL` must be configured for password-reset emails. Existing users may need to sign in once after the backend token validation changes. Preview environments should use an isolated backend/database.

Manual local verification covered login, reload, a second tab, profile editing, inventory creation, sale, partial return, barcode search and archiving without deleting history. The setup guide includes the remaining production verification after environment configuration.
