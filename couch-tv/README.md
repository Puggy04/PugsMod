# Couch TV

A small, fast home screen for the **Samsung QN65S95BAFXZC** (65" S95B QD-OLED, 2022, Tizen 6.5).
It is plain HTML, CSS and JS, with no framework, no build step and no tracking.

- You can move around with the D-pad. It shows 6 tiles: YouTube, Netflix, Disney+, Crave, Apple Music and **Xbox**, which switches to the console's HDMI input.
- **Your own photos as wallpapers.** They crossfade every 5 minutes and are dimmed so the text stays readable. Press the **green (B)** button to skip to the next photo.
- Tiles match the apps installed on the TV by name, so you don't need Samsung app IDs.
- It is easy on the OLED panel:
  - The background is true black and the text is grey instead of white.
  - Tiles you aren't on stay dim.
  - The whole screen moves a few pixels every 2 minutes.
  - After 3 minutes idle the tiles disappear and your photos play as a slideshow with a dim clock that moves around. Set `screensaverMode: "black"` in `js/config.js` for an all-black screen instead.
- Press the **red (A)** button to turn the picture off right away, for example while music plays. Press any key to bring it back.

## Files

| File | What it is |
|---|---|
| `js/config.js` | **Edit this.** Tiles, Xbox HDMI port, your name, 12/24h clock, wallpaper and OLED timers |
| `wallpapers/` + `tools/add-wallpapers.py` | Your photos, and a script that prepares them |
| `index.html`, `css/`, `js/app.js` | The launcher |
| `config.xml` | Tizen app settings: permissions and remote key access |
| `docs/S95B-settings.md` | Recommended TV settings for a fast, clean couch setup |

## Try it in a browser first

Open `index.html` in a desktop browser. Use the arrow keys to move, **Enter** to open a tile, **G** for the next photo, and **Esc** to quit.

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

## Wallpapers (your photos)

1. Put the photos you want in a folder on your computer. Landscape photos work best.
   - From an iPhone: AirDrop them to a Mac, or copy them over with the Photos app or iCloud.com. iPhone `.HEIC` photos are fine.
2. Run the photo script:

   ```bash
   pip install pillow pillow-heif
   python3 couch-tv/tools/add-wallpapers.py ~/Pictures/TV
   ```

   - It resizes each photo to 1920×1080 and fixes its rotation.
   - It saves the photos into `couch-tv/wallpapers/` and updates `js/wallpapers.js`.
   - Portrait photos are skipped. Add `--portrait` to include them cropped.
   - Add `--clear` to replace your current set instead of adding to it.
3. Reinstall the app on the TV (step 4 above).

**Changing photos without reinstalling:** if you have a NAS or home server, set `wallpaperFeed` in `js/config.js` to the address of a JSON list of image links, for example `["http://192.168.1.10/tv/a.jpg", ...]`. The TV reads that list each time Couch TV starts.

Wallpaper settings in `js/config.js`:

| Setting | What it does |
|---|---|
| `wallpaperEverySec` | How often the photo changes, in seconds |
| `wallpaperDim` | How dark the photos are. `0` is full brightness and `1` is black. Default `0.55` |
| `wallpaperShuffle` | `true` plays photos in random order |

## Xbox

The **Xbox** tile switches the TV to the Xbox's HDMI input full screen. Press **Back** on the TV remote to return to Couch TV.

1. In `js/config.js`, set `hdmi:` on the Xbox tile to the port it's plugged into. It is `1` by default.
   - Every port on the S95B supports HDMI 2.1, so any of them can do 4K/120.
   - Use a port other than **HDMI 3** if you have a soundbar on eARC.
2. **Turn on HDMI-CEC on the Xbox:** Settings → General → TV & display options → Device control → turn on **HDMI-CEC**, plus **Console turns on TV** and **TV turns off console**.
3. **Turn on Anynet+ on the TV:** Settings → Connection → External Device Manager → Anynet+ (HDMI-CEC) → **On**.

Pressing the Xbox button on the controller then turns on the TV and switches it to the Xbox, even when Couch TV is open.

> The tile uses Samsung's TV Window API to show the input. If your firmware blocks that API, the tile tells you to turn the Xbox on instead, and Anynet+ switches the input automatically. The Xbox also works with the TV's **Game Mode → Auto**, so you get low input lag automatically.

## Customising tiles

```js
{ label: "Jellyfin", match: "jellyfin", color: "#7b5cd6", url: "http://192.168.1.10:8096" }
```

- `match` is part of the app's name as it appears in Apps.
- `url` is used if the app isn't installed. The tile then shows a small "web" tag and opens the link in the TV browser.
- `appId` (optional) pins the tile to an exact Tizen app ID.

Remove tiles you don't use. Set `columns` to choose how many tiles go in each row. Tiles resize to fit.
