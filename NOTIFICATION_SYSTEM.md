# Customizable Notification System - Architecture Guide

## Overview

Your prayer times extension now has a fully customizable notification system that gives users complete control over which prayers they want to be notified for.

### Key Features

✅ **Master Toggle** - Enable/disable all notifications globally  
✅ **Per-Prayer Control** - Individual checkboxes for each prayer (Fajr, Dhuhr, Asr, Maghrib, Isha)  
✅ **Real-Time Sync** - Changes instantly sync across all pages  
✅ **Smart Scheduling** - Alarms automatically reschedule when settings change  
✅ **Chrome APIs** - Uses `chrome.alarms`, `chrome.notifications`, `chrome.storage`  
✅ **No Duplicates** - Prevents duplicate alarms through intelligent cleanup

---

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────┐
│              UI Layer (React Components)             │
│  ┌─────────────────────────────────────────────────┐│
│  │ OptionsApp.tsx                                   ││
│  │ + Imports NotificationSettings component         ││
│  │ + Displays all settings in options page          ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ NotificationSettings.tsx                         ││
│  │ + Master toggle (enable/disable all)             ││
│  │ + Per-prayer checkboxes                          ││
│  │ + Sound & vibration options                      ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           React Hook Layer                           │
│  ┌─────────────────────────────────────────────────┐│
│  │ useNotificationSettings.ts                      ││
│  │ + Manages notification state                     ││
│  │ + Listens for storage changes                    ││
│  │ + Syncs across pages via messages               ││
│  │ + Provides toggle methods                        ││
│  │                                                  ││
│  │ Returns: {                                       ││
│  │   settings,         // Current notification prefs││
│  │   toggleMaster,     // Enable/disable all        ││
│  │   togglePrayer,     // Enable/disable specific   ││
│  │   isLoading,                                     ││
│  │   notifiablePrayers // [Fajr, Dhuhr, ...]       ││
│  │ }                                                ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│          Service Layer (Business Logic)              │
│  ┌─────────────────────────────────────────────────┐│
│  │ NotificationService (Static Methods)            ││
│  │ + getSettings() - Load from storage              ││
│  │ + saveSettings() - Persist to storage            ││
│  │ + toggleMaster() - Master switch                 ││
│  │ + togglePrayer() - Per-prayer control            ││
│  │ + shouldNotify() - Check if prayer enabled       ││
│  │ + filterPrayersForNotification() - Smart filter  ││
│  │ + showNotification() - Display browser alert     ││
│  │ + getAlarmName() - Consistent alarm naming       ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ NotificationScheduler (Enhanced)                ││
│  │ + scheduleAll() - Uses NotificationService      ││
│  │ + scheduleP rayer() - Single prayer              ││
│  │ + clearAll() - Remove all alarms                 ││
│  │ + rescheduleAll() - Called on settings change    ││
│  │ + Uses filter to respect user preferences       ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│     Chrome Storage & Alarms                          │
│  ┌─────────────────────────────────────────────────┐│
│  │ chrome.storage.local.{                          ││
│  │   notificationSettings: {                       ││
│  │     enabled: boolean,                            ││
│  │     prayers: {                                   ││
│  │       Fajr: boolean,                             ││
│  │       Dhuhr: boolean,                            ││
│  │       Asr: boolean,                              ││
│  │       Maghrib: boolean,                          ││
│  │       Isha: boolean                              ││
│  │     },                                           ││
│  │     sound: boolean,                              ││
│  │     vibration: boolean                           ││
│  │   }                                              ││
│  │ }                                                ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ chrome.alarms {                                 ││
│  │   prayer-Fajr,                                   ││
│  │   prayer-Dhuhr,                                  ││
│  │   ... (only for enabled prayers)                 ││
│  │ }                                                ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           Background Service Worker                  │
│  ┌─────────────────────────────────────────────────┐│
│  │ background.ts                                   ││
│  │ + Listens for alarm triggers                     ││
│  │ + Listens for storage changes                    ││
│  │ + Listens for message events                     ││
│  │ + Triggers NotificationService.showNotification()││
│  │ + Reschedules on settings/prayer time change     ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│      Chrome Notifications API                        │
│  ┌─────────────────────────────────────────────────┐│
│  │ browser.notifications.create()                  ││
│  │ + Shows system notification                      ││
│  │ + Prayer name, time, and buttons                 ││
│  │ + Click opens popup                              ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## Data Flow

### User Changes Notification Setting

```
User unchecks "Dhuhr" in OptionsApp
         ↓
NotificationSettings component calls togglePrayer('Dhuhr', false)
         ↓
useNotificationSettings hook:
  - Calls NotificationService.togglePrayer()
  - Saves to chrome.storage.local['notificationSettings']
  - Broadcasts RESCHEDULE_ALARMS message to background
         ↓
Storage change listener triggers in:
  - background.ts → reschedules all alarms
  - Other popup/options pages (via listener) → sync state
         ↓
NotificationScheduler.scheduleAll():
  - Gets filtered prayer list from NotificationService.filterPrayersForNotification()
  - Clears prayer-Dhuhr alarm
  - Other prayer alarms remain scheduled
         ↓
✅ User no longer gets Dhuhr notifications
✅ All pages sync immediately
```

### Prayer Time Arrives

```
chrome.alarms triggers "prayer-Fajr"
         ↓
background.ts handleAlarm():
  - Extracts prayer name: NotificationService.getPrayerNameFromAlarm()
  - Calls: NotificationService.showNotification('Fajr')
         ↓
NotificationService.showNotification():
  - Checks if notifications.enabled === true
  - Creates chrome notification
  - Plays sound (if enabled)
  - Triggers vibration (if enabled)
  - Sets auto-clear timeout
         ↓
User clicks notification
         ↓
browser.notifications.onClicked listener:
  - Opens popup
  - Clears notification
         ↓
✅ User sees prayer time alert in popup
```

---

## Storage Structure

### notificationSettings (in chrome.storage.local)

```typescript
{
  enabled: boolean,           // Master toggle
  prayers: {
    Fajr: boolean,           // Individual prayer toggles
    Dhuhr: boolean,
    Asr: boolean,
    Maghrib: boolean,
    Isha: boolean
  },
  sound: boolean,            // Sound notification
  vibration: boolean         // Vibration feedback
}
```

### Default Settings

```typescript
DEFAULT_NOTIFICATION_SETTINGS = {
	enabled: true,
	prayers: {
		Fajr: true,
		Sunrise: false, // Never notifiable
		Dhuhr: true,
		Asr: true,
		Maghrib: true,
		Isha: true,
	},
	sound: true,
	vibration: true,
};
```

---

## How It Works: Step by Step

### 1. Master Toggle (Enable/Disable All Notifications)

**User Action:** Toggle master switch in OptionsApp

**Process:**

```
1. User clicks master toggle
2. NotificationSettings calls toggleMaster(true/false)
3. useNotificationSettings hook:
   - Calls NotificationService.toggleMaster()
   - Updates settings.enabled
   - Saves to chrome.storage.local
4. Broadcast message: RESCHEDULE_ALARMS
5. Background receives message:
   - If enabled=true: scheduleAll()
   - If enabled=false: clearAll()
```

**Result:**

- All alarms clear or reschedule
- User no longer receives any notifications (if disabled)
- All pages sync immediately

---

### 2. Per-Prayer Control

**User Action:** Uncheck "Dhuhr" in NotificationSettings

**Process:**

```
1. User clicks checkbox for Dhuhr
2. NotificationSettings calls togglePrayer('Dhuhr', false)
3. useNotificationSettings hook:
   - Calls NotificationService.togglePrayer()
   - Updates settings.prayers['Dhuhr'] = false
   - Saves to chrome.storage.local
4. Broadcast message: RESCHEDULE_ALARMS
5. Background receives message:
   - Calls notificationScheduler.scheduleAll(prayerTimes)
   - filterPrayersForNotification() excludes Dhuhr
   - Clears prayer-Dhuhr alarm
   - Keeps other alarms
```

**Result:**

- Only Dhuhr alarm is cleared
- Fajr, Asr, Maghrib, Isha alarms remain
- User gets notifications for all except Dhuhr

---

### 3. Real-Time Sync Across Pages

**Scenario:** User changes settings in OptionsApp while PopupApp is open

**Process:**

```
1. OptionsApp calls togglePrayer('Asr', false)
2. Storage change event fires:
   - OptionsApp: Updates local state
   - PopupApp: Has storage listener that updates state
   - Background: Reschedules alarms
3. All listeners fire:
   - browser.storage.onChanged (background & all pages)
   - browser.runtime.onMessage (for NOTIFICATION_SETTINGS_CHANGED)
```

**Result:**

- ✅ OptionsApp updates immediately
- ✅ PopupApp sees change without refresh
- ✅ Background reschedules alarms
- ✅ No need to close/reopen pages

---

### 4. Daily Update & Reschedule

**Scenario:** Daily prayer times are refreshed at midnight

**Process:**

```
1. Daily alarm "dailyPrayerUpdate" triggers at midnight
2. background.ts handleAlarm():
   - Calls updateAllPrayerTimes()
   - Fetches new prayer times for location
   - Calls notificationScheduler.scheduleAll(newTimes)
3. scheduleAll():
   - Clears all old prayer alarms
   - filterPrayersForNotification() applies user preferences
   - Schedules new alarms with new times
   - Reschedules daily update for next midnight
```

**Result:**

- ✅ Prayer times refreshed daily
- ✅ Alarms rescheduled to new times
- ✅ User preferences still respected
- ✅ No duplicate alarms

---

## Preventing Duplicate Alarms

### Strategy

The system prevents duplicates through:

1. **Always Clear Before Schedule**

   ```typescript
   async scheduleAll(prayerTimes) {
     await this.clearAll();  // ← Clears ALL prayer alarms first
     // ... then schedule new ones
   }
   ```

2. **Unique Alarm Names**

   ```typescript
   const alarmName = `prayer-${prayerName}`; // prayer-Fajr, prayer-Dhuhr, etc.
   ```

3. **Smart Filtering**

   ```typescript
   // Only schedule prayers user wants
   const prayersToNotify =
   	await NotificationService.filterPrayersForNotification(times);
   ```

4. **Reschedule on Every Change**
   - Settings change? → Reschedule
   - Location change? → Reschedule
   - Prayer times updated? → Reschedule
   - Extension startup? → Reschedule

### Why This Works

- **No accidental duplicates:** Always clear old alarms before creating new ones
- **Consistent state:** Storage is the single source of truth
- **Edge case handling:** Works even if browser crashes/restarts

---

## Files & Responsibilities

| File                                                      | Responsibility                           |
| --------------------------------------------------------- | ---------------------------------------- |
| `types/notifications.ts`                                  | Type definitions and defaults            |
| `api/services/notificationService.ts`                     | All notification logic (static)          |
| `hooks/useNotificationSettings.ts`                        | React hook for UI components             |
| `entrypoints/components/options/NotificationSettings.tsx` | UI component with toggles                |
| `utils/notificationScheduler.ts`                          | Alarm scheduling with filters            |
| `entrypoints/background.ts`                               | Background event handling                |
| `entrypoints/options/OptionsApp.tsx`                      | Options page (uses NotificationSettings) |

---

## Usage Examples

### In Options Page

```tsx
import NotificationSettings from "@/components/options/NotificationSettings";

export default function OptionsApp() {
	return (
		<section>
			<h2>Notifications</h2>
			<NotificationSettings /> {/* Handles everything */}
		</section>
	);
}
```

### In Custom Component

```tsx
import { useNotificationSettings } from "@/hooks/useNotificationSettings";

export function MyComponent() {
	const { settings, toggleMaster, togglePrayer, notifiablePrayers, isEnabled } =
		useNotificationSettings();

	return (
		<div>
			<label>
				<input
					type="checkbox"
					checked={settings.enabled}
					onChange={(e) => toggleMaster(e.target.checked)}
				/>
				Enable Notifications
			</label>

			{settings.enabled && (
				<div>
					{notifiablePrayers.map((prayer) => (
						<label key={prayer}>
							<input
								type="checkbox"
								checked={isEnabled(prayer)}
								onChange={(e) => togglePrayer(prayer, e.target.checked)}
							/>
							{prayer}
						</label>
					))}
				</div>
			)}
		</div>
	);
}
```

---

## Best Practices Implemented

✅ **Single Source of Truth** - Settings stored once in chrome.storage  
✅ **Clear Before Schedule** - Always clear old alarms before creating new  
✅ **Stateless Filtering** - Notification preferences don't affect prayer times  
✅ **Instant Sync** - All pages see changes immediately  
✅ **Error Resilient** - Handles browser restarts and crashes  
✅ **Type Safe** - Full TypeScript support  
✅ **Testable** - Service layer separated from UI

---

## Future Enhancements

Possible additions:

1. **Snooze Functionality**
   - Delay notification by 5/10/15 minutes
   - Remember last snooze time

2. **Quiet Hours**
   - Don't notify between X and Y time
   - Weekend vs weekday rules

3. **Notification Sounds**
   - Choose from multiple sound options
   - Upload custom notification audio

4. **Do Not Disturb Integration**
   - Skip notifications during meetings (calendar integration)

5. **Late Notification**
   - Notify again if user missed prayer (15 min later)

6. **Notification History**
   - View past 20 notifications received
   - Replay any specific prayer notification

7. **Groups**
   - Group prayers: "Morning Prayers" (Fajr)
   - Group prayers: "Afternoon/Evening Prayers" (Dhuhr-Isha)

---

## Testing Checklist

- [ ] Master toggle disables all notifications
- [ ] Individual prayer toggles work
- [ ] Settings sync across tabs
- [ ] Settings sync across windows
- [ ] Extension restart preserves settings
- [ ] New prayers inherit notification status
- [ ] No duplicate alarms on reschedule
- [ ] Sound plays (if enabled)
- [ ] Vibration triggers (if enabled)
- [ ] Notification click opens popup
- [ ] Notification auto-clears after 10s
- [ ] Settings persist after browser close
