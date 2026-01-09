import { PrayerService } from '@/api/services/prayerService';
import { GeolocationService } from '@/api/services/geolocationService';
import { NotificationScheduler } from '@/utils/notificationScheduler';
import { DailyUpdater } from '@/utils/dailyUpdater';
import { PrayerTime } from '@/types/prayer';
import { Coordinates } from '@/types/api';
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  console.log('My Prayer Background Service Started');

  // Initialize services
  const prayerService = new PrayerService();
  const geolocationService = new GeolocationService();
  const notificationScheduler = new NotificationScheduler();
  const dailyUpdater = new DailyUpdater(prayerService);

  // Handle extension installation
  browser.runtime.onInstalled.addListener(handleInstallation);

  // Handle alarms (prayer notifications)
  browser.alarms.onAlarm.addListener(handleAlarm);

  // Listen for messages from popup
  browser.runtime.onMessage.addListener(handleMessages);

  // Listen for storage changes (notification toggle)
  browser.storage.onChanged.addListener(handleStorageChange);

  // Initialize on startup
  initializeBackgroundServices();
});

async function handleInstallation(details: Browser.runtime.InstalledDetails) {
  console.log('Installation reason:', details.reason);

  // Set side panel behavior
  // await Browser.sidePanel.setPanelBehavior({
  //   openPanelOnActionClick: true
  // });

  // if (details.reason === 'install') {
  //   // Show welcome page on first install
  //   await Browser.sidePanel.setOptions({
  //     path: 'sidepanel/welcome.html'
  //   });

    // Set default notification permission
    await browser.storage.local.set({
      options: { notification: false }
    });

    // Request notification permission
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  }

  // Schedule daily update
  scheduleDailyUpdate();

async function handleAlarm(alarm: Browser.alarms.Alarm) {
  if (alarm.name === 'dailyPrayerUpdate') {
    console.log('Daily update triggered');
    await updateAllPrayerTimes();
    scheduleDailyUpdate(); // Reschedule for next day
  } else if (alarm.name.startsWith('prayer-')) {
    const prayerName = alarm.name.replace('prayer-', '');
    await showPrayerNotification(prayerName);
  }
}

async function handleMessages(
  message: any,
  sender: Browser.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  console.log('Background received:', message.type);

  switch (message.type) {
    case 'GET_PRAYER_TIMES':
      try {
        const times = await getPrayerTimesForLocation();
        sendResponse({ success: true, data: times });
      } catch (error) {
        sendResponse({ success: false, error: (error as Error).message });
      }
      return true;

    case 'UPDATE_LOCATION':
      try {
        await updateLocation(message.coordinates);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'TOGGLE_NOTIFICATIONS':
      try {
        await toggleNotifications(message.enabled);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;

    case 'OPEN_SIDEPANEL':
      try {
        await openSidePanel(sender.tab?.windowId);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
  }
}

async function handleStorageChange(
  changes: { [key: string]: Browser.storage.StorageChange },
  areaName: string
) {
  if (areaName !== 'local') return;

  // Handle notification toggle
  if (changes.options?.newValue?.notification !== undefined) {
    const enabled = changes.options.newValue.notification;
    await toggleNotifications(enabled);
  }

  // Handle location changes
  if (changes.location) {
    await onLocationChange(changes.location.newValue);
  }
}

// ========== CORE FUNCTIONS ==========

async function initializeBackgroundServices() {
  console.log('Initializing background services...');

  try {
    // Load existing prayer times
    const hasData = await checkExistingData();

    if (!hasData) {
      await fetchInitialPrayerTimes();
    }

    // Set up notifications if enabled
    const options = await getOptions();
    if (options.notification) {
      await setupPrayerNotifications();
    }

    console.log('Background services initialized');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
}

async function getPrayerTimesForLocation(): Promise<PrayerTime[]> {
  const geolocationService = new GeolocationService();
  const prayerService = new PrayerService();

  try {
    // Get current location
    const coordinates = await geolocationService.getCurrentLocation();

    // Fetch prayer times
    const prayerTimes = await prayerService.getPrayerTimes(coordinates);

    return prayerTimes;
  } catch (error) {
    console.error('Failed to get prayer times:', error);

    // Try to return cached data
    const storage = await browser.storage.local.get('prayerTimes');
    return storage.prayerTimes || [];
  }
}

async function updateLocation(coordinates: Coordinates) {
  const geolocationService = new GeolocationService();
  const prayerService = new PrayerService();

  // Save location
  await geolocationService.setManualLocation(coordinates);

  // Update prayer times
  const prayerTimes = await prayerService.getPrayerTimes(coordinates, true);

  // Update notifications if enabled
  const options = await getOptions();
  if (options.notification) {
    await schedulePrayerNotifications(prayerTimes);
  }

  return prayerTimes;
}

async function toggleNotifications(enabled: boolean) {
  const notificationScheduler = new NotificationScheduler();

  if (enabled) {
    // Get current prayer times
    const prayerTimes = await getPrayerTimesForLocation();

    // Schedule notifications
    await notificationScheduler.scheduleAll(prayerTimes);

    console.log('Notifications enabled');
  } else {
    // Clear all prayer notifications
    await notificationScheduler.clearAll();

    console.log('Notifications disabled');
  }
}

async function showPrayerNotification(prayerName: string) {
  const options = await getOptions();

  if (!options.notification) return;

  // Create notification
  await browser.notifications.create(`prayer-${Date.now()}`, {
    type: 'basic',
    // iconUrl: browser.runtime.getURL('public/icon/icon-128.png'),
    title: `🕌 ${prayerName} Prayer Time`,
    message: `It's time for ${prayerName} prayer`,
    priority: 2,
    requireInteraction: true,
    buttons: [
      { title: 'Open Prayer Times' },
      { title: 'Snooze (5 min)' }
    ]
  });

  // Handle notification clicks
  browser.notifications.onClicked.addListener((notificationId) => {
    if (notificationId.includes('prayer-')) {
      browser.action.openPopup();
    }
  });

  browser.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId.includes('prayer-')) {
      if (buttonIndex === 0) {
        browser.action.openPopup();
      } else if (buttonIndex === 1) {
        // Snooze logic
        browser.alarms.create(`prayer-${prayerName}-snooze`, {
          delayInMinutes: 5
        });
      }
    }
  });
}

async function openSidePanel(windowId?: number) {
  try {
    if (windowId) {
      await browser.sidePanel.open({ windowId });
    } else {
      const currentWindow = await browser.windows.getCurrent();
      await browser.sidePanel.open({ windowId: currentWindow.id });
    }
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
}

// ========== HELPER FUNCTIONS ==========

async function checkExistingData(): Promise<boolean> {
  const storage = await browser.storage.local.get(['prayerTimes', 'location']);
  return !!(storage.prayerTimes && storage.location);
}

async function fetchInitialPrayerTimes() {
  try {
    const prayerTimes = await getPrayerTimesForLocation();
    await browser.storage.local.set({
      prayerTimes,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch initial prayer times:', error);
  }
}

async function setupPrayerNotifications() {
  const notificationScheduler = new NotificationScheduler();
  const prayerTimes = await getPrayerTimesForLocation();
  await notificationScheduler.scheduleAll(prayerTimes);
}

async function scheduleDailyUpdate() {
  // Clear existing daily alarm
  await browser.alarms.clear('dailyPrayerUpdate');

  // Schedule for next midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const delayInMinutes = (tomorrow.getTime() - now.getTime()) / (1000 * 60);

  await browser.alarms.create('dailyPrayerUpdate', {
    delayInMinutes,
    periodInMinutes: 24 * 60 // Repeat daily
  });

  console.log(`Daily update scheduled for ${tomorrow.toLocaleString()}`);
}

async function updateAllPrayerTimes() {
  const prayerService = new PrayerService();
  const geolocationService = new GeolocationService();

  try {
    // Get current location
    const coordinates = await geolocationService.getCurrentLocation();

    // Update prayer times
    const prayerTimes = await prayerService.getPrayerTimes(coordinates, true);

    // Update notifications if enabled
    const options = await getOptions();
    if (options.notification) {
      const notificationScheduler = new NotificationScheduler();
      await notificationScheduler.scheduleAll(prayerTimes);
    }

    console.log('Daily prayer times updated');
  } catch (error) {
    console.error('Failed to update prayer times:', error);
  }
}

async function schedulePrayerNotifications(prayerTimes: PrayerTime[]) {
  const notificationScheduler = new NotificationScheduler();
  await notificationScheduler.scheduleAll(prayerTimes);
}

async function getOptions(): Promise<{ notification: boolean }> {
  const storage = await browser.storage.local.get('options');
  return storage.options || { notification: false };
}

async function onLocationChange(newLocation: Coordinates) {
  // Update prayer times for new location
  const prayerService = new PrayerService();
  const prayerTimes = await prayerService.getPrayerTimes(newLocation, true);

  // Reschedule notifications if enabled
  const options = await getOptions();
  if (options.notification) {
    await schedulePrayerNotifications(prayerTimes);
  }
}