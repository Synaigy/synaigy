# Figma Variables to Tailwind Configuration Mapping Plan

## Overview

This document outlines how to convert the Figma variables from `figmavariables.json` into a Tailwind v3 configuration. The goal is to create a consistent design system that leverages Tailwind's utility classes while maintaining the design tokens defined in Figma.

## Figma Structure Analysis

From analyzing the `figmavariables.json` file, we can see that the UntitledUI design system is organized as follows:

### Collections

1. **1. Color modes** - Contains color theme aliases with modes, for example:

   - Default (Light mode)
   - Default (Dark mode)
   - Beispiel Brand Grün (Example Brand Green)

2. **2. Radius** - Border radius values

3. **3. Spacing** - Spacing values (to be ignored as we'll use Tailwind defaults)

4. **4. Widths** - Width values (to be ignored as we'll use Tailwind defaults)

5. **5. Containers** - Container padding values for different screen sizes

6. **6. Typography** - Typography-related values:
   - Font families
   - Font weights
   - Font sizes
   - Line heights (Default and Leading tight variants)

### Color Structure

The color system has multiple layers:

1. **Primitive Colors** (in `_Primitives` collection) - Base color values (e.g., `Colors/Gray (light mode)/500`)
2. **Color Aliases** (in `1. Color modes` collection) - References to primitives with theme support (e.g., `Colors/Text/text-primary (900)`)

## Mapping Strategy

### 1. Colors

#### 1.1 CSS Variables for Primitives

Extract all primitive colors from the Figma file and create CSS variables in `:root`:

```css
:root {
  /* Gray (Light Mode) */
  --color-gray-light-25: #fcfcfc;
  --color-gray-light-50: #f9fafb;
  /* ... and so on */

  /* Gray (Dark Mode) */
  --color-gray-dark-25: #fafafa;
  --color-gray-dark-50: #f7f7f7;
  /* ... and so on */

  /* Other primitive colors */
}
```

#### 1.2 Theme Variables and Tailwind Configuration

Create theme variables in Tailwind that reference these CSS variables:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Text colors
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",
        /* ... and so on */

        // Background colors
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        /* ... and so on */
      },
    },
  },
};
```

### 2. Border Radius

Map the radius variables to Tailwind's borderRadius theme:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      borderRadius: {
        none: "0px",
        xxs: "2px",
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        /* ... and so on */
      },
    },
  },
};
```

### 3. Spacing

Since we'll use Tailwind's default spacing scale, we can skip this mapping.

### 4. Widths

Since we'll use Tailwind's default width scale, we can skip this mapping.

### 5. Containers

Map container padding values to Tailwind's container theme:

```js
// tailwind.config.js
module.exports = {
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        md: "3rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
  },
};
```

### 6. Typography

#### 6.1 Font Families

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
};
```

#### 6.2 Font Weights

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
    },
  },
};
```

#### 6.3 Font Sizes and Line Heights

Convert the pixel values to rem (assuming 16px base):

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.125rem" }], // 12px with 18px line height
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px with 20px line height
        md: ["1rem", { lineHeight: "1.5rem" }], // 16px with 24px line height
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px with 28px line height
        xl: ["1.25rem", { lineHeight: "1.875rem" }], // 20px with 30px line height
        /* ... and so on for display sizes */
      },
    },
  },
};
```

#### 6.4 Alternative Line Heights (Leading Tight)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      lineHeight: {
        "tight-xs": "0.875rem", // 14px
        "tight-sm": "1rem", // 16px
        "tight-md": "1.25rem", // 20px
        /* ... and so on */
      },
    },
  },
};
```

## Implementation Steps

1. **Extract Primitive Colors**:

   - Parse the JSON file to extract all color primitives from the "Colors/Base", "Colors/Gray (light mode)", "Colors/Gray (dark mode)", etc.
   - Convert RGB values to HEX
   - Create CSS variables for each primitive color

2. **Create Color Aliases**:

   - Extract the color mode variables that reference primitives
   - Map them to appropriate CSS variables for each theme/skin

3. **Extract Typography Values**:

   - Parse font-family, font-weight, font-size, and line-height variables
   - Convert pixel values to rem (divide by 16)
   - Format for Tailwind configuration

4. **Extract Border Radius Values**:

   - Parse radius variables
   - Format for Tailwind configuration

5. **Extract Container Values**:

   - Parse container padding variables
   - Format for Tailwind configuration

6. **Generate Tailwind Configuration**:
   - Combine all extracted values into a valid Tailwind configuration
   - Consider using CSS variables for theme-dependent values
   - Implement multiple theme/skin support

## Multi-Skin Implementation

Instead of using a generic dark mode, implement multiple skins/themes based on the Figma color modes:

```css
/* Base theme variables (Default Light Mode) */
:root {
  --color-text-primary: var(--color-gray-light-900);
  --color-text-secondary: var(--color-gray-light-700);
  /* ... other light mode variables ... */
}

/* Dark theme */
.theme-dark {
  --color-text-primary: var(--color-gray-dark-50);
  --color-text-secondary: var(--color-gray-dark-100);
  /* ... other dark mode variables ... */
}

/* Green brand theme */
.theme-brand-green {
  --color-text-primary: var(--color-gray-light-900);
  --color-bg-primary: var(--color-green-50);
  /* ... other brand-specific overrides ... */
}
```

## Additional Considerations

1. **CSS Comments**: Preserve the Figma structure using CSS comments, e.g., `/* Colors/Effects/Focus rings */`

2. **Documentation**: Generate documentation that explains how Figma variables map to Tailwind classes to help designers and developers understand the relationship.

3. **Variable Scopes**: Consider the variable scopes in Figma (like FONT_SIZE, LINE_HEIGHT, CORNER_RADIUS) to ensure proper mapping to Tailwind properties.
