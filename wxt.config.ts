import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite'

// See https://wxt.dev/api/config.html


export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
  }),
  manifest: {
    name: 'My Prayer',
    version: '1.2.1',
    description: 'Islamic prayer times with notifications and location-based calculations',
    homepage_url: 'https://github.com/mahmouddwidar/my-prayer',
    author: {
      email: 'mahmouddwidar23@gmail.com'
    },

    // Required permissions
    permissions: [
      'storage',           // Store prayer times and settings
      'geolocation',       // Get user's location
      'alarms',            // Schedule prayer notifications
      'notifications',     // Show prayer notifications
      'sidePanel',         // Open prayer details sidebar
      'offscreen',           // For background audio/notifications
      'action',             // Toolbar button
      "runtime",
      "windows",
      "tabs",
    ],

    // Host permissions for API calls
    host_permissions: [
      'https://api.aladhan.com/*',
      'https://api.aladhan.com/v1/*',
      'https://*.aladhan.com/*',
      'https://api.bigdatacloud.net/*',
      'https://*.bigdatacloud.net/*',
    ],

    "action": {
      "default_popup": "./entrypoints/popup/App.tsx"
    },

    // Background service worker
    background: {
      service_worker: 'background.ts',
      type: 'module',
      persistent: true  // Keep alive for notifications
    },

    // Side panel configuration
    "side_panel": {
      "default_path": './entrypoints/sidebar/index.html'
    },

    // Options page
    "options_page": './entrypoints/options/index.html',
  },
});