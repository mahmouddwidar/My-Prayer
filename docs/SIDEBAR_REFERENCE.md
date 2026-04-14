# Sidebar Architecture - Quick Reference

A quick reference guide for the key components, hooks, and patterns used in the Sidebar implementation.

---

## 1. Hooks Reference

### useAzkarCounters()

**Location:** `hooks/useAzkarCounters.ts`

Manages azkar counter state with persistence.

```typescript
const { counters, increment, decrement, reset, resetAll, isLoading, error } = useAzkarCounters();

// Methods
increment(counterId: string)           // Decrement count (toward 0)
decrement(counterId: string)           // Increment count (up to original)
reset(counterId: string)               // Reset to original count
resetAll()                             // Reset all counters

// State
counters: Map<string, AzkarCounter>    // All counters: Map<id, {currentCount, originalCount}>
isLoading: boolean                     // Initially loading from storage
error: Error | null                    // Any error loading/saving
```

**Storage Key:** `azkarCounters` (browser.storage.local)

---

### useSectionState()

**Location:** `hooks/useSectionState.ts`

Manages section collapse/expand state.

```typescript
const { expandedSections, toggleSection, isExpanded, isLoading, error } = useSectionState();

// Methods
toggleSection(sectionId: string)       // Toggle section open/closed
isExpanded(sectionId: string)          // Check if section is expanded

// State
expandedSections: Set<string>          // IDs of expanded sections
isLoading: boolean                     // Initially loading from storage
error: Error | null                    // Any errors
```

**Storage Key:** `sectionStates` (browser.storage.local)

**Section IDs:**

- `'prayerTimesHeader'`
- `'azkarHeader'`

---

### useTheme()

**Location:** `hooks/useTheme.ts` (existing)

Manages theme across extension.

```typescript
const { theme, setTheme, toggleTheme, isLoading, error } = useTheme();

// Methods
setTheme(theme: 'light' | 'dark')      // Set theme and save
toggleTheme()                          // Toggle between light/dark

// State
theme: 'light' | 'dark'                // Current theme
isLoading: boolean                     // Loading from storage
error: Error | null                    // Any errors
```

---

### usePrayerTimes() & useRealtimePrayerTimes()

**Location:** `hooks/usePrayerTimes.ts`, `hooks/useRealtimePrayerTimes.ts` (existing)

```typescript
const { prayerTimes, dateInfo, isLoading, error, refresh } = usePrayerTimes();
const { previous, next, progress, isReady } = useRealtimePrayerTimes({
  prayerTimes,
  enabled: true,
  checkInterval: 60000
});

// prayerTimes
[{ name: 'Fajr', time: '5:30 AM', timestamp: Date }, ...]

// Live prayer info
next                                   // { name: 'Dhuhr', time: '12:30 PM' }
previous                               // { name: 'Fajr', time: '5:30 AM' }
progress                               // 0-100 (% time until next prayer)
isReady                                // Data loaded
```

---

## 2. Component Reference

### Sidebar

**Location:** `entrypoints/components/Sidebar/Sidebar.tsx`

Main container component.

```tsx
<Sidebar />

// Features:
// - Theme management (light/dark toggle)
// - Section state management
// - Prayer and Azkar sections
// - Theme sync from other contexts
```

---

### PrayerSection

**Location:** `entrypoints/components/Sidebar/sections/PrayerSection.tsx`

Displays prayer times with highlighting.

```tsx
<PrayerSection
  isExpanded={boolean}
  onToggle={() => void}
/>

// Props:
isExpanded: boolean          // Section expanded?
onToggle: () => void         // Called when toggle clicked

// Features:
// - Auto-highlight current/next prayer
// - Progress bar for current prayer
// - Shows loading/error states
```

---

### AzkarSection

**Location:** `entrypoints/components/Sidebar/sections/AzkarSection.tsx`

Displays morning/evening azkar with counters.

```tsx
<AzkarSection
  isExpanded={boolean}
  onToggle={() => void}
/>

// Props:
isExpanded: boolean          // Section expanded?
onToggle: () => void         // Called when toggle clicked

// Features:
// - Tab switching (morning/evening)
// - Interactive counters
// - Reset all button
// - Counter persistence
```

---

### AzkarItem

**Location:** `entrypoints/components/Sidebar/Azkar/AzkarItem.tsx`

Individual azkar with counter.

```tsx
<AzkarItem
  azkar={{ id, subtitle, text, fadl, count }}
  currentCount={number}
  originalCount={number}
  onIncrement={() => void}
  onReset={() => void}
  counterId={string}
/>
```

---

### AzkarCounter

**Location:** `entrypoints/components/Sidebar/Azkar/AzkarCounter.tsx`

Interactive counter control.

```tsx
<AzkarCounter
  counterId={string}
  currentCount={number}
  originalCount={number}
  onIncrement={() => void}
  onReset={() => void}
  isCompleted={boolean}
/>

// Displays: "5 / 33"
// Buttons: [−] [↻] [✓ if completed]
```

---

### PrayerItem

**Location:** `entrypoints/components/Sidebar/PrayerList/PrayerItem.tsx`

Individual prayer display.

```tsx
<PrayerItem
	prayer={{ name, time, timestamp, arabicName }}
	isHighlighted={boolean}
	isPrevious={boolean}
	progress={number | undefined} // 0-100
/>

// Shows:
// - Prayer name (e.g., "Fajr")
// - Time (e.g., "5:30 AM")
// - Progress bar if highlighted
```

---

### SectionHeader

**Location:** `entrypoints/components/Sidebar/shared/SectionHeader.tsx`

Reusable section header with toggle.

```tsx
<SectionHeader
  title={string}                 // e.g., "Prayer Times"
  icon={string}                  // e.g., "🕌"
  isExpanded={boolean}
  onToggle={() => void}
/>
```

---

### ThemeToggle

**Location:** `entrypoints/components/Sidebar/shared/ThemeToggle.tsx`

Theme switcher button.

```tsx
<ThemeToggle theme={"light" | "dark"} onToggle={(theme) => Promise<void>} />

// Displays: "☀️" (dark) or "🌙" (light)
// Sends message to other contexts when toggled
```

---

### OpenSidebarButton

**Location:** `entrypoints/components/OpenSidebarButton.tsx`

Button to open sidebar in new window.

```tsx
<OpenSidebarButton
	label="📖 Open Sidebar" // Optional
	className="" // Optional
	windowWidth={380} // Optional
	windowHeight={600} // Optional
/>

// Opens sidebar.html in new popup window
```

---

## 3. Theme System

### Colors (CSS Variables)

**Light Mode (Default):**

```css
--color-primary-gold: #d4af37;
--color-text-primary: #1a1a1a;
--color-bg-primary: #fafafa;
--color-bg-card: #ffffff;
```

**Dark Mode (`.dark` class):**

```css
--color-text-primary: #e8e8e8;
--color-bg-primary: #1a1a1a;
--color-bg-card: #2d2d2d;
```

### Applying Theme

```typescript
import { applyThemeToDOM, ThemeType } from "@/utils/themeManager";

// Apply theme to DOM
applyThemeToDOM("dark");

// This:
// 1. Adds/removes 'dark' class to <html>
// 2. Sets document.documentElement.style.colorScheme
// 3. CSS variables update via cascade
```

### Listening for Theme Changes

```typescript
import { listenForThemeChanges } from "@/utils/themeManager";

const unsubscribe = listenForThemeChanges((newTheme) => {
	console.log("Theme changed to:", newTheme);
}, "settings"); // storage key

// Returns function to unsubscribe
```

---

## 4. Storage Schema

### azkarCounters

```json
{
	"STORAGE_KEY": "azkarCounters",
	"STRUCTURE": {
		"morning_001": {
			"id": "morning_001",
			"currentCount": 7,
			"originalCount": 33
		},
		"evening_002": {
			"id": "evening_002",
			"currentCount": 0,
			"originalCount": 33
		}
	}
}
```

### sectionStates

```json
{
	"STORAGE_KEY": "sectionStates",
	"STRUCTURE": {
		"prayerTimesHeader": "open",
		"azkarHeader": "collapsed"
	}
}
```

### settings (theme)

```json
{
	"STORAGE_KEY": "settings",
	"STRUCTURE": {
		"theme": "light",
		"language": "en",
		"notifications": true
	}
}
```

---

## 5. CSS Classes

### Main Containers

```css
.sidebar-container          /* Main sidebar wrapper */
.sidebar-header             /* Top header with logo */
.sidebar-main               /* Scrollable content area */
.sidebar-footer             /* Bottom footer */
```

### Sections

```css
.section                    /* Section wrapper */
.section-header             /* Section title bar */
.section-content            /* Section body */
.prayer-section             /* Prayer times section */
.azkar-section              /* Azkar section */
```

### Prayer Items

```css
.prayer-item                /* Individual prayer */
.prayer-item.highlighted    /* Current prayer (active style) */
.prayer-item.past           /* Previous prayer (dimmed) */
.prayer-progress            /* Progress bar container */
```

### Azkar

```css
.azkar-item                 /* Individual azkar item */
.azkar-item.completed       /* Completed azkar */
.azkar-counter              /* Counter display */
.tab-button                 /* Morning/Evening tab */
```

---

## 6. API Usage Patterns

### Creating a Counter

```typescript
// In hook/service
const counter: AzkarCounter = {
	id: "unique-id",
	currentCount: 33,
	originalCount: 33,
};

// Store in Map
counters.set(counter.id, counter);

// Save to storage
await browser.storage.local.set({
	azkarCounters: Object.fromEntries(counters),
});
```

### Updating Counter

```typescript
setCounters((prev) => {
	const updated = new Map(prev);
	const counter = updated.get(id);

	if (counter && counter.currentCount > 0) {
		updated.set(id, {
			...counter,
			currentCount: counter.currentCount - 1,
		});
	}

	saveCounters(updated);
	return updated;
});
```

### Listening for Storage Changes

```typescript
const unsubscribe = listenForThemeChanges((newTheme) => {
	applyThemeToDOM(newTheme);
});

// Later: unsubscribe
return unsubscribe;
```

### Sending Messages

```typescript
// Send from one context
chrome.runtime.sendMessage({
	type: "THEME_CHANGED",
	payload: { theme: "dark" },
});

// Listen in another
chrome.runtime.onMessage.addListener((message) => {
	if (message.type === "THEME_CHANGED") {
		applyThemeToDOM(message.payload.theme);
	}
});
```

---

## 7. Common Tasks

### Task: Add New Azkar Item

1. Update `utils/azkarContent.ts`: Add to `azkarData.morning` or `azkarData.evening`
2. Give it unique `id` (e.g., `'morning_042'`)
3. Set `count` property
4. Sidebar auto-loads and creates counters

### Task: Toggle Section

```typescript
const { toggleSection } = useSectionState();
toggleSection("prayerTimesHeader"); // Expanded ↔ Collapsed
```

### Task: Change Theme

```typescript
const { setTheme } = useTheme();
await setTheme("dark"); // Updates storage + UI
```

### Task: Reset All Counters

```typescript
const { resetAll } = useAzkarCounters();
resetAll(); // All counters → original count
```

### Task: Get Current Prayer

```typescript
const { next, previous } = useRealtimePrayerTimes({ prayerTimes });
console.log(`Next prayer: ${next?.name} at ${next?.time}`);
```

---

## 8. File Locations Summary

| File                                           | Purpose                    |
| ---------------------------------------------- | -------------------------- |
| `hooks/useAzkarCounters.ts`                    | Counter state management   |
| `hooks/useSectionState.ts`                     | Section toggle state       |
| `hooks/useTheme.ts`                            | Theme state (existing)     |
| `entrypoints/components/Sidebar/Sidebar.tsx`   | Main container             |
| `entrypoints/components/Sidebar/Sidebar.css`   | All styles                 |
| `entrypoints/components/OpenSidebarButton.tsx` | Open sidebar button        |
| `entrypoints/sidebar/index.tsx`                | Sidebar entry point        |
| `entrypoints/sidebar/sidebar.html`             | Sidebar HTML template      |
| `utils/themeManager.ts`                        | Theme utilities (existing) |
| `utils/azkarContent.ts`                        | Azkar data                 |
| `docs/SIDEBAR_ARCHITECTURE.md`                 | Full architecture guide    |
| `docs/SIDEBAR_INTEGRATION_GUIDE.md`            | Integration steps          |
| `docs/ADVANCED_PATTERNS.md`                    | Advanced examples          |

---

## 9. Debugging Checklist

- [ ] Counters loading from storage on mount
- [ ] Counters saving to storage on change
- [ ] Theme applying to DOM (class added/removed)
- [ ] Theme syncing across contexts
- [ ] Prayer highlighting working correctly
- [ ] Progress bar updating in real-time
- [ ] Sections toggle working
- [ ] No console errors
- [ ] Dark mode colors correct
- [ ] Light mode colors correct

---

## 10. Performance Tips

✅ **Use memo()** for list items that receive many props
✅ **Use useCallback()** for event handlers
✅ **Use useMemo()** for expensive computations
✅ **Debounce** storage saves (already done)
✅ **Batch** multiple state updates
✅ **Lazy load** heavy components

❌ **Avoid** re-creating objects in render
❌ **Avoid** inline function definitions
❌ **Avoid** large context updates
❌ **Avoid** unnecessary re-renders

---

## 11. Common Errors & Fixes

| Error                      | Cause                | Fix                                       |
| -------------------------- | -------------------- | ----------------------------------------- |
| "Cannot read storage"      | Permission missing   | Add `"storage"` to manifest permissions   |
| Theme not syncing          | Listener not set up  | Call `listenForThemeChanges` in useEffect |
| Counters not persisting    | Storage key mismatch | Verify key is `'azkarCounters'`           |
| Component not re-rendering | Props not changing   | Check memo comparator logic               |
| Sidebar won't open         | URL not correct      | Use `chrome.runtime.getURL()`             |

---
