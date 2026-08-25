# ArazChat Design System (Master)

**Pattern:** Telegram UX · **Look:** Signal Night (Superhuman depth × Intercom clarity)  
**Stack:** Ionic Vue · **Source:** `DESIGN.md` + `apps/web/src/theme/variables.css`

## Principles
- Ionic + CSS variables only; almost no page-scoped CSS
- Bold addictive UI: mesh atmosphere, floating rows, cyan signal glow
- Never pure black — navy `#0b1424` + aurora mesh
- Primary `#2ad4ff` · secondary mint `#5eead4`
- Touch ≥44px; `prefers-reduced-motion` respected
- FAB physical bottom-right (even in RTL)

## Tokens
| Role | Token |
|------|--------|
| Brand / CTA | `--ion-color-primary` |
| Mesh / list bg | `--araz-mesh` |
| Glow | `--araz-glow` |
| Chat wallpaper | `--araz-chat-wallpaper` |
| Bubbles | `--araz-bubble-in-bg` / `--araz-bubble-out-bg` |
| Motion | `--araz-motion` (~220ms) |

## Anti-patterns
- Flat `#000` canvas
- Purple/glow AI-default kitsch
- Flush undivided list rows
- Hardcoded hex in Vue SFCs
- FAB stuck on visual left in RTL

## Refs
- [awesome-design-md](https://github.com/voltagent/awesome-design-md) — Superhuman, Intercom
- Project `DESIGN.md`
