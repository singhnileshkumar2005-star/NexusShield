---
version: alpha
name: "Supabase Dark-First Developer Platform"
description: "Supabase uses a dark-first design system anchored by a deep near-black background (oklch ~0.19) with a vivid green brand accent (#3ecf8e / #3fcf8e). The layout is structured around a responsive feature card grid, with Manrope for display headings and Inter for body/UI text. Source Code Pro handles all monospace/code contexts. The color system is built on oklch custom properties with semantic naming. Cards use 12px radius with subtle border treatment, buttons use 6–8px radius, and the overall density is moderate with an 8px base spacing grid."
colors:
  brand-dark-green: "#006239"
  card-surface: "#1a1a1a"
  surface-base: "#000000"
  brand-green: "#3ecf8e"
  foreground-white: "#ffffff"
  muted-text: "#a0a0a0"
  purple-accent: "#bda4ff"
  border-subtle: "#ffffff"
  card-background: "#ffffff"
  page-background: "#ffffff"
  dark-green-text: "#15593b"
  primary-text: "#000000"
  secondary-text: "#525252"
typography:
  hero-display:
    fontFamily: "Manrope"
    fontSize: "46px"
    fontWeight: "500"
    lineHeight: "46px"
  section-heading:
    fontFamily: "Manrope"
    fontSize: "34px"
    fontWeight: "600"
    lineHeight: "37.78px"
  sub-heading:
    fontFamily: "Manrope"
    fontSize: "22px"
    fontWeight: "450"
    lineHeight: "30.25px"
  card-title:
    fontFamily: "Manrope"
    fontSize: "16px"
    fontWeight: "600"
    lineHeight: "24px"
  label-small:
    fontFamily: "Manrope"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "20px"
  body-default:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: "450"
    lineHeight: "24px"
  body-small:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: "450"
    lineHeight: "20px"
  caption:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: "450"
    lineHeight: "16px"
  code-inline:
    fontFamily: "Source Code Pro"
    fontSize: "13px"
    fontWeight: "500"
    lineHeight: "22.1px"
  nav-link:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "20px"
rounded:
  radius-xs: "2px"
  radius-sm: "4px"
  radius-md: "6px"
  radius-base: "8px"
  radius-lg: "11px"
  radius-xl: "12px"
  radius-2xl: "16px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "20px"
  space-6: "24px"
  space-8: "32px"
  space-10: "40px"
  space-16: "64px"
  space-24: "96px"
  space-32: "128px"
  space-40: "160px"
---

## Overview

Supabase uses a dark-first design system anchored by a deep near-black background (oklch ~0.19) with a vivid green brand accent (#3ecf8e / #3fcf8e). The layout is structured around a responsive feature card grid, with Manrope for display headings and Inter for body/UI text. Source Code Pro handles all monospace/code contexts. The color system is built on oklch custom properties with semantic naming. Cards use 12px radius with subtle border treatment, buttons use 6–8px radius, and the overall density is moderate with an 8px base spacing grid.

**Signature traits:**
- Dual typeface system: Pairs Manrope and Inter across the type hierarchy.
- Layered elevation: Depth comes from 1 validated shadow token.

## Colors

The palette uses 16 validated color tokens across 2 theme profiles. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **action-text** maps to `brand-green`: Role "text" is grounded by usage context "Primary CTA button fill, hero headline accent, checkmark icons, brand highlights".
- **surface-background** maps to `surface-base`: Role "background" is grounded by usage context "Main page background, near-black dark canvas".
- **surface-text** maps to `foreground-white`: Role "text" is grounded by usage context "Primary heading and body text on dark backgrounds".
- **content-text** maps to `muted-text`: Role "text" is grounded by usage context "Secondary body text, descriptions, captions".

### Dark Theme

### Text Scale
- **Brand Green** (#3ecf8e): Primary CTA button fill, hero headline accent, checkmark icons, brand highlights. Role: text. {authored: rgb(62, 207, 142), space: rgb}
- **Foreground White** (#ffffff): Primary heading and body text on dark backgrounds. Role: text. {authored: rgb(255, 255, 255), space: rgb, alpha: 0.6}
- **Muted Text** (#a0a0a0): Secondary body text, descriptions, captions. Role: text.
- **Purple Accent** (#bda4ff): Secondary accent for syntax highlighting and decorative elements. Role: text. {authored: rgb(189, 164, 255), space: rgb}

### Interactive
- **Border Subtle** (#ffffff): Card borders, nav bottom border (oklch 0.95 / 0.075 alpha). Role: border. {authored: rgb(255, 255, 255), space: rgb, alpha: 0.6}

### Surface & Shadows
- **Brand Dark Green** (#006239): CTA button background (dark variant), hover states. Role: background. {authored: rgb(0, 98, 57), space: rgb}
- **Card Surface** (#1a1a1a): Feature cards and panel backgrounds (oklch 0.215). Role: background.
- **Surface Base** (#000000): Main page background, near-black dark canvas. Role: background. {authored: rgb(0, 0, 0), space: rgb}

### Light Theme

### Text Scale
- **Brand Green** (#3fcf8e): Primary CTA button fill, brand highlights, hero accent text. Role: text. {authored: rgb(63, 207, 142), space: rgb}
- **Dark Green Text** (#15593b): Green text on light backgrounds for brand emphasis. Role: text. {authored: rgb(21, 89, 59), space: rgb}
- **Muted Text** (#a0a0a0): Captions, metadata, tertiary text. Role: text. {authored: rgb(160, 160, 160), space: rgb}
- **Primary Text** (#000000): Headings and primary body text on light backgrounds. Role: text. {authored: rgb(0, 0, 0), space: rgb}
- **Secondary Text** (#525252): Body copy, descriptions, secondary UI text. Role: text. {authored: rgb(82, 82, 82), space: rgb}

### Interactive
- **Border Subtle** (#000000): Hairline borders on cards and dividers. Role: border. {authored: rgb(0, 0, 0), space: rgb}

### Surface & Shadows
- **Card Background** (#ffffff): Feature card surfaces in light mode. Role: background. {authored: rgb(255, 255, 255), space: rgb, alpha: 0.6}
- **Page Background** (#ffffff): Main page background in light mode. Role: background. {authored: rgb(255, 255, 255), space: rgb, alpha: 0.6}

## Typography

Typography uses Manrope, Inter, Source Code Pro across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Mixes Manrope and Inter and Source Code Pro for visual contrast. Weight range spans medium, semi-bold. Sizes range from 12px to 46px.

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Hero headline — largest display text on the page | Manrope | 46px | 500 | 46px | normal | Manrope, Manrope Fallback, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif | Extracted token |
| Section-level headings and feature titles | Manrope | 34px | 600 | 37.78px | normal | Manrope, Manrope Fallback, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif | Extracted token |
| Sub-section headings and card titles | Manrope | 22px | 450 | 30.25px | normal | Manrope, Manrope Fallback, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif | Extracted token |
| Feature card headings and nav section labels | Manrope | 16px | 600 | 24px | normal | Manrope, Manrope Fallback, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif | Extracted token |
| UI labels, tags, and small headings | Manrope | 14px | 500 | 20px | normal | Manrope, Manrope Fallback, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif | Extracted token |
| Primary body text, descriptions, and UI copy | Inter | 16px | 450 | 24px | normal | Inter, Inter Fallback, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif, Inter, Helvetica Neue, Helvetica, ui-sans-serif, system-ui, sans-serif | Extracted token |
| Secondary body text, nav items, and metadata | Inter | 14px | 450 | 20px | normal | Inter, Inter Fallback, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif, Inter, Helvetica Neue, Helvetica, ui-sans-serif, system-ui, sans-serif | Extracted token |
| Captions, badges, and fine-print text | Inter | 12px | 450 | 16px | normal | Inter, Inter Fallback, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif, Inter, Helvetica Neue, Helvetica, ui-sans-serif, system-ui, sans-serif | Extracted token |
| Inline code, terminal snippets, and API path labels | Source Code Pro | 13px | 500 | 22.1px | normal | Source Code Pro, Source Code Pro Fallback, Source Code Pro, Office Code Pro, Menlo, monospace, Source Code Pro, ui-monospace, Menlo, monospace | Extracted token |
| Navigation links and menu items | Inter | 14px | 500 | 20px | normal | Inter, Inter Fallback, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif, Inter, Helvetica Neue, Helvetica, ui-sans-serif, system-ui, sans-serif | Extracted token |

## Layout

Responsive system uses 2 breakpoint tier(s): mobile, desktop.

This system uses a 8px base grid with scale values 4, 8, 12, 16, 20, 24, 32, 40, 64, 96, 128, 160.

### Responsive Strategy
- **mobile (<= 600px)**: Constrain layout for small viewports and prioritize vertical stacking.
- **desktop (Unknown)**: Expand layout density and horizontal composition for wide viewports.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| space-1 | 4px | 4 | Extracted spacing token |
| space-2 | 8px | 8 | Extracted spacing token |
| space-3 | 12px | 12 | Extracted spacing token |
| space-4 | 16px | 16 | Extracted spacing token |
| space-5 | 20px | 20 | Extracted spacing token |
| space-6 | 24px | 24 | Extracted spacing token |
| space-8 | 32px | 32 | Extracted spacing token |
| space-10 | 40px | 40 | Extracted spacing token |
| space-16 | 64px | 64 | Extracted spacing token |
| space-24 | 96px | 96 | Extracted spacing token |
| space-32 | 128px | 128 | Extracted spacing token |
| space-40 | 160px | 160 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| shadow-inset-white | 1 | inset 0px 0px 0px 1px rgba(255, 255, 255, 0.12) |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | backdrop-filter | blur(4px) |
| Light | outline-color | oklch(0.1 0 34) ; oklch(0.52065 0 34) ; rgb(82, 82, 82) |
| Light | outline-width | 3px |
| Light | outline-offset | 0px |
| Light | transform | matrix(1, 0, 0, 1, 0, 0) ; matrix(1, 0, 0, 1, -305.438, 0) ; matrix(1, 0, 0, 1, 0, 60) |
| Dark | backdrop-filter | blur(4px) |
| Dark | outline-color | oklch(0.95 0.00275 159) ; oklch(0.684 0.00275 159) ; rgb(255, 255, 255) |
| Dark | outline-width | 3px |
| Dark | outline-offset | 0px |
| Dark | transform | matrix(1, 0, 0, 1, 0, 0) ; matrix(1, 0, 0, 1, -305.438, 0) ; matrix(1, 0, 0, 1, 0, 60) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| radius-xs | 2px | 2 | Hairline corner |
| radius-sm | 4px | 4 | Subtle corner |
| radius-md | 6px | 6 | Subtle corner |
| radius-base | 8px | 8 | Control corner |
| radius-lg | 11px | 11 | Control corner |
| radius-xl | 12px | 12 | Control corner |
| radius-2xl | 16px | 16 | Card corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| radius-xs | 2px | px |
| radius-sm | 4px | px |
| radius-md | 6px | px |
| radius-base | 8px | px |
| radius-lg | 11px | px |
| radius-xl | 12px | px |
| radius-2xl | 16px | px |

## Components

(none detected)

## Do's and Don'ts

Guardrails protect Dual typeface system, Layered elevation without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <= 600px | (max-width: 600px) |
| Breakpoint 2 | Unknown | (hover: hover) and (pointer: fine) |

## Agent Prompt Guide

### Example Component Prompts
- Create button component using validated primary color role and spacing tokens.
- Create card component with mapped radius role and evidence-backed elevation.
- Create form input component using inferred typography hierarchy and border roles.

### Iteration Guide
1. Start with extracted palette and typography roles only.
2. Map spacing and radius directly from token tables before visual polish.
3. Apply component patterns one section at a time and compare against source intent.
4. Keep elevation claims tied to explicit evidence in output.
5. Iterate with smallest diffs and re-check section hierarchy after each change.
