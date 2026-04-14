# Sidebar Architecture Guide

## Overview

This guide provides the recommended structure for implementing a React-based sidebar in the My Prayer Chrome extension, with proper state management, theme syncing, and performance optimization.

---

## 1. Component Structure

```
components/
├── Sidebar/
│   ├── Sidebar.tsx (Main container)
│   ├── Sidebar.css
│   ├── sections/
│   │   ├── PrayerSection.tsx
│   │   └── AzkarSection.tsx
│   └── shared/
│       ├── SectionToggle.tsx
│       ├── ThemeToggle.tsx
│       └── SectionHeader.tsx
├── PrayerList/
│   ├── PrayerList.tsx
│   ├── PrayerItem.tsx
│   └── PrayerItem.css
├── Azkar/
│   ├── AzkarTabs.tsx
│   ├── AzkarItem.tsx
│   ├── AzkarCounter.tsx
│   └── Azkar.css
└── OpenSidebarButton.tsx
```

---

## 2. State Management Strategy

### 2.1 Azkar Counter State

**Location:** `hooks/useAzkarCounters.ts`

Manages azkar counter state with persistence:

```typescript
interface AzkarCounter {
	id: string;
	currentCount: number;
	originalCount: number;
}

interface UseAzkarCountersReturn {
	counters: Map<string, AzkarCounter>;
	increment: (id: string) => void;
	reset: (id: string) => void;
	resetAll: () => void;
	isLoading: boolean;
}
```

**Storage Key:** `azkarCounters` in `browser.storage.local`

**Persistence Strategy:**

- Save counts after every change (debounced for performance)
- Load on component mount
- Clear daily (optional - depends on UX requirements)

### 2.2 Prayer Highlighting

**Location:** `hooks/useCurrentPrayer.ts`

Manages current/next prayer highlighting:

```typescript
interface UseCurrentPrayerReturn {
	currentPrayer: PrayerTime | null;
	nextPrayer: PrayerTime | null;
	progress: number; // 0-100 for progress bar
	timeUntilNext: number; // seconds
}
```

**Auto-updates:** Check every 60 seconds (configurable)

### 2.3 Section State (Collapse/Expand)

**Location:** Updates to existing `sidebar.js` logic or new `hooks/useSectionState.ts`

```typescript
interface UseSectionStateReturn {
	expandedSections: Set<string>;
	toggleSection: (sectionId: string) => void;
	isExpanded: (sectionId: string) => boolean;
}
```

**Storage Key:** `sectionStates` in `browser.storage.local`

### 2.4 Theme Management

**Already exists:** Use existing `useTheme()` hook

```typescript
const { theme, setTheme, toggleTheme } = useTheme();
```

---

## 3. Cross-Component Communication

### 3.1 Theme Sync Across Extension

```typescript
// In themeManager.ts - already exists
export function listenForThemeChanges(
	callback: (theme: ThemeType) => void,
	storageKey: string = "settings",
): () => void {
	// Setup listener for storage changes
	// Returns unsubscribe function
}
```

**Usage in Sidebar:**

```typescript
useEffect(() => {
	const unsubscribe = listenForThemeChanges((newTheme) => {
		// DOM updates automatically via class change
	});

	return unsubscribe;
}, []);
```

### 3.2 Real-time Updates via Message Passing

Use Chrome's message passing for cross-context updates:

```typescript
// Send from:  settings page
chrome.runtime.sendMessage({
	type: "THEME_CHANGED",
	payload: { theme: "dark" },
});

// Listen in: sidebar
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "THEME_CHANGED") {
		applyThemeToDOM(message.payload.theme);
	}
});
```

---

## 4. Implementation Patterns

### 4.1 Hooks Organization

```
hooks/
├── useAzkarCounters.ts      (Counter state + persistence)
├── useCurrentPrayer.ts       (Prayer highlighting + auto-update)
├── useSectionState.ts        (Section collapse/expand)
└── ... (existing hooks)
```

### 4.2 Service Layer Updates

```
api/services/
├── azkarService.ts           (Load/save azkar data)
└── ... (existing services)
```

### 4.3 Context Usage (Optional - for deeply nested components)

If needed, create a SidebarContext for providing theme & prayer data:

```typescript
// contexts/SidebarContext.tsx
const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }) {
  const { theme } = useTheme();
  const { currentPrayer, nextPrayer } = useCurrentPrayer();

  return (
    <SidebarContext.Provider value={{ theme, currentPrayer, nextPrayer }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('Use within SidebarProvider');
  return context;
};
```

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│         Chrome Extension Popup Window               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  <Sidebar />                                 │  │
│  │  ├─ useTheme() ─────→ [Theme State]          │  │
│  │  ├─ useCurrentPrayer() → [Prayer State]      │  │
│  │  ├─ useAzkarCounters() → [Counter State]     │  │
│  │  │                                           │  │
│  │  ├─ <PrayerSection>                          │  │
│  │  │  └─ <PrayerList> ──→ Highlighted Item    │  │
│  │  │                                           │  │
│  │  └─ <AzkarSection>                           │  │
│  │     ├─ <AzkarTabs>                           │  │
│  │     └─ <AzkarItem>                           │  │
│  │        └─ <AzkarCounter> ─→ +/- Actions     │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│         │                                          │
│         ├─→ browser.storage.local (Persistence)   │
│         ├─→ chrome.runtime.onMessage (Sync)       │
│         └─→ listenForThemeChanges (Theme Sync)    │
│                                                     │
└─────────────────────────────────────────────────────┘
         │
         ↓
    ┌─────────────────────────┐
    │  Settings Page/Options  │
    │  (Theme Toggle)         │
    │       ↓                 │
    │  Apply + Save Theme     │
    │       ↓                 │
    │  Send Message to Popup  │
    └─────────────────────────┘
```

---

## 6. Performance Optimization

### 6.1 Debouncing Counter Updates

```typescript
// Only save to storage after 1 second of inactivity
const debouncedSave = useCallback(
	debounce((counts: AzkarCounter[]) => {
		browser.storage.local.set({ azkarCounters: counts });
	}, 1000),
	[],
);
```

### 6.2 Memoization

```typescript
const PrayerListMemo = memo(PrayerList, (prev, next) => {
	// Only re-render if prayer times actually changed
	return JSON.stringify(prev.prayers) === JSON.stringify(next.prayers);
});
```

### 6.3 Efficient Re-renders

- Split state into smaller, focused hooks
- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations
- Avoid unnecessary context updates

---

## 7. OpenSidebar Button Implementation

### 7.1 Placement Options

**Option A: In Popup (if sidebar is separate window)**

```typescript
<button onClick={() => chrome.windows.create({ url: 'sidebar.html' })}>
  Open Sidebar
</button>
```

**Option B: In SidePanel (Chrome 114+)**

- Use `sidePanel` in manifest.json
- Automatically manages panel state

**Option C: Toggle Within Popup**

```typescript
const [sidebarOpen, setSidebarOpen] = useState(false);
return sidebarOpen ? <Sidebar /> : <button onClick={() => setSidebarOpen(true)}>Open</button>;
```

### 7.2 Button Component

```typescript
// components/OpenSidebarButton.tsx
export function OpenSidebarButton() {
  const handleOpen = () => {
    // Option A: New Window
    chrome.windows.create({
      url: chrome.runtime.getURL('sidebar.html'),
      type: 'popup',
      width: 380,
      height: 600
    });

    // Option B: Side Panel (if using manifest v3)
    // chrome.sidePanel.open({ tabId: (await chrome.tabs.query({ active: true }))[0].id });
  };

  return (
    <button
      onClick={handleOpen}
      className="fixed bottom-4 right-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg"
    >
      📖 Open Sidebar
    </button>
  );
}
```

---

## 8. Theme Syncing Implementation

### 8.1 Full Example Flow

```typescript
// 1. User changes theme in settings
const handleThemeToggle = async () => {
	const newTheme = theme === "light" ? "dark" : "light";
	await setTheme(newTheme); // Saves to storage + updates DOM

	// 2. Send message to other contexts
	chrome.runtime.sendMessage({
		type: "THEME_CHANGED",
		payload: { theme: newTheme },
	});
};

// 3. Sidebar listens for message
useEffect(() => {
	const handleMessage = (message, sender, sendResponse) => {
		if (message.type === "THEME_CHANGED") {
			setTheme(message.payload.theme);
		}
	};

	chrome.runtime.onMessage.addListener(handleMessage);
	return () => chrome.runtime.onMessage.removeListener(handleMessage);
}, []);

// 4. Also listen for storage changes (for direct updates)
useEffect(() => {
	const unsubscribe = listenForThemeChanges((newTheme) => {
		applyThemeToDOM(newTheme);
	});
	return unsubscribe;
}, []);
```

---

## 9. Storage Schema

### 9.1 Data Structure

```typescript
// browser.storage.local
{
  "settings": {
    "theme": "light",
    "language": "en",
    "notifications": true
    // ... other settings
  },
  "azkarCounters": {
    "morning_01": { id: "morning_01", currentCount: 7, originalCount: 10 },
    "morning_02": { id: "morning_02", currentCount: 0, originalCount: 33 },
    "evening_01": { id: "evening_01", currentCount: 12, originalCount: 33 }
    // ... more counters
  },
  "sectionStates": {
    "prayerTimesHeader": "open",
    "azkarHeader": "open"
  },
  "prayerData": { /* existing prayer data */ },
  "coordinates": { /* existing coordinates */ }
}
```

---

## 10. Best Practices for Chrome Extensions

### 10.1 Content Security Policy

- No inline scripts
- Use module imports
- Separate CSS files

### 10.2 Message Passing

```typescript
// Always validate sender for security
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// Verify sender is from extension
	if (sender.id !== chrome.runtime.id) return;

	if (message.type === "THEME_CHANGED") {
		// Handle safely
	}
});
```

### 10.3 Storage Persistence

- Use `browser.storage.local` instead of localStorage
- Handles permissions properly
- Data persists across sessions
- Can be synced across devices with `browser.storage.sync`

### 10.4 Performance

- Debounce storage writes
- Batch multiple state updates
- Use `requestIdleCallback` for non-critical updates
- Avoid large payloads in messages

---

## 11. Testing Considerations

### 11.1 Unit Tests

```typescript
describe("useAzkarCounters", () => {
	it("should initialize from storage", async () => {
		// Mock browser.storage.local.get
		// Assert counters are loaded correctly
	});

	it("should debounce saves", async () => {
		// Mock browser.storage.local.set
		// Verify only called once after debounce period
	});
});
```

---

## Next Steps

1. Create hooks for counter state management
2. Implement sidebar component structure
3. Add theme sync listeners
4. Set up storage persistence
5. Test cross-component communication
6. Optimize re-renders with React DevTools Profiler
