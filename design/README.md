# Design reference

Source of truth for the UI: the wireframe canvas "JD Agent — Wireframe" (Claude Design). The two files in `wireframe/` are its exported artboards (`.dc.html`, Design Component format): read them for layout, copy and behavior, rebuild them as real components. Do not ship them.

- `wireframe/home.dc.html` — Home
- `wireframe/chat.dc.html` — Chat
- `assets/` — Clover logos (lockup and mark)

## Tokens (from the Clover Platform)

| Token | Value | Use |
|---|---|---|
| primary | #005b7c | buttons, links, user chat bubbles |
| accent | #00bda8 | progress, checks, selection |
| accent-tint | #e6f8f6 | banner, chips, selection chip |
| accent-foreground | #006a5b | text on accent-tint |
| foreground | #111827 | text |
| body | #374151 / #4b5563 | secondary text |
| muted-foreground | #6b7280 | hints, placeholders |
| surface | #f8fafb | page background (chat), assistant bubbles |
| border | #e5e7eb | borders, dividers |
| radius | 10px (lg), 14px (xl), 999px (pill) | |
| font | Poppins 400/500/600 | UI; JD document preview in Arial/Helvetica |

## Layout rules
- Home and Chat each fit one screen (1440×900 reference), no scrolling anywhere.
- Chat: chat column left (max 520px), JD preview right as a plain document page (max 720px).
- Minimum touch target 44px. Icons: inline stroke SVG, no emoji except the "JD pronta" state.
