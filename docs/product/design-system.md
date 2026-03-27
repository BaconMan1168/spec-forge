# =========================================================
# SPECFORGE Design System (Claude Spec)
# =========================================================

## 0. Design Principles

- Modern, minimalist, calm productivity aesthetic
- Dark-first UI
- Mostly monochromatic
- Contrast created through lightness + saturation, NOT many colors
- Color usage rules:
  - monochrome → structure
  - complementary → attention/action
  - analogous → scales & harmony
- Soft depth (glass + subtle shadows)
- No arbitrary values — everything derives from tokens below


# =========================================================
# 1. Color System
# =========================================================

## 1.1 Base Color Strategy

Primary UI uses ONE hue family.

BASE_HUE = 220° (cool slate-blue)

All neutrals are desaturated versions of this hue.
Use HSL values only.

---

## 1.2 Monochromatic Neutral Scale (PRIMARY UI)

--bg-0   hsl(220, 18%, 8%)    // page background
--bg-1   hsl(220, 16%, 11%)   // elevated background
--bg-2   hsl(220, 14%, 14%)

--surface-0 hsl(220, 12%, 16%) // cards
--surface-1 hsl(220, 12%, 19%)
--surface-2 hsl(220, 12%, 23%) // hover surfaces

--border-subtle hsl(220, 10%, 28%)
--border-strong hsl(220, 12%, 38%)

--text-primary   hsl(220, 15%, 92%)
--text-secondary hsl(220, 10%, 68%)
--text-tertiary  hsl(220, 8%, 48%)
--text-disabled  hsl(220, 6%, 32%)

Usage:

Page background → bg-0  
Sections → bg-1  
Cards → surface-0  
Hover → surface-1  
Dividers → border-subtle  
Primary text → text-primary  
Labels → text-secondary  
Metadata → text-tertiary


---

## 1.3 Complementary Accent (ATTENTION COLOR)

Complement of 220° ≈ 40° (amber/orange).

--accent-primary hsl(40, 85%, 58%)
--accent-hover   hsl(40, 85%, 64%)
--accent-muted   hsl(40, 40%, 30%)

Used ONLY for:
- Primary CTA
- Active toggles
- Important highlights
- Progress completion

Never use for large surfaces.

---

## 1.4 Analogous Harmony Colors (SCALES)

--analog-1 hsl(200, 55%, 55%)
--analog-2 hsl(220, 55%, 55%)
--analog-3 hsl(240, 55%, 60%)

Used for:
- progress scales
- charts
- ranked states
- gradients

Do NOT mix analogous colors with complementary accents inside one component.

---

## 1.5 Semantic States

--success hsl(150, 45%, 48%)
--warning hsl(40, 85%, 58%)
--error   hsl(0, 65%, 55%)
--info    var(--analog-2)


# =========================================================
# 2. Typography
# =========================================================

## 2.1 Font Family

Primary font:

Outfit

Fallback:
system-ui, sans-serif

Only ONE font family allowed across product.

---

## 2.2 Modular Scale

TYPE_RATIO = 1.25
Base = 16px

xs  = 12px
sm  = 14px
base= 16px
md  = 20px
lg  = 25px
xl  = 31px
2xl = 39px
3xl = 49px
4xl = 61px

Usage:

Micro/meta → xs
Labels → sm
Body → base
Section text → md
Card titles → lg
Section heading → xl
Hero subtitle → 2xl
Hero heading → 3xl–4xl

---

## 2.3 Font Weights

400 → body  
500 → UI labels  
600 → headings  
700 → hero only

No additional weights.


# =========================================================
# 3. Spacing System
# =========================================================

SPACE_UNIT = 8px

Allowed spacing ONLY:

8
16
24
32
40
48
56
64
80
96
120

Rules:
- Component padding ≥ 16px
- Section spacing ≥ 64px
- Hero spacing ≥ 96px


# =========================================================
# 4. Radius System
# =========================================================

--radius-xs = 8px
--radius-sm = 12px
--radius-md = 16px
--radius-lg = 20px
--radius-xl = 24px
--radius-pill = 999px

Usage:

Inputs → sm
Buttons → pill
Small cards → md
Standard cards → lg
Feature panels → xl
Modals → xl


# =========================================================
# 5. Shadow System
# =========================================================

shadow-1:
0 2px 6px hsla(220,20%,2%,0.25)

shadow-2:
0 8px 24px hsla(220,20%,2%,0.35)

shadow-3:
0 20px 60px hsla(220,20%,2%,0.45)

Usage:

Buttons hover → shadow-1
Cards → shadow-2
Hero elements → shadow-3


# =========================================================
# 6. Glass Surface Rule
# =========================================================

background: surface-0
backdrop-blur: 20px
border: 1px solid border-subtle
shadow: shadow-2

Transparency must remain subtle.


# =========================================================
# 7. Component Rules
# =========================================================

## Buttons

### Variants

Primary:
bg: accent-primary
text: bg-0
radius: pill
padding: 16px 24px (py-4 px-6)
shadow: shadow-1
hover-bg: accent-hover
hover-shadow: shadow-2

Secondary:
bg: surface-1
border: border-subtle
text: text-primary
hover-bg: surface-2
hover-border: border-strong

Ghost:
bg: transparent
text: text-secondary
hover-bg: surface-1
hover-text: text-primary

Destructive:
bg: error / 10
border: error / 20
text: error
hover-bg: error / 20

### Cursor

ALL buttons must use `cursor: pointer` on hover.
Never use `cursor: default` on interactive elements.

### Hover Animation

All buttons:
- scale: 1.02
- translateY: -2px
- duration: fast (120ms)
- easing: cubic-bezier(0.22, 1, 0.36, 1)

Primary buttons additionally:
- shimmer sweep: semi-transparent white gradient (via-white/20) translates from left to right on hover
- sweep duration: 500ms ease-out

### Press / Click Animation

All buttons:
- scale: 0.97
- duration: fast (120ms)
- easing: cubic-bezier(0.22, 1, 0.36, 1)
- Must feel responsive, never elastic
- NO spring physics (forbidden per §8.6)

### Implementation Notes

- Use `motion.button` from `motion/react` as the base primitive
- `whileHover={{ scale: 1.02, y: -2 }}`
- `whileTap={{ scale: 0.97 }}`
- `transition={{ type: "tween", duration: 0.12, ease: [0.22, 1, 0.36, 1] }}`
- Shimmer span: `aria-hidden="true"`, absolute inset, group-hover translate from left to right

---

## Cards

bg: surface-0
radius: radius-lg
padding: 24px
shadow: shadow-2

Hover:
bg → surface-1


---

## Text Hierarchy

- One dominant heading per section
- Secondary text lower contrast
- Never pure white backgrounds


# =========================================================
# 8. Motion & Animation System
# =========================================================

Animations must feel:
- modern
- fluid
- intentional
- calm
- premium

NO bouncy or playful motion.

---

## 8.1 Timing Tokens

fast   = 120ms
normal = 180ms
slow   = 280ms
page   = 420ms

Easing:
ease-out (default)
cubic-bezier(0.22, 1, 0.36, 1) for premium transitions

---

## 8.2 Hover Animations

Allowed hover effects:

- lightness increase (surface-0 → surface-1)
- subtle elevation
- slight scale

Rules:

scale max = 1.02
translateY max = -2px

Never rotate elements.

---

## 8.3 Click / Press Animations

On press:

- scale: 0.97–0.99
- shadow decreases
- duration: fast

Must feel responsive, never elastic.

---

## 8.4 Page Navigation Transitions

When navigating pages:

- outgoing page fades to 96% opacity
- incoming page fades + moves upward 8px
- duration: page timing

No sliding panels unless dashboard context.

---

## 8.5 Reveal Animations

Elements entering viewport:

- opacity 0 → 1
- translateY 16px → 0
- duration: slow

Stagger lists by 40ms.

---

## 8.6 Forbidden Animations

- bounce
- spring physics
- rotation for layout elements
- flashing colors
- fast looping motion

---

## 8.7 Card / Surface Hover Animation Standards

Card hover must animate at least THREE properties simultaneously to feel rich and dimensional:

1. **transform** — scale + translateY
2. **box-shadow** — increases on hover (depth illusion)
3. **border-color** — highlights on hover

### Required values

```
transition-property: transform, box-shadow, border-color
duration: 320ms          ← minimum; never below 250ms
easing: cubic-bezier(0.22, 1, 0.36, 1)
scale: 1.02              ← design-system max (§8.2)
translateY: -2px         ← design-system max (§8.2)
shadow: shadow-2 → shadow-3
border: border-subtle → border-strong
```

### Why duration matters

Animations under 200ms feel mechanical and abrupt. The 320ms duration with
the premium ease curve gives the card time to "settle" into its hover state,
making the interaction feel intentional and physical rather than instant.

### Tailwind implementation

```tsx
className="... transition-[transform,box-shadow,border-color] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[var(--shadow-3)] hover:border-[var(--color-border-strong)]"
```

### Forbidden for card hover

- `transition-all` (too broad, causes repaints on every property)
- `duration` below 250ms
- Spring physics on hover (§8.6)


# =========================================================
# 9. Images & Iconography
# =========================================================

## 9.1 Icon Style

Icons must be:

- outline or minimal fill
- geometric
- consistent stroke width
- modern and neutral

Preferred stroke:
1.5px or 2px

Icon sizes:

16px → inline UI
20px → buttons
24px → cards
32–48px → feature illustrations

Icons inherit text color unless semantic state applies.

---

## 9.2 Image Rules

Images must:

- match dark aesthetic
- low visual noise
- soft contrast
- no harsh white backgrounds

Use subtle overlays when needed:

overlay: bg-0 at 20–40% opacity

Rounded corners must follow radius tokens.

---

## 9.3 Illustration Style

If illustrations exist:

- minimal
- gradient only from analogous colors
- no rainbow palettes
- avoid skeuomorphism


# =========================================================
# 10. Layout Rules
# =========================================================

Centered marketing layout
Max width: 1200px
8px vertical rhythm required
Consistent alignment grid


# =========================================================
# 11. Design Governance Rules (CRITICAL)
# =========================================================

Claude MUST follow these restrictions:

1. NEVER modify design tokens without confirmation.
2. If a requested design conflicts with system → ASK before proceeding.
3. Do NOT invent new colors, spacing, shadows, radii, or font sizes.
4. If unsure which token applies → ask a clarification question.
5. Prefer reuse over creation.
6. System consistency is higher priority than visual experimentation.
7. Any proposed system change must be presented as:
   - reason
   - affected tokens
   - visual impact
   - request for approval

Claude must wait for confirmation before altering the system.

---

# =========================================================
# 12. Hard Constraints
# =========================================================

1. Only defined colors allowed.
2. Only modular scale typography allowed.
3. Only 8px spacing increments allowed.
4. Only defined radii allowed.
5. Only defined shadows allowed.
6. Accent color ≤ 10% viewport usage.
7. Prefer monochrome before color.
8. Gradients allowed ONLY with analogous colors.
9. Never invent new tokens.

# =========================================================
# END SPECFORGE DESIGN SYSTEM
# =========================================================

