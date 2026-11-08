# Couch TV

A small, fast home screen for the **Samsung QN65S95BAFXZC** (65" S95B QD-OLED, 2022, Tizen 6.5).
It is plain HTML, CSS and JS, with no framework, no build step and no tracking.

- You can move around with the D-pad. It shows 8 tiles (YouTube, Netflix, Prime, Disney+, Plex, Spotify, Twitch, Browser).
- Tiles match the apps installed on the TV by name, so you don't need Samsung app IDs.
- It is easy on the OLED panel:
  - The background is true black and the text is grey instead of white.
  - Tiles you aren't on stay dim.
  - The whole screen moves a few pixels every 2 minutes.
  - After 3 minutes idle it goes black and shows only a dim clock that moves around.
- Press the **red (A)** button to turn the picture off right away, for example while music plays. Press any key to bring it back.

## Files

| File | What it is |
|---|---|
| `js/config.js` | **Edit this.** Tiles, your name, 12/24h clock, OLED timers |
| `index.html`, `css/`, `js/app.js` | The launcher |
| `config.xml` | Tizen app settings: permissions and remote key access |
| `docs/S95B-settings.md` | Recommended TV settings for a fast, clean couch setup |

## Try it in a browser first

Open `index.html` in a desktop browser. Use the arrow keys to move, **Enter** to open a tile, and **Esc** to quit.

## Install on the TV (Developer Mode)

You need a PC on the same network as the TV.

1. **Turn on Developer Mode on the TV**
   1. Go to **Apps**, then type `1 2 3 4 5` on the remote's number pad. On a Smart Remote without number keys, use the on-screen number pad.
   2. Turn **Developer mode** **On**.
   3. Enter your PC's IP address.
   4. Hold the power button to restart the TV.
2. **Install Tizen Studio on the PC** from developer.samsung.com/smarttv. In its Package Manager, install
   **Extension SDK → TV Extensions-*x*** and **Samsung Certificate Extension**.
3. **Create a certificate**: go to *Tools → Certificate Manager → +* and choose **Samsung** with the TV profile. Sign in with your Samsung account. Add the TV's DUID, which Device Manager shows once you connect.
4. **Connect, build and install** from a terminal:

   ```bash
   # TV IP: Settings → General → Network → Network Status → IP Settings
   sdb connect 192.168.1.50
   tizen package -t wgt -s <your-cert-profile> -- couch-tv
   tizen install -n couch-tv/CouchTV.wgt -t <tv-device-name>   # name from `sdb devices`
   ```

   Or, in Tizen Studio, use *File → Import → Tizen → Tizen Project*, then right-click the project and choose **Run As → Tizen Web Application**.

5. Couch TV now shows in **Apps**.
   1. Long-press it and choose **Move** to put it first on the Smart Hub bar.
   2. Go to **Settings → General → Smart Features → Autorun Last App** and turn it **On**. The TV then reopens Couch TV when it wakes, as long as Couch TV was the last app open.

> Apps installed through Developer Mode can stop launching after some time, because the developer certificate expires. If that happens, run step 4 again.

## Customising tiles

```js
{ label: "Jellyfin", match: "jellyfin", color: "#7b5cd6", url: "http://192.168.1.10:8096" }
```

- `match` is part of the app's name as it appears in Apps.
- `url` is used if the app isn't installed. The tile then shows a small "web" tag and opens the link in the TV browser.
- `appId` (optional) pins the tile to an exact Tizen app ID.

Remove tiles you don't use. The grid is 4 wide.
