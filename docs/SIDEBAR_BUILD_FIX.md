# Sidebar Build Fix - WXT Compatibility

## Problem

WXT was throwing an error:

```
Default export not found, did you forget to call "export default defineUnlistedScript(...)"?
```

## Root Cause

WXT requires all entrypoints to have a default export. The sidebar entrypoint was using manual DOM mounting instead of exporting a React component.

## Solution Applied

### 1. **Fixed `entrypoints/sidebar/index.tsx`**

Changed from:

```typescript
// Old: Manual DOM mounting (no export)
const initApp = async () => { ... }
initApp();
```

To:

```typescript
// New: Default export with React component
export default function SidebarApp() {
  useEffect(() => {
    // Theme initialization
  }, []);

  return <Sidebar />;
}
```

**Why:** WXT's React module requires a default export that returns a React component. The `@wxt-dev/module-react` plugin automatically handles the rendering.

### 2. **Cleaned up `entrypoints/sidebar/sidebar.html`**

Removed:

```html
<div id="app"></div>
<script type="module" src="./index.tsx"></script>
```

**Why:** WXT automatically injects the React component into the HTML. We don't need manual script tags or container divs.

---

## What WXT Does Automatically

With the React module enabled (`@wxt-dev/module-react`), WXT:

1. ✅ Finds your TSX/JSX entrypoints
2. ✅ Creates a root container (`<div id="root"></div>`)
3. ✅ Calls `ReactDOM.createRoot()`
4. ✅ Renders your default export component
5. ✅ Handles hot module reloading

---

## How the Sidebar Now Works

```
entrypoints/sidebar/index.tsx (Default Export)
         ↓
export default function SidebarApp()
         ↓
Return <Sidebar /> component
         ↓
WXT automatically:
  - Creates React root
  - Renders component
  - Injects into sidebar.html
         ↓
✨ Sidebar panel displays correctly
```

---

## Next Steps

### 1. **Run dev server again:**

```bash
npm run dev
```

### 2. **Expected behavior:**

- Build should succeed with no errors
- Sidebar HTML file loads without errors
- Sidebar component renders in the panel

### 3. **Test:**

1. Open extension popup
2. Click "📖 Open Sidebar" button
3. Sidebar should open in a side panel with prayer times and azkar

---

## Configuration Reference

Your `wxt.config.ts` is correctly configured:

```typescript
manifest: {
	side_panel: {
		default_path: "./entrypoints/sidebar/sidebar.html";
	}
}
```

And entrypoints are discovered automatically:

- `entrypoints/popup/App.tsx` ← Popup
- `entrypoints/sidebar/index.tsx` ← Sidebar (just fixed)
- `entrypoints/options/index.tsx` ← Options page
- `entrypoints/background.ts` ← Service worker

---

## Files Modified

| File                               | Change                                       |
| ---------------------------------- | -------------------------------------------- |
| `entrypoints/sidebar/index.tsx`    | ✅ Added default export + React component    |
| `entrypoints/sidebar/sidebar.html` | ✅ Removed manual script/container injection |

---

## Verification

To verify everything is set up correctly:

```bash
# 1. Check TypeScript compilation
npm run compile

# 2. Start dev server
npm run dev

# 3. Look for success message in terminal
# "Build successful!"
```

---

## Common Issues & Fixes

### Issue: Still getting default export error

**Solution:** Ensure `index.tsx` has `export default` at the top level:

```typescript
export default function SidebarApp() { ... }  ✅ Correct
```

### Issue: Sidebar panel is blank

**Solution:** Check browser console for errors:

- Missing container? (Should not happen with auto-injection)
- Theme initialization error? (Check storage permissions)
- Component rendering error? (Check Sidebar.tsx)

### Issue: Styles not loading

**Solution:** Verify CSS import is present:

```typescript
import "@/entrypoints/components/Sidebar/Sidebar.css";  ✅ Required
```

---

## WXT React Module Documentation

For reference, see:

- [WXT React Module Docs](https://wxt.dev/guide/modules/react.html)
- [WXT Entrypoints Guide](https://wxt.dev/guide/essentials/entrypoints.html)

---

You should now be able to run `npm run dev` successfully! 🚀
