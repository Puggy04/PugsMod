/*
 * Couch TV configuration — edit this file to change your tiles.
 *
 * Each tile is matched against the apps installed on the TV by `match`
 * (case-insensitive substring of the app name), so you never need to know
 * Samsung's internal app IDs. If you do know one, set `appId` to pin it.
 * `url` is used when the app isn't installed, or when previewing in a browser.
 */
window.COUCH_CONFIG = {
  name: "",                    // shown in the greeting, e.g. "Pug"
  use24h: false,

  // OLED care (the S95B is a QD-OLED panel)
  screensaverAfterSec: 180,    // idle time before the black screensaver
  pixelShiftEverySec: 120,     // nudge the whole UI by a few px
  pixelShiftMaxPx: 6,

  tiles: [
    { label: "YouTube",     match: "youtube",     color: "#c4302b", url: "https://www.youtube.com/tv" },
    { label: "Netflix",     match: "netflix",     color: "#b20710", url: "https://www.netflix.com" },
    { label: "Prime Video", match: "prime video", color: "#1a98ff", url: "https://www.primevideo.com" },
    { label: "Disney+",     match: "disney",      color: "#113ccf", url: "https://www.disneyplus.com" },
    { label: "Plex",        match: "plex",        color: "#e5a00d", url: "https://app.plex.tv" },
    { label: "Spotify",     match: "spotify",     color: "#1db954", url: "https://open.spotify.com" },
    { label: "Twitch",      match: "twitch",      color: "#9146ff", url: "https://www.twitch.tv" },
    { label: "Browser",     match: "internet",    color: "#5b6b80", url: "about:blank" }
  ]
};
