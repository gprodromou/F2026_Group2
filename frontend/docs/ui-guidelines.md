# fit4you UI Guidelines

Written companion to `frontend/src/styles/tokens.css`. Components are built from this document.

**Golden rule:** every screen uses only tokens from `tokens.css`. No hex colours, no px font sizes, no hand-picked spacing. If a value is missing, add a token first, then use it.

`tokens.css` is imported once, in `App.jsx`.

---

## 1. Brand

- **Name:** fit4you (logo set in italic bold serif)
- **Look:** soft green backgrounds, magenta accents, large rounded cards, serif type
- **Tone:** friendly, encouraging, personal-trainer feel

## 2. Colour

### Palette

| Token | Value | Use |
|---|---|---|
| `--color-green-300` | #a9d0a6 | Header and footer background |
| `--color-green-400` | #68cf6c | Feature card and chat bubble fill, always used at 80% opacity via `--color-green-400-80` |
| `--color-green-500` | #4caf50 | Card borders, active carousel dot |
| `--color-pink-500` | #d43ab7 | Primary buttons, icons, login border |
| `--color-pink-600` | #b4319c | Primary hover |
| `--color-pink-700` | #942980 | Primary pressed, focus |
| `--color-pink-500-50` | #d43ab7 at 50% | Login card fill (`--color-bg-card-login`) |
| `--color-pink-100` / `-200` | #d9a0d0 / #c294b4 | Secondary button hover / pressed |
| `--color-grey-300` | #bdbdbd | Input fill, used at 80% opacity via `--color-grey-300-80` |
| `--color-ink` | #333333 | Main text, logo |
| `--color-link` | #0d6efd | Text links |

### Semantic tokens
Components should use semantic tokens (`--color-bg-card`, `--color-text`, `--color-accent`, ...) rather than raw palette tokens, so a re-theme only changes `tokens.css`.

### Opacity
Transparent colours are defined as tokens with `color-mix()`, for example `--color-green-400-80` (green-400 at 80%). Components never use raw `rgba()` values.

### Backgrounds
- Page: `--gradient-page` (green fading to white)
- Login card: `--color-pink-500-50` (flat fill, no gradient)

## 3. Typography

- **Family:** `--font-family-base` (Merriweather, serif fallback)
- **Logo:** `--font-family-logo`, `--font-style-logo` (italic), bold

| Token | Size | Use |
|---|---|---|
| `--font-size-xs` | 12px | Input labels |
| `--font-size-sm` | 14px | Footer, links, helper text |
| `--font-size-md` | 16px | Body, nav, buttons |
| `--font-size-lg` | 20px | Card body text |
| `--font-size-xl` | 28px | Card headings, chat bubble |
| `--font-size-2xl` | 40px | Page headings (e.g. "Login") |
| `--font-size-logo` | 72px | Header logo |

Weights: `--font-weight-regular` (400), `--font-weight-bold` (700).
Line heights: `--line-height-base` for body, `--line-height-tight` for card headings.
Card text uses `--letter-spacing-wide`.

## 4. Spacing

4px-based scale: `--space-1` (4) / `-2` (8) / `-3` (12) / `-4` (16) / `-5` (24) / `-6` (32) / `-7` (48) / `-8` (64).
Use these for every margin, padding and gap.

## 5. Shape

| Token | Use |
|---|---|
| `--radius-sm` | Buttons |
| `--radius-md` | Inputs |
| `--radius-lg` | Feature cards, login card |
| `--radius-bubble` | Chat bubble |
| `--radius-round` | Dots, circular icons |
| `--border-width` | Card outlines (3px) |

## 6. Layout

- Header height `--header-height`, footer height `--footer-height`
- Content max width `--content-max-width`, centred
- Breakpoints: small ≤ 640px, medium ≤ 1024px (CSS variables cannot be used inside `@media`, so write these values directly and keep them in sync)
- Structure: **Header** (logo, slogan, nav, Sign up / Sign in) → **Main content** → **Footer** (logo, copyright, social icons)

## 7. Component specs

### 7.1 Button

| State | Primary | Secondary (outline) |
|---|---|---|
| Default | bg `--btn-primary-bg`, text `--btn-primary-text` | bg `--btn-secondary-bg`, text and border `--btn-secondary-text` |
| Hover | bg `--btn-primary-bg-hover` | bg `--btn-secondary-bg-hover` |
| Focus | `--shadow-focus` ring, bg unchanged | same ring |
| Active | bg `--btn-primary-bg-active` | bg `--btn-secondary-bg-active` |
| Disabled | bg `--btn-primary-bg-disabled`, `cursor: not-allowed` | 50% opacity, `cursor: not-allowed` |

Padding `--btn-padding-y` / `--btn-padding-x`, radius `--btn-radius`, font `--btn-font-size`.
Used for: **Sign up** (secondary), **Sign in** (primary), **Sign In** inside the login card (primary, full width).

### 7.2 Input

| State | Spec |
|---|---|
| Default | bg `--input-bg`, no border, text `--input-text` |
| Hover | bg slightly lighter (optional) |
| Focus | bg `--input-bg-focus`, border `--input-border-focus`, `--shadow-focus` |
| Filled | same as default |
| Disabled | bg `--input-bg-disabled`, `cursor: not-allowed` |

Label sits above the input in `--input-label-size`. Padding `--input-padding-y` / `--input-padding-x`, radius `--input-radius`.

### 7.3 Feature card
Fill `--card-bg`, border `--card-border`, radius `--card-radius`, padding `--card-padding`. Icon (pink, `--color-accent`) above centred text in `--font-size-lg`.

### 7.4 Login card
Same shape as a feature card but with fill `--color-bg-card-login` and border `--color-border-card-login`. Contains a `--font-size-2xl` italic heading, two labelled inputs, a "Forgot Password?" link, a primary button and a "Register Here" link.

### 7.5 Navigation link
Colour `--nav-link-color`; hover `--nav-link-color-hover`; active page `--nav-link-color-active`; spacing `--nav-gap`. "Services" has a dropdown chevron.

### 7.6 Text link
Colour `--color-link`, underlined; hover `--color-link-hover`.

### 7.7 Carousel dots
Size `--dot-size`, round, colour `--dot-color`; current slide `--dot-color-active`.

### 7.8 Chat bubble ("Chat with us!")
Fill `--bubble-bg`, dashed border `--bubble-border`, radius `--bubble-radius`, text `--font-size-xl`. Fixed at the bottom right of the screen.

### 7.9 Footer
Background `--color-bg-footer`, copyright in `--font-size-sm`, social icons at `--footer-icon-size` in `--footer-icon-color`, hover `--footer-icon-color-hover`.

## 8. Accessibility

- Keep a visible focus ring on every interactive element.
- Text on pink buttons is white; check contrast against the final pink value.

## 9. Out of scope (for now)

Error and status screens and states (error, success and warning colours, input error state) are not designed yet. Add tokens and specs here once they are.

## 10. How to use the tokens

```css
.card {
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  font-size: var(--font-size-lg);
}
```
