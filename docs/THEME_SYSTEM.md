# Global Dark/Light Mode System - Implementation Guide

## Overview

This document explains the centralized theme management system for the My Prayer Chrome extension. The system provides:

- ✅ **Global theme synchronization** across all extension pages (popup, options, etc.)
- ✅ **Persistent theme storage** using chrome.storage.local
- ✅ **Instant theme switching** without page refresh
- ✅ **Cross-context listening** - changes in one page reflect everywhere
- ✅ **CSS class-based approach** for flexible styling
- ✅ **Type-safe** with TypeScript support

---

## Architecture

### Layer 1: Theme Manager (`utils/themeManager.ts`)

**Purpose**: Low-level utilities for theme operations

**Key Functions**:

- `applyThemeToDOM()` - Apply theme class to `<html>` element
- `getThemeFromStorage()` - Retrieve stored theme
- `saveThemeToStorage()` - Persist theme to storage
- `initializeTheme()` - Init theme on page load
- `listenForThemeChanges()` - Listen for cross-context updates
- `toggleTheme()` - Switch between light/dark

**Usage**: Directly in initialization code (main.tsx, background scripts)

```typescript
import { initializeTheme, listenForThemeChanges } from "@/utils/themeManager";

// On page load
await initializeTheme("settings");

// Listen for external changes
listenForThemeChanges((newTheme) => {
	console.log(`Theme changed to: ${newTheme}`);
});
```

### Layer 2: useTheme Hook (`hooks/useTheme.ts`)

**Purpose**: React hook for component-level theme management

**Features**:

- Automatic initialization on component mount
- Automatic listening for storage changes
- Type-safe state management
- Error handling

**Usage in Components**:

```typescript
import { useTheme } from '@/hooks/useTheme';

function Settings() {
  const { theme, setTheme, toggleTheme, isLoading, error } = useTheme('settings');

  if (isLoading) return <div>Loading theme...</div>;

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}
```

### Layer 3: CSS Implementation

**Approach**: Class-based theming on `<html>` element

**How it works**:

- Light mode (default): No `dark` class
- Dark mode: `dark` class added to `<html>`

**In CSS** (using Tailwind conventions):

```css
/* Light mode (default) */
.glass-card {
	background: rgba(255, 255, 255, 0.85);
}

/* Dark mode (when .dark class exists) */
.dark .glass-card {
	background: rgba(25, 26, 27, 0.5);
}
```

**In Tailwind classes**:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
	{/* Auto-switches with dark class */}
</div>
```

---

## File Structure

```
hooks/
  └── useTheme.ts                    # React hook for theme management
utils/
  └── themeManager.ts                # Low-level theme utilities
entrypoints/
  ├── popup/
  │   ├── main.tsx                   # Initialize theme
  │   ├── App.tsx                    # Listen for changes
  │   └── App.css                    # Theme-aware styles
  └── options/
      ├── index.tsx                  # Initialize theme
      ├── OptionsApp.tsx             # useTheme hook
      └── (App.css shared)           # Theme-aware styles
types/
  └── (add to index.ts if needed)    # ThemeType export
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    chrome.storage.local                      │
│                   { theme: 'light'|'dark' }                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   options.tsx    │  │   popup/App.tsx  │  │  Other Pages     │
│                  │  │                  │  │                  │
│ useTheme hook    │  │ listenForTheme   │  │ listenForTheme   │
│ (reads/writes)   │  │ Changes (reads)  │  │ Changes (reads)  │
└────────┬─────────┘  └──────────┬───────┘  └────────┬─────────┘
         │                       │                    │
         └───────────────────────┼────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  <html class="dark">    │
                    │  (DOM gets updated)     │
                    └─────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  CSS Applies:           │
                    │  .dark .component {}    │
                    └─────────────────────────┘
```

---

## Configuration

### Default Theme

The default theme is **"light"** (defined in `themeManager.ts`):

```typescript
const DEFAULT_CONFIG: ThemeConfig = {
	defaultTheme: "light",
	storageKey: "settings",
};
```

To change default: Update `DEFAULT_CONFIG.defaultTheme` in `themeManager.ts`

### Storage Key

Theme is stored in `chrome.storage.local` under the `settings` key:

```json
{
	"settings": {
		"theme": "dark",
		"notifications": true,
		"timeFormat": "12h"
	}
}
```

---

## Usage Examples

### Example 1: Toggle Theme Button

```typescript
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme, isLoading } = useTheme('settings');

  return (
    <button
      onClick={toggleTheme}
      disabled={isLoading}
      className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600"
    >
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
```

### Example 2: Conditional Rendering Based on Theme

```typescript
import { useTheme } from '@/hooks/useTheme';

export function Card() {
  const { theme } = useTheme('settings');

  return (
    <div className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
      Content
    </div>
  );
}
```

### Example 3: Ensure Theme Persists on Page Load

```typescript
// In main.tsx
import { initializeTheme } from '@/utils/themeManager';

// Initialize theme BEFORE rendering React app
initializeTheme('settings').catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
```

### Example 4: Listen for External Theme Changes

```typescript
// In a component or script
import { listenForThemeChanges } from "@/utils/themeManager";

const unsubscribe = listenForThemeChanges((newTheme) => {
	console.log(`Theme changed to: ${newTheme}`);
	// Perform any custom actions
}, "settings");

// Clean up when done
// unsubscribe();
```

---

## CSS Variables Approach (Alternative)

If you want to use CSS variables instead of class selectors:

```typescript
// Add to applyThemeToDOM in themeManager.ts
function applyThemeToDOMWithVariables(theme: ThemeType): void {
	const root = document.documentElement;

	if (theme === "dark") {
		root.style.setProperty("--bg-primary", "#1a1a1a");
		root.style.setProperty("--text-primary", "#ffffff");
		root.style.setProperty("--border-color", "#333333");
	} else {
		root.style.setProperty("--bg-primary", "#ffffff");
		root.style.setProperty("--text-primary", "#000000");
		root.style.setProperty("--border-color", "#cccccc");
	}
}
```

**Pros**: More flexible, easier to customize
**Cons**: More code to maintain, needs more CSS setup

**Current approach (class-toggle) is recommended** for this project because:

- Tailwind integrates seamlessly
- Minimal code overhead
- Clear semantic separation of concerns
- Performance is identical

---

## Testing the Theme System

### Test 1: Persistence

1. Open options page
2. Toggle theme to dark
3. Close extension
4. Reopen extension
5. ✅ Theme should remain dark

### Test 2: Cross-Context Sync

1. Open options page in tab 1
2. Open popup in tab 2
3. Change theme in options page
4. ✅ Popup should instantly update

### Test 3: Error Handling

1. Clear browser data / storage
2. Open any extension page
3. ✅ Should default to "light" theme gracefully

### Test 4: Initialization

1. Open options page
2. Check browser console
3. ✅ Should see: "✓ Theme applied: light"

---

## Troubleshooting

### Theme not persisting

**Check**:

- Is `chrome.storage.local` accessible in manifest.json permissions?
- Are you calling `initializeTheme()` in main.tsx?
- Check browser console for errors

**Fix**:

```json
// manifest.json
{
	"permissions": ["storage"]
}
```

### Dark mode CSS not applying

**Check**:

- Is `.dark` class actually added to `<html>`? (Inspect element)
- Are CSS selectors correct? (Should be `.dark .element`, not `.dark-.element`)
- Is Tailwind's dark mode enabled?

**Fix**:

```css
/* CORRECT */
.dark .card {
	background: black;
}

/* WRONG */
.dark-.card {
	background: black;
}
```

### Changes not syncing across pages

**Check**:

- Are you using `listenForThemeChanges()` in all pages?
- Is the storage key the same (`'settings'`)?
- Check browser console for listener registration

**Fix**:

```typescript
// In App.tsx and OptionsApp.tsx
useEffect(() => {
  const unsubscribe = listenForThemeChanges(...);
  return unsubscribe;
}, []);
```

---

## Performance Considerations

### Storage Access

- `getThemeFromStorage()` makes ~5-10ms storage calls
- Solution: Cache theme in React state (via `useTheme` hook)
- Not recommended: Calling `getThemeFromStorage()` repeatedly

### DOM Updates

- Class toggle is O(1) operation
- CSS variable updates are also O(1)
- No performance impact expected

### Listeners

- Each page registers ONE storage listener (no duplicates)
- Proper cleanup in useEffect dependencies prevents memory leaks

---

## Best Practices

✅ **DO**:

- Use `useTheme()` hook in React components
- Call `initializeTheme()` in main.tsx before rendering
- Use class-based CSS approach (`.dark .element`)
- Leverage Tailwind's dark mode prefix

❌ **DON'T**:

- Call `applyThemeToDOM()` repeatedly in components
- Create multiple storage listeners for same key
- Handle theme state in individual components (use hook instead)
- Forget to import `initializeTheme()` in main.tsx

---

## Future Enhancements

Potential improvements:

1. **Auto-detect system preference**: Use `window.matchMedia('(prefers-color-scheme: dark)')`
2. **Time-based switching**: Auto-switch to dark mode at sunset
3. **Theme scheduling**: Let users set specific times for theme changes
4. **Custom color themes**: Allow users to define custom color schemes
5. **Animate theme transitions**: Fade between themes

---

## Related Files

- [themeManager.ts](../../utils/themeManager.ts) - Core utilities
- [useTheme.ts](../../hooks/useTheme.ts) - React hook
- [OptionsApp.tsx](../options/OptionsApp.tsx) - Settings UI using hook
- [App.tsx](../popup/App.tsx) - Popup listening for changes
- [App.css](../popup/App.css) - Theme-aware styles
