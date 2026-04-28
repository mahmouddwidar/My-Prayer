import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  entrypoints: [
    'entrypoints/popup/main.tsx',
    'entrypoints/options/index.tsx',
    'entrypoints/sidebar/index.tsx',
    'entrypoints/background.ts',
    'entrypoints/content.ts',
  ],
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

    permissions: [
      'storage',
      'geolocation',
      'alarms',
      'notifications',
      'sidePanel',
      'offscreen',
      'action',
      "runtime",
      "windows",
      "tabs",
    ],

    host_permissions: [
      'https://api.aladhan.com/*',
      'https://api.aladhan.com/v1/*',
      'https://*.aladhan.com/*',
      'https://api.bigdatacloud.net/*',
      'https://*.bigdatacloud.net/*',
    ],

    "action": {
      "default_popup": "popup/index.html"
    },

    background: {
      service_worker: 'background.ts',
      type: 'module',
    },

    // Side panel configuration
    "side_panel": {
      "default_path": "sidepanel/index.html"
    },

    "options_page": "options/index.html",
  },
});