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
      'action'             // Toolbar button
    ],

    // Host permissions for API calls
    host_permissions: [
      'https://api.aladhan.com/*',           // ✅ Prayer times API
      'https://api.aladhan.com/v1/*',        // ✅ Specific API version
      'https://*.aladhan.com/*',             // ✅ All subdomains
      'https://api.bigdatacloud.net/*',      // ✅ Reverse geocoding API
      'https://*.bigdatacloud.net/*',        // ✅ All subdomains
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

    // Optional permissions (requested at runtime)
    // optional_permissions: [
    //   'activeTab',         // For potential future features
    //   'scripting'          // For potential future features
    // ],

    // Key for persistent background service worker
    // background: {
    //   service_worker: 'background.ts',
    //   type: 'module'
    // },

    // // Icons (multiple sizes required)
    // icons: {
    //   16: 'icon/icon-16.png',
    //   32: 'icon/icon-32.png',
    //   48: 'icon/icon-48.png',
    //   128: 'icon/icon-128.png'
    // },

    // // Action configuration (browser toolbar button)
    // action: {
    //   default_title: 'My Prayer',
    //   default_popup: 'popup/index.html',
    //   default_icon: {
    //     16: 'icon/icon-16.png',
    //     32: 'icon/icon-32.png',
    //     48: 'icon/icon-48.png'
    //   }
    // },

    // Side panel configuration
    // side_panel: {
    //   default_path: 'sidepanel/index.html'
    // },

    // Options page
    // options_ui: {
    //   page: 'options/index.html',
    //   open_in_tab: true
    // },

    // Minimum Chrome version
    // minimum_chrome_version: '88',

    // Content Security Policy
    // content_security_policy: {
    //   extension_pages: "script-src 'self'; object-src 'self'; connect-src 'self' https://api.aladhan.com https://api.bigdatacloud.net"
    // }
  },
});