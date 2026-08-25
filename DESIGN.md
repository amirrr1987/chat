# ArazChat DESIGN.md — Signal Night

Inspired by [awesome-design-md](https://github.com/voltagent/awesome-design-md) analyses of **Superhuman** (premium dark depth) and **Intercom** (conversational clarity), mapped onto Telegram chat UX.

## Visual Theme & Atmosphere

- Mood: bold, addictive, night-signal — deep navy atmosphere with electric cyan pulse
- Never flat pure black; always layered mesh / aurora gradients
- Density: messaging-list dense but with breathing room (8–12px row gaps)
- Philosophy: one strong accent, elevated glass surfaces, motion that feels alive

## Color Palette & Roles

| Token | Hex | Role |
|-------|-----|------|
| Canvas dark | `#0b1424` | App background (not `#000`) |
| Surface | `#15243a` | Chat rows / cards |
| Primary signal | `#2ad4ff` / `#3adbff` | CTA, FAB, unread, links |
| Secondary mint | `#5eead4` | Online, Saved, secondary FAB |
| Ink | `#eef6ff` | Primary text on dark |
| Ink mute | `#93a9c4` | Previews, timestamps |

Light mode: cool mist `#f3f8fc` with cyan/mint mesh — not sterile white.

## Typography

- FA: Vazirmatn Variable — titles **700–800**, tight tracking
- EN: Poppins 400–800
- Titles: letter-spacing `-0.02em` to `-0.04em`
- List name ≥ `1.05rem` bold; preview muted

## Component Stylings

- **Chat rows**: floating tiles (`18px` radius), soft shadow, glass blur — not flush list lines
- **Avatars**: `58px`, gradient fills, cyan ring, glowing online dot
- **Search**: elevated pill, primary-tinted icon
- **FAB**: physical bottom-right, cyan→mint gradient, breathe glow animation
- **Bubbles**: gradient outgoing, soft shadow, 18px radius with tail
- **Brand chip**: gradient pill “Araz” in header

## Layout Principles

- Mesh background on chats shell (`--araz-mesh`)
- Toolbar translucent + `backdrop-filter`
- Safe-area aware FAB / composer
- RTL text; chrome FAB stays physical right

## Depth & Elevation

1. Mesh canvas (farthest)
2. Glass toolbar
3. Floating chat tiles
4. FAB glow (nearest)

## Do's and Don'ts

**Do**
- Use Ionic + CSS variables (`variables.css` / `chat.css`)
- Keep cyan/mint as the only chromatic energy
- Prefer motion under 300ms with `--araz-ease`

**Don't**
- Pure `#000` backgrounds
- Purple-on-white “AI default” themes
- Flat flush list without elevation
- Cards in the hero / marketing clutter on chat list

## Agent Prompt Guide

> Build ArazChat UI in **Signal Night**: deep navy mesh, electric cyan `#2ad4ff`, mint `#5eead4`, floating glass chat rows, gradient FAB bottom-right, Vazirmatn/Poppins bold hierarchy. Telegram interaction patterns; Superhuman depth; Intercom conversational clarity.
