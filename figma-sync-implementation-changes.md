# Figma Sync Implementation Changes

## Overview

This document summarizes the changes made to the figma-sync command implementation to address the requirements identified in our review plan. The primary focus was on improving collection referencing by name and supporting multiple themes/skins rather than just a generic dark mode.

## Changes Implemented

### 1. Collection Referencing by Name

- Added a `collectionNameMap` property to the `UntitledUiProcessor` to store mappings between collection names and IDs
- Implemented `initCollectionMapping()` method to populate this map when processing begins
- Added `getCollectionIdByName()` to retrieve collection IDs by their names
- Implemented `shouldProcessCollection()` to filter collections by name rather than ID
- Updated variable processing logic to consider collection names when determining variable types

### 2. Multi-Skin Support

- Replaced the binary dark/light mode approach with a more flexible theme system
- Updated `getTargetMode()` to handle various theme names based on Figma color modes
- Changed CSS class naming from `.dark` to `.theme-dark`, `.theme-brand-green`, etc.
- Modified the CSS output to generate variables for all themes found in the Figma file
- Added theme switching documentation and examples to the generated CSS files
- Updated console output to inform users about the multiple theme support
- Implemented correct collection-based theme handling (only "1. Color modes" collection creates themes)

### 3. CSS Variable Organization

- Improved the naming convention for CSS variables to be more consistent
- Added better handling of alpha channel in colors
- Enhanced font size handling with rem conversion
- Improved the organization of font-related variables (family, weight, size, line-height)
- Added more semantic theme mappings for better usability
- Fixed special character handling in variable names (removing parentheses like "(900)")
- Improved variable name cleaning to prevent duplicate hyphens and trailing hyphens

### 4. File Structure Improvements

- **Separated CSS variables from Tailwind configuration file** for better organization
- **Created dedicated CSS files for each Tailwind version** (v3 and v4)
- **Standardized file naming convention** using `<designSystem>v3.css`, `<designSystem>v3.config.js`, and `<designSystem>v4.css`
- Added clearer output messages about the file structure and how to use the files
- Improved JavaScript object key formatting in Tailwind config to properly quote keys with hyphens

## Theme Handling Logic

The implementation now correctly handles Figma's collection structure:

1. **\_Primitives Collection**:

   - Variables from this collection with mode "Style" are placed in `:root` as CSS variables
   - These are the base/primitive colors that other variables reference

2. **1. Color Modes Collection**:

   - This is the ONLY collection that generates theme variations
   - Modes in this collection determine the available themes:
     - "Default (Light mode)" or any mode containing "light" or "default" maps to the base/root CSS context
     - "Default (Dark mode)" or any mode containing "dark" maps to `.theme-dark` CSS class
     - Other modes like "Beispiel Brand Grün" map to their own theme classes (e.g., `.theme-beispiel-brand-grün`)

3. **All Other Collections**:
   - Collections like "2. Radius", "5. Containers", and "6. Typography" always map to the root CSS context
   - These variables use a single mode like "Value" or "Mode 1" and remain consistent across all themes
   - They don't create separate theme variations, regardless of mode name
   - The "3. Spacing" and "4. Widths" collections are skipped entirely as we use Tailwind defaults

This ensures that the CSS output accurately reflects Figma's design intent, where only color modes create theme variations while other token collections maintain consistency across themes.

## File Changes

1. **UntitledUI Processor** (`/src/figma/processors/untitledui-processor.ts`):

   - Added collection name mapping
   - Improved variable processing with collection name context
   - Enhanced theme mode determination
   - Added alpha channel support for colors
   - Simplified variable reference resolution
   - Improved semantic theme variable mapping
   - Enhanced the `extractMeaningfulName()` method to properly clean up special characters like parentheses
   - **Rewritten** the `getTargetMode()` method to only treat "1. Color modes" collection as a theme source

2. **Tailwind Converter** (`/src/figma/converters/tailwind-converter.ts`):

   - Removed dark mode specific handling in favor of a generic theme approach
   - Added support for initializing the collection mapping
   - Improved @theme directive output for multiple themes
   - Added theme switching documentation

3. **Tailwind v3 Converter** (`/src/figma/converters/tailwind-v3-converter.ts`):

   - Updated to support multiple themes instead of just dark mode
   - **Modified to return both JavaScript config and CSS variables separately**
   - Improved the CSS variable reference handling
   - Enhanced the output formatting for better readability
   - Added comprehensive theme documentation
   - Added proper quoting for JavaScript object keys with hyphens

4. **Figma Sync Command** (`/src/commands/figma-sync.ts`):
   - Updated output messages to inform users about multiple theme support
   - **Implemented separate file generation for CSS variables and Tailwind config**
   - **Updated file naming convention to clearly indicate Tailwind version**
   - Improved prompts for configuration
   - Added better handling of output paths

## Output Files

The command now generates the following files:

1. **For Tailwind v4:**

   - `tailwindv4.css` or `flowbytev4.css` - Contains all CSS variables with @theme directives for Tailwind v4

2. **For Tailwind v3:**
   - `tailwindv3.css` or `flowbytev3.css` - Contains just the CSS variables for Tailwind v3
   - `tailwindv3.config.js` or `flowbytev3.config.js` - Contains the Tailwind v3 configuration that references the CSS variables

This separation makes it easier to integrate with different project setups and keeps the concerns separate (variables vs. configuration).

## Testing Instructions

To test these changes:

1. Run the figma-sync command with a Figma file that contains multiple color modes.
2. Verify that the command generates separate CSS and JS files:
   - `<designSystem>v4.css` for Tailwind v4
   - `<designSystem>v3.css` and `<designSystem>v3.config.js` for Tailwind v3
3. Check the generated CSS files for multiple theme classes (e.g., `.theme-dark`, `.theme-brand-green`).
4. Verify that variable references work correctly across themes.
5. Ensure the documentation in the generated files explains how to switch between themes.
6. Verify that variable names with special characters like "(900)" are properly cleaned up.
7. Check that the generated tailwind.config.js file has properly quoted keys for variables with hyphens.
8. Verify that only variables from the "1. Color modes" collection create theme classes, while other collections (Typography, Radius, etc.) only appear in the root CSS context.

## Next Steps

While these changes address our primary requirements, there are still some potential enhancements for future updates:

1. Add a theme preview tool to visualize the different themes
2. Implement automatic detection of theme preferences (e.g., system dark mode)
3. Create a more detailed documentation generator for design tokens
4. Add more robust error handling for edge cases in Figma variable structures
5. Implement a caching mechanism to improve performance with large Figma files
