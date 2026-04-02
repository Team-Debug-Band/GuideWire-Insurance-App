# Design System Specification: Operational Elegance

## 1. Overview & Creative North Star
**The Creative North Star: "The Architectural Ledger"**

This design system moves away from the "disposable" feel of gig-economy apps and toward the authoritative weight of a premium financial institution. The "Architectural Ledger" concept blends the precision of parametric data with the tactile sophistication of high-end editorial layouts. 

We break the standard "template" look by utilizing **intentional asymmetry** and **tonal depth**. Instead of boxing content into rigid grids, we use expansive white space and overlapping elements to guide the eye. This system is designed to feel like a bespoke tool for the modern professional—highly functional, yet undeniably premium.

---

## 2. Colors: Tonal Logic over Structural Lines
Our palette is rooted in `primary` (#002542) for authority and `secondary` (#2c694e) for growth. However, the sophistication lies in how these colors are layered.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section UI elements. 
Boundaries are defined exclusively through background shifts. A `surface-container-low` section sitting on a `surface` background provides all the separation a professional interface needs. Lines create visual noise; tonal shifts create clarity.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. Use the `surface-container` tiers to define "importance" through depth:
*   **Background (`#f8f9ff`):** The canvas.
*   **Surface-Container-Lowest (`#ffffff`):** Reserved for primary interactive cards and data entry.
*   **Surface-Container-High (`#dce9ff`):** Used for persistent sidebars or utility panels that need to feel "closer" to the user.

### Signature Textures
While we avoid "flashy" gradients, we utilize **Tonal Shimmers**. For primary CTAs or Hero sections, use a subtle linear gradient from `primary` (#002542) to `primary_container` (#1b3b5a) at a 135-degree angle. This adds a "weighted" feel that flat hex codes lack.

---

## 3. Typography: The Voice of Authority
We utilize a dual-font strategy to balance character with readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric modernism. Headlines (`headline-lg` to `headline-sm`) should be set with tight letter-spacing (-0.02em) to appear "locked" and authoritative.
*   **Body & Labels (Inter):** The workhorse. All financial metrics and tabular data must utilize Inter’s **tabular numerals** to ensure columns of insurance premiums and payouts align perfectly for the user's eye.
*   **The Editorial Shift:** Large `display-lg` headings should often be paired with significantly smaller `label-md` sub-headers in all-caps. This high-contrast scale creates a premium, editorial feel that standard 1:1.5 scales cannot achieve.

---

## 4. Elevation & Depth: Tonal Layering
Traditional "drop shadows" are often a sign of lazy design. We achieve depth through **Ambient Occlusion** and **Material Stacking**.

*   **The Layering Principle:** To lift a card, do not reach for a shadow first. Instead, place a `surface-container-lowest` card on top of a `surface-container-low` background. The subtle shift in hex value creates a "natural" lift.
*   **Ambient Shadows:** When a float is required (e.g., a Modal or FAB), use a multi-layered shadow: 
    *   `box-shadow: 0 4px 20px rgba(13, 28, 46, 0.04), 0 12px 40px rgba(13, 28, 46, 0.08);`
    *   The shadow color is never black; it is a semi-transparent `on-surface` (#0d1c2e).
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` (#c3c6ce) at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** For floating AI-action panels, use `surface_bright` with a 70% opacity and a `backdrop-filter: blur(12px)`. This allows the "Parametric Data" beneath to bleed through, maintaining the user's context.

---

## 5. Components: Precision Built

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. Corner radius: `md` (0.375rem). No border.
*   **Secondary:** Ghost style. No background, `outline` color for text, and a `ghost border` (15% opacity) that only appears on hover.
*   **Tertiary:** `on_surface_variant` text with no container. Used for low-priority actions.

### Cards & Lists
*   **Forbid Dividers:** Use `spacing.8` (2rem) of vertical white space to separate list items, or alternate background shades between `surface` and `surface-container-low`.
*   **Visual Status:** Use `tertiary_container` for AI-verified status chips. These should be small, using `label-sm` typography with a `full` (9999px) corner radius.

### Input Fields
*   **State Logic:** Default state uses `surface_container_lowest`. The active/focus state should not use a heavy border; instead, transition the background to `surface_bright` and apply a 2px `primary` bottom-bar "underline" to signal focus.

### Additional Signature Component: The "Data Pulse"
A small, animated teal (`tertiary_fixed_dim`) dot placed next to parametric data points. It pulses subtly to indicate real-time AI monitoring, reinforcing the "Parametric" nature of the platform.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use tabular numerals for all insurance quotes and financial figures.
*   **DO** embrace "Asymmetric Balance." If a card is heavy on the left, use significant white space on the right to let the data breathe.
*   **DO** use `surface_container_highest` for "Review" or "Action Required" zones to create an immediate sense of urgency through color weight.

### Don’t
*   **DON'T** use 100% black (#000000) for anything. Use `on_surface` (#0d1c2e) for maximum premium contrast without the "harshness" of pure black.
*   **DON'T** use standard 1px borders to separate content. If you feel the need to draw a line, use a background color shift instead.
*   **DON'T** use "Insurance Green" (#2D6A4F) for everything. Reserve it for "Success," "Payout Confirmed," or "Verified" states. Overuse dilutes its psychological impact of trust.