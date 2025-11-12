# TV Guide - Block Color Customization Feature

## Feature Overview
Add customizable color schemes to the programme grid to improve visual distinction and user experience. This addresses the current limitation where all programme blocks use a single blue color (#3498db), making it difficult to scan rows and distinguish between adjacent programmes.

## Current State (v1.4.0)

### Existing Implementation
- **Programme Blocks**: All use single color `#3498db` (blue)
- **Hover State**: Darker blue `#2980b9`
- **Active State**: Red `#e74c3c` (when details popup is open)
- **Programme Rows**: White background, subtle grey borders
- **Row Highlighting**: Yellow/orange highlight when clicking channel (2-second duration)

### Code Locations
- **CSS Styling**: `/home/user/TVGuide/style.css` lines 291-308 (`.programme-block` class)
- **Block Creation**: `/home/user/TVGuide/script.js` lines 395-445 (`createProgrammeBlock()` function)
- **Row Creation**: `/home/user/TVGuide/script.js` lines 372-391 (`createProgrammeRow()` function)

## Feature Requirements

### 1. Row Alternation (Zebra Striping)
**Goal**: Subtle contrast between alternating rows to improve horizontal scanning

**Implementation Details**:
- Apply alternating background colors to `.programme-row` elements
- Color scheme should be subtle to avoid overwhelming the interface
- Suggested palette:
  - Even rows: `rgba(248, 249, 250, 0.5)` (very light grey)
  - Odd rows: White/transparent
- Must work with existing row highlighting feature
- Should not interfere with programme block visibility

**Considerations**:
- When favourites filter is active, row indices may change
- Drag-and-drop reordering changes row positions
- Need to recalculate on `renderChannelsAndProgrammes()`

### 2. Programme Block Theme Alternation
**Goal**: Cycle through a mini color palette for adjacent programme blocks within each row

**Implementation Details**:
- Define color themes/palettes in AppState or CONFIG
- Rotate colors for consecutive programmes in the same channel row
- Suggested starter palette (4-color rotation):
  - Color 1: `#3498db` (blue) - current default
  - Color 2: `#9b59b6` (purple)
  - Color 3: `#16a085` (teal)
  - Color 4: `#e67e22` (orange)
- Each channel row should start with Color 1
- Maintain hover/active states (darken by 15-20% using CSS filters or calculated variants)

**Technical Approach**:
```javascript
// In createProgrammeBlock() function
const colorIndex = programmeIndexInChannel % palette.length;
div.style.backgroundColor = AppState.colorPalette[colorIndex];
```

**Considerations**:
- Color accessibility (ensure sufficient contrast with white text)
- Hover states need to be calculated dynamically
- Active state (red) should override theme colors

### 3. Combined Grid Styling (Full Customization)
**Goal**: Enable both row alternation AND block theme alternation simultaneously

**Implementation Details**:
- Add user preference toggles in UI (new settings panel or header controls)
- Store preferences in localStorage:
  - `tvguide_row_alternation`: boolean
  - `tvguide_block_theme`: string (theme name or 'none')
  - `tvguide_color_palette`: array of hex colors (for custom palettes)
- Conditional styling based on preferences

**UI Controls Needed**:
- Toggle for "Alternate Row Colors"
- Dropdown/selector for "Programme Color Theme":
  - None (solid blue - current behavior)
  - Default (4-color palette)
  - Pastel (softer colors)
  - High Contrast (vivid colors)
  - Custom (user-defined palette)

### 4. Color Theme Library
**Suggested Pre-built Themes**:

**Default Theme** (4 colors):
```javascript
{
  name: 'Default',
  colors: ['#3498db', '#9b59b6', '#16a085', '#e67e22']
}
```

**Pastel Theme** (4 colors):
```javascript
{
  name: 'Pastel',
  colors: ['#a8d5e2', '#c8b8db', '#f9d5a7', '#ffb3ba']
}
```

**High Contrast Theme** (4 colors):
```javascript
{
  name: 'High Contrast',
  colors: ['#2874a6', '#7d3c98', '#117a65', '#d68910']
}
```

**Monochrome Theme** (4 shades of blue):
```javascript
{
  name: 'Monochrome',
  colors: ['#1f618d', '#2e86c1', '#5dade2', '#85c1e9']
}
```

**Channel-based Theme** (each channel gets consistent color):
```javascript
// Instead of rotating per-programme, apply one color per channel
// Use channel index % palette.length
```

## Technical Implementation Plan

### Phase 1: Data Structure Setup
1. Add color theme configuration to CONFIG object
2. Define default color palettes
3. Add user preferences to AppState
4. Create localStorage save/load for color preferences

### Phase 2: Row Alternation
1. Modify `renderChannelRow()` to accept row index
2. Add conditional CSS class `.programme-row.even` or `.programme-row.odd`
3. Add CSS styling for alternating rows
4. Test with favourites filter and drag-and-drop

### Phase 3: Block Theme Alternation
1. Modify `createProgrammeBlock()` to accept programme index
2. Calculate color from palette based on index
3. Apply inline styles or CSS custom properties
4. Generate hover states dynamically (CSS filters or JS)
5. Ensure active state (red) overrides theme colors

### Phase 4: UI Controls
1. Create settings panel/modal (or add to header controls)
2. Add toggle for row alternation
3. Add dropdown for theme selection
4. Add color preview swatches
5. Wire up event listeners to update preferences

### Phase 5: Persistence & Polish
1. Save/load preferences from localStorage
2. Apply preferences on initial load
3. Test all combinations (row + theme variations)
4. Add smooth transitions for theme changes
5. Update version to 1.5.0

## Accessibility Considerations

### Color Contrast Requirements (WCAG 2.1)
- Normal text (14px): Minimum contrast ratio 4.5:1
- Large text (18px+): Minimum contrast ratio 3:1
- Programme titles are 13px (normal text requirement)

**Testing Each Color**:
- Test white text on each palette color
- Use online contrast checker: https://webaim.org/resources/contrastchecker/
- Adjust colors if contrast ratio < 4.5:1

### Color Blindness Testing
- Test with Deuteranopia (red-green) simulator
- Test with Protanopia (red-green) simulator
- Test with Tritanopia (blue-yellow) simulator
- Ensure themes are distinguishable for colorblind users

**Recommendation**: Add "Color Blind Safe" theme option using patterns/textures instead of just colors

## Code Files to Modify

1. **style.css** (new classes):
   - `.programme-row.even` / `.programme-row.odd`
   - `.programme-block.theme-*` (if using CSS classes instead of inline styles)
   - Settings panel UI components

2. **script.js** (functions to modify):
   - `CONFIG` object: Add color theme definitions
   - `AppState` object: Add color preference properties
   - `loadPreferences()`: Load color preferences from localStorage (line ~80)
   - `savePreferences()`: Save color preferences (line ~104)
   - `renderChannelRow()`: Apply row alternation (line ~317)
   - `createProgrammeBlock()`: Apply block theme colors (line ~395)
   - New function: `applyColorTheme()`
   - New function: `openSettingsPanel()`
   - New function: `changeColorTheme(themeName)`

3. **index.html** (new UI elements):
   - Settings button in header controls
   - Settings modal/panel (hidden by default)
   - Theme selector dropdown
   - Row alternation toggle checkbox
   - Color preview swatches

## Data Structure Examples

### AppState Extensions
```javascript
const AppState = {
    // ... existing properties ...
    colorSettings: {
        rowAlternation: false,
        blockTheme: 'none', // 'none', 'default', 'pastel', 'highcontrast', 'monochrome'
        customPalette: null // Array of hex colors if custom
    }
};
```

### CONFIG Extensions
```javascript
const CONFIG = {
    // ... existing properties ...
    COLOR_THEMES: {
        none: {
            name: 'Solid Blue',
            colors: ['#3498db']
        },
        default: {
            name: 'Default',
            colors: ['#3498db', '#9b59b6', '#16a085', '#e67e22']
        },
        pastel: {
            name: 'Pastel',
            colors: ['#a8d5e2', '#c8b8db', '#f9d5a7', '#ffb3ba']
        },
        highcontrast: {
            name: 'High Contrast',
            colors: ['#2874a6', '#7d3c98', '#117a65', '#d68910']
        },
        monochrome: {
            name: 'Monochrome Blue',
            colors: ['#1f618d', '#2e86c1', '#5dade2', '#85c1e9']
        }
    }
};
```

## Testing Checklist

- [ ] Row alternation works with full channel list
- [ ] Row alternation works with favourites filter enabled
- [ ] Row alternation updates correctly after drag-and-drop reordering
- [ ] Block theme colors cycle correctly through palette
- [ ] Hover states darken appropriately on themed blocks
- [ ] Active state (red) overrides theme colors
- [ ] Row highlighting (yellow) works with row alternation
- [ ] All color combinations meet WCAG contrast requirements
- [ ] Themes are distinguishable for colorblind users
- [ ] Settings persist across page refreshes
- [ ] Settings persist across guide data refreshes
- [ ] Theme changes apply smoothly without jarring UI shifts
- [ ] Mobile responsiveness maintained with new color schemes

## Known Constraints

1. **Current Hover Implementation**: Uses hardcoded color in CSS (`.programme-block:hover { background-color: #2980b9; }`)
   - Will need to change to CSS filters or calculated inline styles

2. **Active State Override**: Red color for active blocks needs to take precedence
   - May need `!important` or higher specificity selectors

3. **Performance**: Inline styles on 266 channels × ~10 programmes = ~2,660 DOM elements
   - CSS classes would be more performant than inline styles
   - Consider using CSS custom properties (variables) per row

4. **Time Indicator**: Red line (`#e74c3c`) should remain red regardless of theme

## Future Enhancements (Post-v1.5.0)

1. **Channel-based Coloring**: Each channel gets a consistent color (not per-programme rotation)
2. **Category-based Coloring**: Parse programme categories from XMLTV and color by genre (Sports, News, Movies, etc.)
3. **Custom Palette Editor**: Visual color picker for users to create their own palettes
4. **Import/Export Themes**: Share color themes between users via JSON files
5. **Time-based Coloring**: Different colors for morning/afternoon/evening/night programmes
6. **Brightness Adjustment**: Global slider to make all colors lighter/darker

## References

- Current colour usage: `style.css` lines 291-308
- Programme block creation: `script.js` lines 395-445
- localStorage pattern: `script.js` lines 80-117
- WCAG Contrast Checker: https://webaim.org/resources/contrastchecker/
- Color Blind Simulator: https://www.color-blindness.com/coblis-color-blindness-simulator/

## Version Milestone

**Target Version**: 1.5.0
**Feature Name**: "Block Color Customization"
**Commit Message Template**:
```
Version 1.5.0: Add programme block color customization

- Implement row alternation (zebra striping)
- Add 5 pre-built color themes for programme blocks
- Add settings panel with theme selector and row alternation toggle
- Persist color preferences in localStorage
- Ensure WCAG AA contrast compliance for all themes
- Update version to 1.5.0
```

---

## Quick Start for Next Session

**Prompt to Continue**:
> "Hi Claude, I'd like to implement the Block Color Customization feature from COLOR_CUSTOMIZATION_REQUIREMENTS.md. Let's start with Phase 1 (data structure setup) and Phase 2 (row alternation). Please read the requirements document and implement row alternation with a toggle in the header controls."

**Or for full implementation**:
> "Hi Claude, please implement the complete Block Color Customization feature as specified in COLOR_CUSTOMIZATION_REQUIREMENTS.md. Follow the 5-phase implementation plan, starting with data structures and ending with a settings panel UI. Target version 1.5.0."
