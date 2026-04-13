import { PrayerService } from '@/api/services/prayerService';
import { GeolocationService } from '@/api/services/geolocationService';
import { NotificationService } from '@/api/services/notificationService';
import { NotificationScheduler } from '@/utils/notificationScheduler';
import { DailyUpdater } from '@/utils/dailyUpdater';
import { PrayerTime } from '@/types/prayer';
import { Coordinates } from '@/types/api';
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  console.log('🙏 My Prayer Background Service Started');

  // Initialize services
  const prayerService = new PrayerService();
  const geolocationService = new GeolocationService();
  const notificationScheduler = new NotificationScheduler();
  const dailyUpdater = new DailyUpdater(prayerService);

  // Handle extension installation
  browser.runtime.onInstalled.addListener(handleInstallation);

  // Handle alarms (prayer notifications & daily updates)
  browser.alarms.onAlarm.addListener(handleAlarm);

  // Listen for messages from popup/options
  browser.runtime.onMessage.addListener(handleMessages);

  // Listen for storage changes (notification settings, location)
  browser.storage.onChanged.addListener(handleStorageChange);

  // Initialize on startup
  initializeBackgroundServices();
});

// ========== EVENT HANDLERS ==========

async function handleInstallation(details: Browser.runtime.InstalledDetails) {
  console.log('Installation reason:', details.reason);

  // Request notification permission on install
  if (Notification.permission !== 'granted') {
    await Notification.requestPermission();
  }

  // Schedule daily update
  await scheduleDailyUpdate();
}

/**
 * Handle alarm triggers
 * - dailyPrayerUpdate: Refresh prayer times and reschedule alarms
 * - prayer-*: Show notification for specific prayer
 */
async function handleAlarm(alarm: Browser.alarms.Alarm) {
  console.log(`⏰ Alarm triggered: ${alarm.name}`);

  if (alarm.name === 'dailyPrayerUpdate') {
    await updateAllPrayerTimes();
    await scheduleDailyUpdate();
  } else if (NotificationService.isPrayerAlarm(alarm.name)) {
    const prayerName = NotificationService.getPrayerNameFromAlarm(alarm.name);
    await NotificationService.showNotification(prayerName);
  }
}

/**
 * Handle messages from popup and options pages
 */
async function handleMessages(
  message: any,
  sender: Browser.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  console.log('📬 Background received message:', message.type);

  try {
    switch (message.type) {
      case 'GET_PRAYER_TIMES':
        const times = await getPrayerTimesForLocation();
        sendResponse({ success: true, data: times });
        return true;

      case 'UPDATE_LOCATION':
        await updateLocation(message.coordinates);
        sendResponse({ success: true });
        return true;

      case 'RESCHEDULE_ALARMS':
        // Reschedule all alarms when notification settings change
        console.log('🔄 Rescheduling alarms due to settings change...');
        const prayerTimes = await getPrayerTimesForLocation();
        await notificationScheduler.scheduleAll(prayerTimes);
        sendResponse({ success: true });
        return true;

      case 'SETTINGS_UPDATED':
        // Just log settings update, storage listener will handle reschedule
        console.log('⚙️ Settings updated:', message.settings);
        sendResponse({ success: true });
        return true;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

/**
 * Handle storage changes from all contexts
 */
async function handleStorageChange(
  changes: { [key: string]: browser.storage.StorageChange },
  areaName: string
) {
  if (areaName !== 'local') return;

  // Handle notification settings changes
  if (changes.notificationSettings) {
    console.log('🔔 Notification settings changed:', changes.notificationSettings.newValue);
    const prayerTimes = await getPrayerTimesForLocation();
    await notificationScheduler.scheduleAll(prayerTimes);
  }

  // Handle manual location changes (with coordinates)
  if (changes.manualLocation) {
    console.log('📍 Manual location changed:', changes.manualLocation.newValue);
    await onLocationChange(changes.manualLocation.newValue);
  }
}

// ========== CORE FUNCTIONS ==========

/**
 * Initialize background services on startup
 */
async function initializeBackgroundServices() {
  console.log('🚀 Initializing background services...');

  try {
    // Load existing prayer times
    const hasData = await checkExistingData();

    if (!hasData) {
      await fetchInitialPrayerTimes();
    } else {
      // Ensure alarms are scheduled for existing prayer times
      const prayerTimes = await getPrayerTimesForLocation();
      await notificationScheduler.scheduleAll(prayerTimes);
    }

    // Schedule daily update if not already scheduled
    const dailyAlarm = await browser.alarms.get('dailyPrayerUpdate');
    if (!dailyAlarm) {
      await scheduleDailyUpdate();
    }

    console.log('✅ Background services initialized');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
  }
}

/**
 * Get prayer times for current or default location
 */
async function getPrayerTimesForLocation(): Promise<PrayerTime[]> {
  const geolocationService = new GeolocationService();
  const prayerService = new PrayerService();

  try {
    const coordinates = await geolocationService.getCurrentLocation();
    const prayerTimes = await prayerService.getPrayerTimes(coordinates);
    return prayerTimes;
  } catch (error) {
    console.error('Failed to get prayer times:', error);

    // Try to return cached data
    const storage = await browser.storage.local.get('prayerTimes');
    return storage.prayerTimes || [];
  }
}

/**
 * Update location and refresh prayer times
 */
async function updateLocation(coordinates: Coordinates) {
  const geolocationService = new GeolocationService();
  const prayerService = new PrayerService();

  try {
    // Save location
    await geolocationService.setManualLocation(coordinates);

    // Update prayer times
    const prayerTimes = await prayerService.getPrayerTimes(coordinates, true);

    // Reschedule notifications for new location
    await notificationScheduler.scheduleAll(prayerTimes);

    console.log('✅ Location updated and alarm rescheduled');
    return prayerTimes;
  } catch (error) {
    console.error('Failed to update location:', error);
    throw error;
  }
}

/**
 * Update all prayer times (daily)
 * Called by daily update alarm
 */
async function updateAllPrayerTimes() {
  const prayerService = new PrayerService();
  const geolocationService = new GeolocationService();

  try {
    console.log('📅 Running daily prayer time update...');

    // Get current location
    const coordinates = await geolocationService.getCurrentLocation();

    // Update prayer times (force refresh)
    const prayerTimes = await prayerService.getPrayerTimes(coordinates, true);

    // Reschedule alarms for new times
    await notificationScheduler.scheduleAll(prayerTimes);

    console.log('✅ Daily prayer times updated successfully');
  } catch (error) {
    console.error('❌ Failed to update prayer times:', error);
  }
}

/**
 * Schedule daily alarm at midnight
 */
async function scheduleDailyUpdate() {
  try {
    // Clear existing daily alarm
    await browser.alarms.clear('dailyPrayerUpdate');

    // Calculate delay until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const delayInMinutes = (tomorrow.getTime() - now.getTime()) / (1000 * 60);

    await browser.alarms.create('dailyPrayerUpdate', {
      delayInMinutes,
      periodInMinutes: 24 * 60, // Repeat daily
    });

    console.log(`📅 Daily update scheduled for ${tomorrow.toLocaleString()}`);
  } catch (error) {
    console.error('Failed to schedule daily update:', error);
  }
}

/**
 * Handle location change from storage
 */
async function onLocationChange(newLocation: Coordinates) {
  try {
    console.log('🔄 Location change detected, updating prayer times...');
    await updateLocation(newLocation);
  } catch (error) {
    console.error('Failed to handle location change:', error);
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Check if prayer times already exist in storage
 */
async function checkExistingData(): Promise<boolean> {
  const storage = await browser.storage.local.get(['prayerTimes']);
  return !!storage.prayerTimes;
}

/**
 * Fetch and store initial prayer times on first run
 */
async function fetchInitialPrayerTimes() {
  try {
    console.log('🏗️ Fetching initial prayer times...');
    const prayerTimes = await getPrayerTimesForLocation();
    await browser.storage.local.set({
      prayerTimes,
      lastUpdated: new Date().toISOString(),
    });
    console.log('✅ Initial prayer times fetched and stored');
  } catch (error) {
    console.error('Failed to fetch initial prayer times:', error);
  }
}
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