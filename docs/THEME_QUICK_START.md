# Theme System - Quick Start Guide

## 🚀 Getting Started in 2 Minutes

### For Users

**How to change theme:**

1. Open the extension popup
2. Click on the three-dots menu (or settings icon)
3. Navigate to "Settings" / "Options"
4. Find the "Theme" or "Dark Mode" toggle
5. ✅ Theme changes immediately everywhere

---

### For Developers

#### Installation (Already Done ✅)

```
✅ hooks/useTheme.ts               - Theme management hook
✅ utils/themeManager.ts           - Core utilities
✅ popup/main.tsx                  - Theme initialization
✅ options/index.tsx               - Theme initialization
✅ popup/App.tsx                   - Cross-context listener
✅ options/OptionsApp.tsx          - Uses useTheme hook
```

#### Using in a New Component

```typescript
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme('settings');

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

#### Adding Theme-Aware Styles

**Using Tailwind (Recommended):**

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
	This div is white in light mode, dark gray in dark mode
</div>
```

**Using CSS:**

```css
/* Light mode (default) */
.card {
	background-color: white;
	color: black;
}

/* Dark mode */
.dark .card {
	background-color: #1a1a1a;
	color: white;
}
```

---

## 📊 System Overview

```
User Action (toggle theme)
       ↓
useTheme hook / handleChange
       ↓
saveThemeToStorage() → chrome.storage.local
       ↓
applyThemeToDOM() → add/remove .dark class on <html>
       ↓
CSS Applies → .dark .element { ... }
       ↓
Browser renders updated UI
       ↓
listenForThemeChanges() detects change in other contexts
       ↓
Updates propagate everywhere instantly ✨
```

---

## 🔧 Common Tasks

### Task 1: Add Dark Mode to a Component

**Before:**

```tsx
function Card() {
	return (
		<div style={{ backgroundColor: "white", color: "black" }}>My Card</div>
	);
}
```

**After:**

```tsx
function Card() {
	return (
		<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
			My Card
		</div>
	);
}
```

### Task 2: Conditional Rendering Based on Theme

```tsx
import { useTheme } from "@/hooks/useTheme";

function Dashboard() {
	const { theme } = useTheme("settings");

	return (
		<div>
			{theme === "dark" ? (
				<img src="/logo-light.png" alt="logo" />
			) : (
				<img src="/logo-dark.png" alt="logo" />
			)}
		</div>
	);
}
```

### Task 3: Listen for Theme Changes (Non-React Context)

```typescript
import { listenForThemeChanges, applyThemeToDOM } from "@/utils/themeManager";

// In a service or utility
listenForThemeChanges((newTheme) => {
	console.log(`Theme changed to: ${newTheme}`);
	// Update any external UI
	updateExternalUI(newTheme);
});
```

### Task 4: Debug Theme Issues

```typescript
// In browser console
// Check current theme
chrome.storage.local.get("settings", (result) => {
	console.log(result.settings.theme);
});

// Check DOM class
console.log(document.documentElement.className);

// Should include 'dark' if dark mode is active
```

---

## 📋 Checklist for New Pages

When adding a new extension page, ensure:

- [ ] Import `initializeTheme` in your entry file (e.g., `main.tsx`)
- [ ] Call `initializeTheme('settings')` before rendering React
- [ ] Use `useTheme()` hook if you need to change theme
- [ ] Use `listenForThemeChanges()` if theme can be changed elsewhere
- [ ] Apply `.dark .element` CSS classes for dark mode styles
- [ ] Test theme persistence by closing/reopening extension
- [ ] Test theme sync by opening multiple pages

---

## 🎨 CSS Class Reference

### Class Applied to `<html>` Element

```html
<!-- Light mode (default) -->
<html>
	<!-- Dark mode -->
	<html class="dark"></html>
</html>
```

### Tailwind Dark Mode Variants

| Light Mode        | Dark Mode              | Usage                                          |
| ----------------- | ---------------------- | ---------------------------------------------- |
| `bg-white`        | `dark:bg-gray-900`     | `class="bg-white dark:bg-gray-900"`            |
| `text-black`      | `dark:text-white`      | `class="text-black dark:text-white"`           |
| `border-gray-200` | `dark:border-gray-700` | `class="border-gray-200 dark:border-gray-700"` |

---

## 🐛 Common Issues & Fixes

| Issue                  | Cause                             | Fix                                                                 |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------- |
| Dark mode not applying | Missing `.dark` class on `<html>` | Check: `document.documentElement.className` in console              |
| Theme not persisting   | `initializeTheme()` not called    | Add to main.tsx: `initializeTheme('settings').catch(console.error)` |
| Changes not syncing    | Missing listener                  | Add: `listenForThemeChanges(callback, 'settings')`                  |
| Styles don't match     | CSS selector error                | Use `.dark .selector`, not `.dark-.selector`                        |

---

## 📚 Advanced Topics

### Custom Color Themes

To add more theme options (e.g., "auto", "sepia"):

1. Update `ThemeType` in `themeManager.ts`:

```typescript
export type ThemeType = "light" | "dark" | "auto" | "sepia";
```

2. Update CSS with new theme classes:

```css
.sepia body {
	filter: sepia(30%);
}
```

3. Update `applyThemeToDOM()` to handle new themes

### System Preference Detection

```typescript
// Add to themeManager.ts
export function getSystemPreference(): ThemeType {
	if (
		window.matchMedia &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	) {
		return "dark";
	}
	return "light";
}
```

### Time-Based Theme Switching

```typescript
// Auto-switch to dark at 6 PM
function scheduleThemeChange() {
	const now = new Date();
	const evening = new Date();
	evening.setHours(18, 0, 0); // 6 PM

	const timeout = evening.getTime() - now.getTime();

	setTimeout(() => {
		saveThemeToStorage("dark");
		applyThemeToDOM("dark");
	}, timeout);
}
```

---

## 📖 References

- [Theme Manager Utilities](../../utils/themeManager.ts)
- [useTheme Hook](../../hooks/useTheme.ts)
- [Full Documentation](./THEME_SYSTEM.md)
- [Tailwind Dark Mode Guide](https://tailwindcss.com/docs/dark-mode)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

---

## 💡 Tips

✅ **Pro Tip 1**: Use Tailwind's `dark:` prefix for 90% of your styling needs

✅ **Pro Tip 2**: Test theme in multiple browsers to ensure consistency

✅ **Pro Tip 3**: Use CSS custom properties for frequently changed colors

✅ **Pro Tip 4**: Keep a `.dark .component { }` section near related light mode styles

✅ **Pro Tip 5**: Use browser DevTools to toggle `dark` class and preview changes:

```javascript
document.documentElement.classList.toggle("dark");
```

---

**Last Updated**: April 13, 2026
**Version**: 1.0
