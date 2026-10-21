# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
