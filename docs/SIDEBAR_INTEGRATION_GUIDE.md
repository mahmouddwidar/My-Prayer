# Integration Guide - Adding Sidebar to Your Extension

## Quick Start

This guide shows you how to integrate the new React Sidebar component into your My Prayer extension.

---

## 1. File Structure Update

Your project should have these new files:

```
hooks/
├── useAzkarCounters.ts        ✅ NEW
├── useSectionState.ts         ✅ NEW
├── usePrayerTimes.ts          (existing)
├── useTheme.ts                (existing)
└── ...

entrypoints/
├── components/
│   ├── Sidebar/
│   │   ├── Sidebar.tsx        ✅ NEW
│   │   ├── Sidebar.css        ✅ NEW
│   │   ├── sections/
│   │   │   ├── PrayerSection.tsx    ✅ NEW
│   │   │   └── AzkarSection.tsx     ✅ NEW
│   │   ├── shared/
│   │   │   ├── SectionHeader.tsx    ✅ NEW
│   │   │   └── ThemeToggle.tsx      ✅ NEW
│   │   ├── PrayerList/
│   │   │   └── PrayerItem.tsx       ✅ NEW
│   │   └── Azkar/
│   │       ├── AzkarItem.tsx        ✅ NEW
│   │       └── AzkarCounter.tsx     ✅ NEW
│   ├── OpenSidebarButton.tsx  ✅ NEW
│   └── (existing components)
├── popup/
│   └── index.tsx              (update)
└── sidebar/
    └── index.tsx              ✅ NEW (see step 3)
```

---

## 2. Update azkarContent - Creating azkarData

First, we need to create a structured azkar data source. Update or create `utils/azkarContent.ts`:

```typescript
// utils/azkarContent.ts

export interface AzkarItem {
	id: string;
	subtitle?: string;
	text: string;
	fadl?: string;
	count: number;
}

export const azkarData: Record<"morning" | "evening", AzkarItem[]> = {
	morning: [
		{
			id: "morning-001",
			subtitle: "Subhan-Allah",
			text: "سُبْحَانَ اللهِ",
			fadl: "Glory be to Allah",
			count: 33,
		},
		{
			id: "morning-002",
			subtitle: "Al-Hamdulillah",
			text: "الْحَمْدُ لِلَّهِ",
			fadl: "All praise is due to Allah",
			count: 33,
		},
		// ... add more morning azkar
	],
	evening: [
		{
			id: "evening-001",
			subtitle: "Subhan-Allah",
			text: "سُبْحَانَ اللهِ",
			fadl: "Glory be to Allah",
			count: 33,
		},
		// ... add more evening azkar
	],
};
```

---

## 3. Create Sidebar Entrypoint

Create `entrypoints/sidebar/index.tsx`:

```typescript
// entrypoints/sidebar/index.tsx

import { createRoot } from 'react-dom/client';
import { Sidebar } from '@/entrypoints/components/Sidebar/Sidebar';
import '@/entrypoints/components/Sidebar/Sidebar.css';
import { initializeTheme } from '@/utils/themeManager';

// Initialize theme before rendering
initializeTheme('settings').then(() => {
  const container = document.getElementById('app');
  if (container) {
    const root = createRoot(container);
    root.render(<Sidebar />);
  }
});
```

Create `entrypoints/sidebar/sidebar.html`:

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta http-equiv="Content-Security-Policy" content="script-src 'self'" />
		<title>My Prayer - Sidebar</title>
	</head>
	<body>
		<div id="app"></div>
		<script type="module" src="./index.tsx"></script>
	</body>
</html>
```

---

## 4. Update wxt.config.ts

Add the sidebar entrypoint to your WXT configuration:

```typescript
// wxt.config.ts

import { defineConfig } from "wxt";

export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	manifest: {
		permissions: ["storage", "runtime"],
		action: {
			default_title: "My Prayer",
			default_popup: "popup/index.html",
		},
		web_accessible_resources: [
			{
				resources: ["sidebar/index.html"],
				matches: ["<all_urls>"],
			},
		],
	},
});
```

---

## 5. Add Open Sidebar Button to Popup

Update `entrypoints/popup/App.tsx` to include the Open Sidebar button:

```typescript
// entrypoints/popup/App.tsx

import { OpenSidebarButton } from '@/entrypoints/components/OpenSidebarButton';

export function App() {
  return (
    <div>
      {/* Your existing popup content */}

      {/* Add button at bottom */}
      <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0' }}>
        <OpenSidebarButton
          label="📖 Open Sidebar"
          windowWidth={380}
          windowHeight={700}
        />
      </div>
    </div>
  );
}
```

---

## 6. Update Manifest Permissions

Ensure your `manifest.json` or wxt config includes required permissions:

```json
{
	"permissions": [
		"storage", // For persistence
		"runtime", // For messaging
		"windows", // For opening sidebar window
		"tabs" // For querying tabs
	]
}
```

---

## 7. Data Flow Implementation

### 7.1 Theme Sync Across Contexts

When user changes theme in settings page:

```typescript
// In settings/options page
const handleThemeChange = async (newTheme: "light" | "dark") => {
	await setTheme(newTheme);

	// Notify all extension contexts
	chrome.runtime
		.sendMessage({
			type: "THEME_CHANGED",
			payload: { theme: newTheme },
		})
		.catch(() => {}); // Ignore if no listener
};
```

The sidebar automatically listens and updates via `listenForThemeChanges`.

### 7.2 Azkar Counter Persistence

Counters are automatically saved to `browser.storage.local` with debouncing:

```typescript
// In useAzkarCounters.ts
// After each increment/decrement, counters are saved asynchronously
// Storage key: 'azkarCounters'
```

---

## 8. Testing the Integration

### Test 1: Basic Rendering

```typescript
// Should render without errors
<Sidebar />
```

### Test 2: Theme Sync

1. Open sidebar in popup window
2. Open another extension page (settings)
3. Change theme
4. Verify sidebar updates instantly

### Test 3: Azkar Counters

1. Click counter to increment
2. Refresh/reload
3. Counter should persist

### Test 4: Prayer Highlighting

1. Open sidebar during prayer time
2. Current prayer should be highlighted
3. Should auto-update every minute

---

## 9. Troubleshooting

### Issue: Sidebar doesn't open

**Solution:** Check that:

- `entrypoints/sidebar/index.tsx` is created
- `entrypoints/sidebar/sidebar.html` is created
- WXT config includes sidebar entrypoint
- Manifest has `windows` permission

### Issue: Theme doesn't sync

**Solution:** Check that:

- `listenForThemeChanges` is being called in sidebar
- Settings page sends message via `chrome.runtime.sendMessage`
- Storage key matches in both contexts

### Issue: Counters not persisting

**Solution:** Check that:

- `browser.storage.local` API is working
- Storage key is consistent: `azkarCounters`
- No storage quota exceeded

### Issue: Prayer times not highlighting

**Solution:** Check that:

- `usePrayerTimes` returns valid data
- `useRealtimePrayerTimes` is properly configured
- Current time is within prayer interval

---

## 10. Performance Tips

### Optimize Re-renders

```typescript
// Use memo for list items
export const PrayerItem = memo(
	function PrayerItem(props) {
		// Component code
	},
	(prev, next) => {
		return (
			prev.prayer.name === next.prayer.name &&
			prev.isHighlighted === next.isHighlighted
		);
	},
);
```

### Debounce Storage Writes

Already implemented in `useAzkarCounters.ts` and `useSectionState.ts`.

### Limit Update Frequency

```typescript
// Prayer check interval - every minute (not every second)
const { next } = useRealtimePrayerTimes({
	prayerTimes,
	enabled: true,
	checkInterval: 60000, // 1 minute
});
```

---

## 11. Future Enhancements

1. **Side Panel API** (Chrome 114+)
   - Replace popup window with side panel
   - Better UX with always-visible sidebar

2. **Azkar Progress Tracking**
   - Show overall daily completion %
   - Weekly/monthly statistics

3. **Notifications**
   - Prayer time reminders with custom sounds
   - Azkar streak notifications

4. **Export/Sync**
   - Backup azkar counts
   - Sync across devices

---

## 12. File Checklist

Before deploying, verify all files exist:

- ✅ `hooks/useAzkarCounters.ts`
- ✅ `hooks/useSectionState.ts`
- ✅ `entrypoints/components/Sidebar/Sidebar.tsx`
- ✅ `entrypoints/components/Sidebar/Sidebar.css`
- ✅ `entrypoints/components/Sidebar/sections/PrayerSection.tsx`
- ✅ `entrypoints/components/Sidebar/sections/AzkarSection.tsx`
- ✅ `entrypoints/components/Sidebar/shared/SectionHeader.tsx`
- ✅ `entrypoints/components/Sidebar/shared/ThemeToggle.tsx`
- ✅ `entrypoints/components/Sidebar/PrayerList/PrayerItem.tsx`
- ✅ `entrypoints/components/Sidebar/Azkar/AzkarItem.tsx`
- ✅ `entrypoints/components/Sidebar/Azkar/AzkarCounter.tsx`
- ✅ `entrypoints/components/OpenSidebarButton.tsx`
- ✅ `entrypoints/sidebar/index.tsx`
- ✅ `entrypoints/sidebar/sidebar.html`
- ✅ Updated `entrypoints/popup/App.tsx`
- ✅ Updated `utils/azkarContent.ts`

---

## 13. Next Steps

1. Update `utils/azkarContent.ts` with complete azkar data
2. Create sidebar entrypoint files
3. Add OpenSidebarButton to popup
4. Test rendering and interactions
5. Verify theme sync works
6. Test storage persistence
7. Deploy and monitor
