---
name: Monochrome Tech
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393938'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1b'
  surface-container: '#1f201f'
  surface-container-high: '#2a2a29'
  surface-container-highest: '#353534'
  on-surface: '#e4e2e0'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e4e2e0'
  inverse-on-surface: '#303030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c6'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e3e2e2'
  on-primary-container: '#636465'
  inverse-primary: '#5d5e5f'
  secondary: '#c7c6c6'
  on-secondary: '#303031'
  secondary-container: '#464747'
  on-secondary-container: '#b6b5b5'
  tertiary: '#ffffff'
  on-tertiary: '#342f2d'
  tertiary-container: '#eae1dd'
  on-tertiary-container: '#696360'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e3e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#eae1dd'
  tertiary-fixed-dim: '#cec5c1'
  on-tertiary-fixed: '#1f1b19'
  on-tertiary-fixed-variant: '#4b4643'
  background: '#131313'
  on-background: '#e4e2e0'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1440px
---

## Brand & Style
This design system embodies a "Monochrome Tech" aesthetic—a refined, high-precision environment designed for professional tools and industrial-grade interfaces. The personality is sterile, objective, and highly legible. It shifts away from neon vibrancy toward a sophisticated, desaturated palette where hierarchy is communicated through subtle shifts in gray and off-white tones.

The visual style is a fusion of **Minimalism** and **Glassmorphism**, emphasizing structural clarity and technical transparency. The interface should feel like a piece of high-end lab equipment: clean, focused, and utilitarian. Atmosphere is maintained through neutral translucency and fine-lined details, ensuring the dark interface feels expansive and premium rather than heavy.

## Colors
The palette is rooted in a deep neutral base, providing a calm, low-strain background for long-duration technical work.

- **Primary (Cool Gray):** Used for standard interactive states, primary iconography, and balanced focal points.
- **Secondary (Steel):** Reserved for structural accents, specifically 1px borders and functional dividers.
- **Tertiary (Warm White):** Used for highlights, active tabs, or subtle callouts that require high contrast against the dark background.
- **Neutral (Slate Gray):** Controls the foundational surfaces and information hierarchy.

Gradients are used with extreme restraint, primarily as very low-opacity linear fades to define surface transitions without introducing color bias.

## Typography
The typography strategy contrasts geometric futurism with technical precision. 

**Space Grotesk** is used for headlines to provide a distinct, cutting-edge character. Its wider proportions and geometric terminals feel engineered. **Geist** handles the body copy, offering a clean, Swiss-inspired readability that feels at home in a developer-centric or high-tech UI. For metadata, code snippets, and small labels, **JetBrains Mono** is employed to reinforce the "terminal" or "system" feel of the design system.

All typography should prioritize legibility against the dark background. Use `antialiased` rendering for the white text to prevent "blooming" on OLED displays.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model on desktop and a **Fluid Grid** on mobile. 

- **Desktop:** A 12-column grid with a 1440px max-width. Spacing follows an 8px rhythmic scale. Margins are generous (48px) to allow for a focused, centered content experience.
- **Mobile:** A 4-column grid with 16px side margins. 

Layouts should favor verticality and modularity. Use excessive whitespace between major sections to maintain the "ultra-clean" aesthetic. Elements should feel grouped within their glass containers rather than floating freely.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Tonal Layering** rather than traditional drop shadows.

1.  **Base Layer:** Neutral Dark Surface (`#787776` variant) providing a solid foundation.
2.  **Surface Layer (Cards/Panels):** Semi-transparent background (`rgba(255, 255, 255, 0.03)`) with a `backdrop-filter: blur(12px)`.
3.  **Borders:** Each glass element must have a 1px solid border using the Secondary Steel (`#777777`) at 20-30% opacity.
4.  **Interactive Elevation:** When an element is hovered or active, it increases in opacity or gains a subtle Tertiary Warm White (`#FEF4F0`) inner glow to signal interaction without breaking the monochrome theme.

Avoid stacking more than two layers of glass to maintain clarity and performance.

## Shapes
The shape language is "Soft-Tech." While the aesthetic is futuristic, avoid 0px sharp corners to prevent a dated "Brutalist" look. 

A standard **0.25rem (4px)** radius is used for most UI components (buttons, inputs). Larger containers like cards or modals use **0.75rem (12px)**. This subtle rounding maintains a professional, precision-engineered feel while ensuring the interface remains approachable. Icons must use a consistent 1.5px or 2px stroke weight with rounded caps to match the line-style theme.

## Components

- **Buttons:** Primary buttons use a solid Primary Gray fill with high-contrast text. Secondary buttons are "Ghost" style with a 1px Steel border and a subtle background tint on hover.
- **Cards:** The core of the design. Must use the backdrop blur and 1px steel border. No solid backgrounds for primary containers.
- **Input Fields:** Darker than the background with a 1px border that clarifies into a Tertiary white focus state. Use JetBrains Mono for input text.
- **Chips/Tags:** Small, pill-shaped elements with a low-opacity gray background and a higher-opacity neutral border.
- **Icons:** Technical line style. Icons should be desaturated, using the tertiary color only for active or success states.
- **Lists:** Separated by thin, low-opacity gray horizontal rules. Hover states should trigger a subtle tonal shift in the background.
- **Alerts:** Use the Tertiary Warm White for alerts to maintain the monochrome aesthetic, or a desaturated error red only where safety-critical.