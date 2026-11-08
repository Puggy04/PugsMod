# S95B (QN65S95BAFXZC): lightweight couch settings

These settings are for a 2022 Samsung S95B QD-OLED (Tizen 6.5). Menu names can change slightly between firmware versions. Update the firmware first: **Settings → Support → Software Update**.

> **Panel note:** this TV has about **13,700 hours** on the panel. That is roughly 4–5 years of daily viewing at 8 h/day, so the panel-care section is worth doing.

## 1. Make it lighter and quieter

| Setting | Path | Set to |
|---|---|---|
| Ads based on interest | Settings → Support → Terms & Privacy → Interest-Based Advertisement | Off |
| Viewing data | Settings → Support → Terms & Privacy → Viewing Information Services | Off |
| Voice recognition / Bixby wake | Settings → General → Voice → Voice Wake-up | Off (unless used) |
| Universal Guide / Samsung TV Plus autostart | Settings → General → Smart Features → Autorun Smart Hub | Off |
| Reopen your last app on power-on | Settings → General → Smart Features → Autorun Last App | On (lands back in Couch TV) |
| Quick start (instant on) | Settings → General → System Manager → Power and Energy Saving | On if you want fast wake; Off saves a little power in standby |
| App auto-updates | Smart Hub → Apps → ⚙ → Auto Update | On |
| Delete apps you never use | Apps → ⚙ → select → Delete | Frees RAM/storage; menus feel faster |

## 2. Picture (accurate, low effort)

| Use | Picture Mode | Notes |
|---|---|---|
| Films / series | **Filmmaker Mode** (or Movie) | Turns off motion smoothing; accurate colour |
| Bright room / daytime TV | Standard with **Picture Clarity → Off** or Custom | Standard is punchy but less accurate |
| Sports | Standard, Picture Clarity → Custom, Blur Reduction ~5, Judder Reduction 0 | Reduces blur without making everything look like a soap opera |

Other settings:

- **Settings → Picture → Expert Settings → Contrast Enhancer:** Off for films, Low for TV.
- **Adaptive Picture / Intelligent Mode** (Settings → General → Intelligent Mode Settings): Off. It changes brightness with the room light, which can look inconsistent.

## 3. Gaming and sound devices

- All 4 HDMI ports support HDMI 2.1, up to 4K @ 144 Hz.
  - Turn on **Input Signal Plus** for each port you use: Settings → Connection → External Device Manager.
- **Game Mode:** Settings → Connection → Game Mode Settings → **Auto**. ALLM switches the TV into Game Mode by itself.
- **Soundbar / AV receiver:** use the **HDMI eARC** port (HDMI 3), then set Settings → Sound → Expert Settings → **HDMI-eARC Mode → Auto**.
- **Anynet+ (HDMI-CEC):** On. The TV remote then controls the soundbar and console.

## 4. OLED panel care (important at 13.7k hours)

- **Pixel Shift:** Settings → General → **Panel Care** (also under Support → Device Care) → Pixel Shift **On**.
- **Adjust Logo Brightness / Logo Luminance:** same menu → **High**. It dims static logos, such as channel logos and game HUDs.
- **Panel Refresh / Pixel Refresh:** the TV runs a short refresh by itself during standby after a few hours of use.
  - **Leave it plugged in** with power at the wall after you switch it off with the remote. Turning the wall power off skips the refresh.
  - You can also run the manual **Panel Refresh** from the same menu, but **only about once a year, or if you see image retention**. It wears the panel, so don't run it routinely.
- **Screen Saver:** Settings → General → System Manager → Time → Sleep / **Screen Saver → 2 min**.
- **Auto Power Off** (Settings → General → Eco Solution): set it to 4 hours if the TV gets left on.
- **Brightness:** keep **Brightness** well under max for everyday SDR. The panel lasts longer at moderate levels.

## 5. Phone as a remote (optional)

Pair the TV in the **SmartThings** app (iOS/Android). Its remote has a keyboard, which is useful for search and logins.
