# Agora — design reference (for the build team)

This file replaces the in-app palette screen. It is for designers and developers only.

## Colour (used sparingly; photos lead)
| Token | Hex | Use |
|---|---|---|
| blue | `#3869FE` | Primary action, active tab, selected state |
| blue-ink | `#2850D8` | Small blue text and links (AA on white) |
| lime | `#D4FA60` | One highlight only: the "חדש" badge, the arrow on the request card |
| lavender | `#EFF3FF` | Inputs, info cards, AI panels |
| lavender-2 | `#E2E9FF` | Hover/divider on lavender |
| white | `#FFFFFF` | Screen background |
| ink | `#16181D` | Headings, primary text, selected chips |
| ink-2 | `#43474F` | Body text |
| mute | `#6C717B` | Secondary text |
| line | `#E8EAF0` | Dividers, outlines |

Rough share of the screen: white + ink 82%, lavender 10%, blue 6%, lime 2%.

## Type — Google Sans only
Google Sans 17pt, the files supplied by design (Regular + SemiBold), subset to Hebrew + Latin in `src/assets/fonts`, declared in `src/fonts.css`. Regular covers 400–500, SemiBold covers 600–700.
Screen title 26/700 · section 19/700 · card title 15/600 · body 15/400 · secondary 13/400.

## AI
`src/data/ai.ts` holds both prompts (item recognition when giving, photo search) and the JSON contracts.
In production these move to a server endpoint; the UI only needs the same JSON shape back.
