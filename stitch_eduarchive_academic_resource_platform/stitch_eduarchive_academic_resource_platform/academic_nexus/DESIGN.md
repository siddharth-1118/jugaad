---
name: Academic Nexus
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
This design system is engineered for a high-performance academic ecosystem. It targets researchers, students, and educators who require a focused, low-strain environment for deep work. The aesthetic is "Ultra-Modern Intellectual"—combining the precision of technical documentation with the immersive qualities of premium developer tools.

The design leverages **Glassmorphism** and **Minimalism** to create a sense of depth and hierarchy within a dark-mode-first interface. The emotional response is one of clarity, authority, and innovation. Every interaction should feel instantaneous and fluid, utilizing subtle luminescence to guide the user's focus without visual clutter.

## Colors
The palette is rooted in a deep Dark Slate (`#090d16`) to minimize eye fatigue during long reading sessions. 

- **Primary Accent (Electric Indigo):** Used for primary actions, active states, and brand-critical highlights.
- **Success/Status (Neon Emerald):** Reserved for "Verified Research," "Upload Complete," and positive system feedback.
- **Empty/Highlight (Muted Amber):** Specifically utilized for empty states, bookmarks, and curated "Golden" resources.
- **Surfaces:** All containers utilize a semi-transparent slate with a heavy backdrop blur to maintain legibility against complex background gradients or high-density data.

## Typography
The system employs a high-contrast typographic pairing. **Outfit** is used for display and headline roles to provide a geometric, modern edge. **Inter** is utilized for all functional and body text to ensure maximum legibility and a systematic feel.

Weight contrast is a primary driver of hierarchy; use Bold (700) for labels and Light/Regular for long-form content. Display sizes use negative letter spacing to feel "tight" and architectural.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a 12-column structure for desktop. 

- **Desktop (1280px+):** 24px gutters, 80px side margins.
- **Tablet (768px - 1279px):** 16px gutters, 40px side margins.
- **Mobile (<767px):** 12px gutters, 16px side margins.

Content is grouped into logical modules using the `md` (24px) spacing unit. Vertical rhythm is strictly enforced via an 8px baseline grid. Large sections are separated by `xl` (80px) padding to allow the glassmorphic surfaces to "breathe" against the dark background.

## Elevation & Depth
Depth is achieved through **Glassmorphism** rather than traditional drop shadows. 

1.  **Level 0 (Base):** Background color `#090d16`.
2.  **Level 1 (Cards/Panels):** `rgba(17, 24, 39, 0.7)` with `16px` backdrop-blur. The border is a crisp `1px solid rgba(255, 255, 255, 0.08)`.
3.  **Level 2 (Hover/Active):** Increase border opacity to `0.2` and add a subtle inner glow (`box-shadow: inset 0 0 12px rgba(99, 102, 241, 0.1)`).

Transitions between levels must be smooth (200ms ease-out) to simulate physical light interaction.

## Shapes
The design system uses a **Rounded** (0.5rem) language to balance the technical nature of the content with an approachable feel.

- **Standard Buttons & Inputs:** 0.5rem (8px).
- **Cards & Large Containers:** 1rem (16px).
- **Badges & Tags:** Full pill-shape for distinct categorization.

The 8px base radius is applied consistently to all interactive elements to create a cohesive tactile language.

## Components

### Buttons
- **Primary:** Solid Electric Indigo with a slight outer glow on hover. Text is white/high-contrast.
- **Secondary/Glass:** Background `rgba(255, 255, 255, 0.05)`, border `1px solid rgba(255, 255, 255, 0.1)`. On hover, the border transitions to a subtle Electric Indigo gradient.

### Input Fields
Darker than the card background (`#05070a`) with an 8px radius. The focus state features an Electric Indigo border and a 4px soft outer glow.

### Cards (The "Research Unit")
The central component. Uses the glassmorphic style. Hovering over a card should trigger a border gradient transition—moving from the standard subtle grey to a faded Electric Indigo top-left to bottom-right.

### Badges & Chips
High-contrast indicators. "New" or "Hot" items use the Muted Amber with black text. "Verified" uses Neon Emerald with a glow-dot icon.

### Icons
Monolinear, 2px stroke width. Use "Glowing Icons" for primary navigation: icons have a subtle drop shadow with the same color as the icon (e.g., an Indigo icon with an Indigo shadow) at low opacity (30%) to simulate a neon filament.

### Progress Bars
Thin 4px tracks. The filled portion should use a horizontal gradient from Electric Indigo to Neon Emerald to signify "completion/success."