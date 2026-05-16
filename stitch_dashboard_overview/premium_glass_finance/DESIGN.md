---
name: Premium Glass Finance
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#494456'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#7a7487'
  outline-variant: '#cac3d8'
  surface-tint: '#6733ea'
  primary: '#622ce5'
  on-primary: '#ffffff'
  primary-container: '#7b4dff'
  on-primary-container: '#fcf6ff'
  inverse-primary: '#cdbdff'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#8f4400'
  on-tertiary: '#ffffff'
  tertiary-container: '#b45800'
  on-tertiary-container: '#fff6f2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e7deff'
  primary-fixed-dim: '#cdbdff'
  on-primary-fixed: '#1f005f'
  on-primary-fixed-variant: '#4e00d1'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#ffdbc7'
  tertiary-fixed-dim: '#ffb687'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#733600'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-tabular:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 20px
  stack-gap-sm: 8px
  stack-gap-md: 16px
  grid-gutter: 12px
  viewport-width: 412px
  viewport-height: 912px
---

## Brand & Style
The design system embodies a "Transparent Wealth" philosophy, blending the precision of high-end Swiss banking with the fluid interface of modern fintech. The aesthetic is centered on **Glassmorphism**, utilizing translucent layers to suggest depth and clarity. 

The UI evokes an emotional response of security, exclusivity, and technological sophistication. By utilizing high-density layouts and expansive white space, the design system caters to power users who require immediate access to complex financial data without compromising on a premium, editorial feel.

## Colors
The palette is intentionally restrained to maintain a "High-Value" atmosphere. 

- **Primary (#7B4DFF):** Used sparingly for key action triggers, progress indicators, and active states. It represents the "intelligence" of the platform.
- **Secondary (#000000):** Reserved for high-contrast typography and iconography to ensure absolute legibility.
- **Surface Strategy:** The background is a pure, crisp white. Surfaces are constructed using semi-transparent white fills with a `backdrop-filter: blur(12px)`. 
- **Functional Colors:** Use a desaturated emerald for growth and a muted crimson for loss, ensuring they do not compete with the primary purple brand color.

## Typography
Typography is the primary driver of the hierarchy. **Hanken Grotesk** provides a sharp, contemporary sans-serif feel for all interface elements and headlines. 

For financial figures and data points, **JetBrains Mono** is utilized to ensure that numerical values align perfectly in tables and charts, conveying a sense of technical accuracy. Headlines should utilize tight letter-spacing for a bold, editorial appearance, while labels use expanded tracking for better scanability at small sizes.

## Layout & Spacing
The system uses a **high-density fluid grid** optimized for a 412pt width. 

- **The 4px Rule:** All spacing increments must be multiples of 4px to maintain a rhythmic vertical flow.
- **Margins:** A standard 20px horizontal margin is applied to the main viewport.
- **Density:** To accommodate detailed financial data, internal component padding is minimized (e.g., 12px padding for cards), relying on subtle dividers and glass-strokes to separate information rather than large gaps of whitespace.
- **Alignment:** Content should predominantly be left-aligned to mimic the structured feel of a financial ledger.

## Elevation & Depth
Depth is created through a combination of backdrop blurs and "shadow-glows." 

1.  **Level 0 (Base):** Solid white background.
2.  **Level 1 (Cards/Panels):** Translucent white (70% opacity) with a 1px solid white border at 40% opacity. A very soft, large-radius shadow (`box-shadow: 0 10px 30px rgba(0,0,0,0.04)`) provides a slight lift.
3.  **Level 2 (Modals/Overlays):** Increased backdrop blur (20px) and a slightly more defined shadow to indicate immediate priority.

Avoid heavy black shadows. All elevation should feel like light passing through stacked sheets of frosted acrylic.

## Shapes
The shape language is "Sophisticated Geometric." 

- **Primary Radius:** 0.5rem (8px) for standard UI elements like input fields and buttons.
- **Container Radius:** 1.5rem (24px) for large cards and dashboard modules to create a softer, more approachable container for complex data.
- **Interactive Elements:** Use pill-shapes (full rounding) exclusively for "Status" tags or "Chips" to differentiate them from actionable buttons.

## Components
- **Buttons:** Primary buttons use a solid #7B4DFF fill with white text and no shadow. Secondary buttons are "Glass" style: translucent background with a 1px border and black text.
- **Input Fields:** Minimalist design with only a bottom border or a very faint glass background. Active states are indicated by the border changing to the primary purple.
- **Cards:** The workhorse of the system. Cards must have a `backdrop-filter: blur(12px)` and a subtle 1px white border. Inside the card, use JetBrains Mono for all currency values.
- **Chips:** Used for stock symbols or transaction categories. Small, pill-shaped, with a very light grey background or a low-opacity tint of the category color.
- **Lists:** High-density rows with 1px hairline dividers (light gray). Interactive rows should show a subtle glass-tint on hover/active states.
- **Charts:** Use thin 1.5pt lines for line charts. Use the primary purple for the main data line, with a soft purple gradient fill fading into the glass background below the line.