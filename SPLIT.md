# Splitting the client from the game server

The client (static files in `public/`) and the WebSocket game server (`server.js`)
can run together (the default, nothing to configure) or on separate hosts. The
split lets the static client sit on a CDN edge (e.g. Cloudflare Pages) while only
the real-time server runs on a VM or paid instance.

Same-origin is the default: with none of the env vars below set, and
`GAME_SERVER_URL` left empty, everything behaves exactly as a combined
deployment.

## The three settings

| Where   | Setting          | Purpose |
|---------|------------------|---------|
| Client  | `GAME_SERVER_URL` in `public/config.js` | Backend origin the client connects to. Empty = same origin. |
| Server  | `CLIENT_ORIGIN` (env)   | Comma-separated origin(s) allowed to connect cross-origin (CORS). |
| Server  | `PUBLIC_URL` (env)      | Where players load the client from. The QR code and join link use this. Set it to the static host URL. |

The Socket.IO client library loads from the game server (via `GAME_SERVER_URL`),
so its version always matches the server. Only `app.js` loads from the static
host.

## Deploying the static client to Cloudflare Pages

No build step is required, but a one-line build command keeps the backend URL
out of git and injects it at deploy time.

- Framework preset: **None**
- Build output directory: `public`
- Build command:
  ```bash
  node -e "require('fs').writeFileSync('public/config.js','window.GAME_SERVER_URL='+JSON.stringify(process.env.GAME_SERVER_URL||'')+';')"
  ```
- Environment variable: `GAME_SERVER_URL = https://your-game-server-domain`
  (no trailing slash)

If you prefer not to use a build command, edit `public/config.js` by hand and
set the URL there, but do not commit that value to the shared repo.

## Configuring the game server

Set these on whichever host runs `server.js`:

```
CLIENT_ORIGIN=https://your-pages-project.pages.dev
PUBLIC_URL=https://your-pages-project.pages.dev
```

Use your custom domain instead of the `.pages.dev` URL once it is attached. If
players will reach the client at multiple origins, list them all in
`CLIENT_ORIGIN` separated by commas.

## Sanity check after splitting

1. Open the Pages URL, create a room. The QR code and join link should show the
   Pages URL, not the server URL.
2. Open the join link on a second device and confirm it joins the room.
3. If the connection fails in the browser console with a CORS error, the origin
   is missing from `CLIENT_ORIGIN` on the server.
