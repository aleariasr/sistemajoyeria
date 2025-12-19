# PWA Icons Required

To enable full PWA functionality, create these icon files:

## Required Icons

1. **icon-192x192.png** - 192x192px app icon
   - Used for Android home screen
   - Used in manifest.json

2. **icon-512x512.png** - 512x512px app icon
   - Used for high-res displays
   - Used in manifest.json

3. **badge-72x72.png** - 72x72px notification badge
   - Used in push notifications
   - Appears on notification badge

## Creating Icons

### Option 1: Online Generators
- https://favicon.io/favicon-generator/
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/

### Option 2: Design Tools
- Figma, Canva, Photoshop, etc.
- Recommended color: #1a237e (primary blue)
- Add text "POS" or jewelry icon

### Option 3: Simple SVG
Create a simple SVG and convert to PNG at different sizes.

## Files Are Referenced In

- `frontend/public/manifest.json`
- `frontend/public/index.html`
- Service worker notifications
- Push notification payloads

## Temporary Workaround

Until icons are created, the app will work but:
- May show console warnings
- Won't have proper app icon on mobile
- Notifications may use browser default icon

Place the PNG files in: `frontend/public/`
