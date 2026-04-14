# Advanced Patterns & Examples

This document provides detailed examples and patterns for working with the Sidebar architecture in your Chrome extension.

---

## 1. Theme Syncing Across Contexts

### Pattern 1A: Storage-Based Sync (Automatic)

The simplest approach - listeners automatically detect storage changes:

```typescript
// File: utils/themeManager.ts (Already exists, showing usage)

export async function listenForThemeChanges(
	callback: (theme: ThemeType) => void,
	storageKey: string = "settings",
): Promise<() => void> {
	const handleStorageChange = (changes: Record<string, any>) => {
		if (changes[storageKey]?.newValue?.theme) {
			callback(changes[storageKey].newValue.theme);
		}
	};

	browser.storage.onChanged.addListener(handleStorageChange);

	return () => browser.storage.onChanged.removeListener(handleStorageChange);
}
```

**Usage in Sidebar:**

```typescript
// In Sidebar.tsx or any component
useEffect(() => {
	const unsubscribe = listenForThemeChanges((newTheme) => {
		applyThemeToDOM(newTheme);
	}, "settings");

	return unsubscribe;
}, []);
```

**Pros:**

- Automatic, no manual messaging needed
- Works across all contexts (popup, options, content scripts)
- Reliable and tested

**Cons:**

- Slight delay (milliseconds) in propagation

---

### Pattern 1B: Message-Based Sync (Explicit)

For immediate, explicit control:

```typescript
// In settings/options page when theme changes
const handleThemeToggle = async () => {
	const newTheme = theme === "light" ? "dark" : "light";

	// 1. Save to storage
	await setTheme(newTheme);

	// 2. Send explicit message to other contexts
	try {
		const tabs = await chrome.tabs.query({});
		tabs.forEach((tab) => {
			if (tab.id) {
				chrome.tabs
					.sendMessage(tab.id, {
						type: "THEME_CHANGED",
						payload: { theme: newTheme },
					})
					.catch(() => {}); // Ignore tabs without message listener
			}
		});
	} catch (error) {
		console.error("Failed to send theme message:", error);
	}
};

// In Sidebar or other components
useEffect(() => {
	const handleMessage = (message: any, sender: any, sendResponse: any) => {
		if (message.type === "THEME_CHANGED") {
			applyThemeToDOM(message.payload.theme);
		}
	};

	chrome.runtime.onMessage.addListener(handleMessage);
	return () => chrome.runtime.onMessage.removeListener(handleMessage);
}, []);
```

**Pros:**

- Explicit control
- Immediate propagation
- Good for debugging

**Cons:**

- Requires both storage AND messaging setup
- More boilerplate

---

## 2. State Management Examples

### Example 2.1: Managing Azkar Counters

```typescript
// Usage in AzkarSection.tsx
function AzkarSection({ isExpanded, onToggle }: Props) {
  const { counters, increment, reset, resetAll } = useAzkarCounters();

  return (
    <div className="azkar-section">
      {/* ... */}

      {activeAzkarItems.map(azkar => {
        const counterId = `${activeTab}_${azkar.id}`;
        const counter = counters.get(counterId);

        return (
          <AzkarItem
            key={counterId}
            azkar={azkar}
            currentCount={counter?.currentCount ?? azkar.count}
            onIncrement={() => increment(counterId)}
            onReset={() => reset(counterId)}
          />
        );
      })}

      <button onClick={resetAll}>Reset All</button>
    </div>
  );
}
```

### Example 2.2: Initializing Counters

When displaying azkar for the first time, counters are auto-created:

```typescript
// In useAzkarCounters.ts
const increment = useCallback((id: string) => {
	setCounters((prev) => {
		const updated = new Map(prev);

		// Auto-create counter if doesn't exist
		if (!updated.has(id)) {
			updated.set(id, {
				id,
				currentCount: 0,
				originalCount: 0, // Should be set by the caller
			});
		}

		const counter = updated.get(id)!;
		if (counter.currentCount > 0) {
			updated.set(id, {
				...counter,
				currentCount: counter.currentCount - 1,
			});
		}

		saveCounters(updated);
		return updated;
	});
}, []);
```

**Better approach - Initialize on render:**

```typescript
// In AzkarSection.tsx
useEffect(() => {
	activeAzkarItems.forEach((azkar) => {
		const counterId = `${activeTab}_${azkar.id}`;

		// Pre-create counter with original count
		if (!counters.has(counterId)) {
			// This will trigger on first render of new tab
			setCounters((prev) => {
				const updated = new Map(prev);
				updated.set(counterId, {
					id: counterId,
					currentCount: azkar.count,
					originalCount: azkar.count,
				});
				return updated;
			});
		}
	});
}, [activeTab, activeAzkarItems, counters]);
```

---

## 3. Prayer Highlighting Logic

### Example 3.1: Current vs Next Prayer

```typescript
// In PrayerSection.tsx
const styledPrayerItems = useMemo(() => {
	return prayerTimes.map((prayer) => {
		const isCurrentPrayer = next?.name === prayer.name;
		const isPastPrayer = previous?.name === prayer.name;

		return {
			...prayer,
			isHighlighted: isCurrentPrayer,
			isPast: isPastPrayer,
			progress: isCurrentPrayer ? progress : undefined,
		};
	});
}, [prayerTimes, next, previous, progress]);
```

### Example 3.2: Progress Bar Implementation

```typescript
// In PrayerItem.tsx
{isHighlighted && progress !== undefined && (
  <div className="prayer-progress">
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{
          width: `${Math.min(progress, 100)}%`,
          transition: 'width 1s linear'
        }}
      />
    </div>
    <span className="progress-percent">
      {Math.round(progress)}% until next prayer
    </span>
  </div>
)}
```

---

## 4. Storage Persistence Patterns

### Pattern 4.1: Debounced Saves

```typescript
// In useAzkarCounters.ts - Already implemented with this approach

import { useCallback } from "react";

const saveCounters = useCallback(
	async (newCounters: Map<string, AzkarCounter>) => {
		try {
			const countersObj = Object.fromEntries(newCounters);
			await browser.storage.local.set({
				azkarCounters: countersObj,
			});
		} catch (err) {
			console.error("Failed to save:", err);
		}
	},
	[],
);

// Usage with debounce utility
const debouncedSave = useMemo(
	() => debounce(saveCounters, 500),
	[saveCounters],
);

const increment = useCallback(
	(id: string) => {
		setCounters((prev) => {
			const updated = new Map(prev);
			// ... update counter
			debouncedSave(updated); // Called but debounced
			return updated;
		});
	},
	[debouncedSave],
);
```

### Pattern 4.2: Batch Updates

```typescript
// Save multiple counters at once
const resetAll = useCallback(() => {
	setCounters((prev) => {
		const updated = new Map();

		prev.forEach((counter, id) => {
			updated.set(id, {
				...counter,
				currentCount: counter.originalCount,
			});
		});

		// Single save operation for all counters
		saveCounters(updated);
		return updated;
	});
}, [saveCounters]);
```

---

## 5. Performance Optimization Examples

### Example 5.1: Memoization with Custom Comparator

```typescript
// In AzkarItem.tsx - Prevent re-renders
export const AzkarItem = memo(
  function AzkarItem({ azkar, currentCount, onIncrement, onReset }) {
    return (
      // Component JSX
    );
  },
  // Custom comparison function
  (prevProps, nextProps) => {
    // Return true if props are equal (no re-render)
    // Return false if different (re-render)
    return (
      prevProps.currentCount === nextProps.currentCount &&
      prevProps.azkar.id === nextProps.azkar.id &&
      prevProps.onIncrement === nextProps.onIncrement
    );
  }
);
```

### Example 5.2: useCallback for Event Handlers

```typescript
// In AzkarSection.tsx
const handleIncrement = useCallback((counterId: string) => {
  increment(counterId);
}, [increment]); // Only recreate if increment function changes

const handleReset = useCallback((counterId: string) => {
  reset(counterId);
}, [reset]);

// Pass stable references to memoized children
<AzkarItem
  onIncrement={() => handleIncrement(counterId)}
  onReset={() => handleReset(counterId)}
/>
```

### Example 5.3: useMemo for Expensive Computations

```typescript
// In PrayerSection.tsx
const styledPrayerItems = useMemo(() => {
	console.log("Recalculating prayer items"); // Only logs when deps change

	return prayerTimes.map((prayer) => ({
		...prayer,
		isHighlighted: next?.name === prayer.name,
		isCurrent: next?.name === prayer.name,
	}));
}, [prayerTimes, next]); // Only recalculate if these change
```

---

## 6. Error Handling Patterns

### Pattern 6.1: Storage Errors

```typescript
// In useAzkarCounters.ts
const saveCounters = useCallback(
	async (newCounters: Map<string, AzkarCounter>) => {
		try {
			const countersObj = Object.fromEntries(newCounters);
			await browser.storage.local.set({
				azkarCounters: countersObj,
			});
		} catch (err) {
			if (
				err instanceof TypeError &&
				err.message.includes("QuotaExceededError")
			) {
				console.error("Storage quota exceeded");
				setError(new Error("Storage full - please reset some counters"));

				// Optionally: Notify user or implement cleanup
			} else {
				console.error("Failed to save counters:", err);
				setError(err instanceof Error ? err : new Error("Save failed"));
			}
		}
	},
	[],
);
```

### Pattern 6.2: API Errors in Prayer Loading

```typescript
// In PrayerSection.tsx
if (isLoading) {
  return <LoadingSkeleton />;
}

if (error) {
  return (
    <div className="section prayer-section">
      <SectionHeader title="Prayer Times" />
      <div className="error-state">
        <p>⚠️ Error loading prayer times</p>
        <p>{error.message}</p>
        <button onClick={() => refresh()}>Retry</button>
      </div>
    </div>
  );
}
```

---

## 7. Message Passing Examples

### Example 7.1: One-Way Messages

```typescript
// Sender (e.g., options page)
chrome.tabs.query({}, (tabs) => {
	tabs.forEach((tab) => {
		if (tab.id) {
			chrome.tabs
				.sendMessage(tab.id, {
					type: "SETTINGS_CHANGED",
					payload: { language: "ar" },
				})
				.catch(() => {}); // Ignore errors
		}
	});
});

// Receiver (e.g., sidebar or popup)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "SETTINGS_CHANGED") {
		console.log("Settings changed:", message.payload);
		// Handle change
	}
});
```

### Example 7.2: Two-Way Messages (Request-Response)

```typescript
// Sender - wait for response
chrome.runtime.sendMessage({ type: "GET_CURRENT_THEME" }, (response) => {
	if (response) {
		console.log("Current theme:", response.theme);
	}
});

// Receiver - send response
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "GET_CURRENT_THEME") {
		sendResponse({ theme: getCurrentTheme() });
	}
});
```

---

## 8. Testing Examples

### Example 8.1: Mocking browser.storage

```typescript
// jest.config.js
global.browser = {
	storage: {
		local: {
			get: jest.fn(async (keys) => {
				// Mock implementation
				return {};
			}),
			set: jest.fn(async (items) => {
				// Mock implementation
			}),
		},
		onChanged: {
			addListener: jest.fn(),
			removeListener: jest.fn(),
		},
	},
};
```

### Example 8.2: Testing useAzkarCounters

```typescript
// __tests__/useAzkarCounters.test.ts
import { renderHook, act } from "@testing-library/react";
import { useAzkarCounters } from "@/hooks/useAzkarCounters";

describe("useAzkarCounters", () => {
	it("should increment counter", async () => {
		const { result } = renderHook(() => useAzkarCounters());

		act(() => {
			result.current.counters.set("test-1", {
				id: "test-1",
				currentCount: 5,
				originalCount: 10,
			});

			result.current.increment("test-1");
		});

		expect(result.current.counters.get("test-1")?.currentCount).toBe(4);
	});
});
```

---

## 9. Browser Compatibility

### Chrome vs Firefox Differences

```typescript
// In utils - Use compatible API
const getStorage = () => {
	if (typeof browser !== "undefined") {
		return browser.storage; // Firefox
	}
	return chrome.storage; // Chrome
};

const getMessage = (callback: Function) => {
	if (typeof browser !== "undefined") {
		return browser.runtime.onMessage.addListener(callback); // Firefox
	}
	return chrome.runtime.onMessage.addListener(callback); // Chrome
};
```

---

## 10. Accessibility Examples

### Example 10.1: ARIA Labels

```typescript
// In components
<button
  onClick={onToggle}
  aria-expanded={isExpanded}
  aria-label={`Toggle ${title} section`}
  title={isExpanded ? 'Collapse' : 'Expand'}
>
  {isExpanded ? '▼' : '▶'}
</button>
```

### Example 10.2: Keyboard Navigation

```typescript
// In counter component
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    // Handle as click
    onIncrement();
  }
};

<button
  onClick={onIncrement}
  onKeyDown={handleKeyDown}
  role="button"
  tabIndex={0}
>
  Increment
</button>
```

---

## 11. Real-World Use Cases

### Use Case 1: Daily Reset

```typescript
// Reset all azkar counters at midnight
const Daily_Reset_Key = "lastResetDate";

useEffect(() => {
	const checkAndReset = async () => {
		const today = new Date().toDateString();
		const lastReset = await browser.storage.local.get(Daily_Reset_Key);

		if (lastReset[Daily_Reset_Key] !== today) {
			resetAll(); // Reset all counters
			await browser.storage.local.set({
				[Daily_Reset_Key]: today,
			});
		}
	};

	checkAndReset();

	// Check every minute
	const interval = setInterval(checkAndReset, 60000);
	return () => clearInterval(interval);
}, [resetAll]);
```

### Use Case 2: Export/Import Data

```typescript
// Export all azkar data
const handleExport = async () => {
	const result = await browser.storage.local.get("azkarCounters");
	const data = JSON.stringify(result.azkarCounters || {});

	// Trigger download
	const element = document.createElement("a");
	element.setAttribute(
		"href",
		"data:text/plain;charset=utf-8," + encodeURIComponent(data),
	);
	element.setAttribute(
		"download",
		`azkar-backup-${new Date().toISOString()}.json`,
	);
	element.click();
};

// Import data
const handleImport = async (file: File) => {
	const text = await file.text();
	const data = JSON.parse(text);

	await browser.storage.local.set({
		azkarCounters: data,
	});

	// UI will update automatically
};
```

### Use Case 3: Statistics

```typescript
// Calculate completion percentage
const getCompletionStats = useCallback(async () => {
	const result = await browser.storage.local.get("azkarCounters");
	const counters = result.azkarCounters || {};

	const completed = Object.values(counters).filter(
		(c: any) => c.currentCount === 0,
	).length;

	const total = Object.keys(counters).length;
	const percentage = total > 0 ? (completed / total) * 100 : 0;

	return { completed, total, percentage };
}, []);
```

---

## 12. Debugging Tips

### Enable Debug Logging

```typescript
// utils/logger.ts
const DEBUG = true;

export const log = {
	info: (tag: string, message: string, data?: any) => {
		if (DEBUG) {
			console.log(`[${tag}] ${message}`, data || "");
		}
	},
	error: (tag: string, message: string, error?: any) => {
		console.error(`[${tag}] ${message}`, error || "");
	},
};

// Usage
log.info("AZKAR", "Counter updated", { id, newCount });
log.error("STORAGE", "Failed to save", error);
```

### Inspect Storage

```typescript
// In browser console
chrome.storage.local.get(null, (items) => {
	console.table(items);
});

// Clear storage
chrome.storage.local.clear(() => {
	console.log("Storage cleared");
});
```

---
