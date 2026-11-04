# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] — 2026-11-04

### Added

- **Customizable brand name.** The Brand tab now also controls the text beside
  the sidebar mark (`sidebar.brand.name`): the official wordmark, your own text
  (up to 40 characters), or nothing at all.
  - The same single-slot rule as the mark: registered at priority `-1` while a
    custom name mode is active, disposed when **Default** is selected.
  - The name shares the `dsh-taisho-ink:brand` record; 1.1.0 values are read with
    defaults, so upgrading keeps the chosen mark.
- Name copy in both locales, a length limit, and offline checks for the name
  shadow and normalization.

[1.2.0]: https://github.com/xbbkok/dsh-taisho-ink/releases/tag/v1.2.0

## [1.1.0] — 2026-11-04

### Added

- **Customizable brand mark.** A new **Brand** tab in Settings → Plugins lets you
  replace the sidebar's top-left mark with the theme crest, your own image, or
  nothing at all. Default keeps the official mark.
  - The official mark registers at the default priority; the theme shadows it by
    registering `sidebar.brand.mark` at priority `-1` (the single-slot rule:
    one registration per priority, lowest renders).
  - Switching back to Default disposes that registration, so the official mark
    returns without a reload.
  - Custom images are center-cropped to 128×128 and stored as a PNG data URL in
    `localStorage` under `dsh-taisho-ink:brand` — never uploaded.
- Brand UI dictionaries (`en`, `zh`) registered through the locale service; the
  tab label follows the interface language.
- Offline checks for the Brand tab, the shadow registration and the locale
  dictionaries.

[1.1.0]: https://github.com/xbbkok/dsh-taisho-ink/releases/tag/v1.1.0

## [1.0.1] — 2026-10-21

Documentation only.

### Added

- Animated ambience preview (`docs/ambience.gif`): embers rising and wisteria
  petals falling over both palettes, rendered from the plugin's own stylesheet
  by `docs/preview.html`.
- A check that the preview GIF ships in the repository and is a valid GIF.

[1.0.1]: https://github.com/xbbkok/dsh-taisho-ink/releases/tag/v1.0.1

## [1.0.0] — 2026-10-21

First public release.

### Added

- Theme token layer: 14 `--dsw-alias-*` variables supplied as light/dark pairs
  through `ctx.theme.overrideTokens`, so the Appearance switch keeps working.
- Ambient layer (`shell.overlay`, id `dsh-taisho-ink.atmosphere`, order `80`):
  crimson/indigo glow, washi-fibre texture, vignette, 18 rising embers and
  10 wisteria petals falling.
- Nichirin-sun crest before the blank-session headline
  (`conversation.hero.brand.mark`).
- Crimson text selection and a brand-tinted scrollbar.
- `prefers-reduced-motion` support: particles and animations stop.
- Locale metadata (`en`, `zh`) for the Plugin Manager row, plus an icon.
- Bundle declaration (`dsh.bundle.patch`) so `dsh plugin add` mounts the plugin.
- Offline checks: manifest shape, patch row, locale files, icon, client bundle
  syntax and slot ids, and a redaction guard against local paths and tokens.

[1.0.0]: https://github.com/xbbkok/dsh-taisho-ink/releases/tag/v1.0.0
