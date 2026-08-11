// Runtime config for the static client.
//
// GAME_SERVER_URL points the client at the WebSocket game server. Leave it
// empty when the client and server are deployed together (the server serves
// this page), which is the default and needs no change.
//
// When the static client is hosted separately (for example Cloudflare Pages),
// set this to the game server origin, e.g. "https://game.example.in". Do not
// add a trailing slash. On a static host with a build step you can generate
// this file from an env var instead of committing the value (see SPLIT.md).
window.GAME_SERVER_URL = "";
