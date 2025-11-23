# WPM to TPS Converter Chrome Extension

A Chrome extension that converts typing speed from **Words Per Minute (WPM)** to **Tokens Per Second (TPS)**, allowing you to visualize your typing speed in terms of what an LLM would output.

## Conversion Formula

```
Average tokens per word: ~1.3
TPS = (WPM / 60) * 1.3
TPS ≈ WPM * 0.02167
```

For example:
- 139 WPM → **3.01 TPS**
- 158 WPM → **3.42 TPS**

## Currently Supported Sites

- **Nitro Type** (nitrotype.com) - Competitive typing platform with stats pages

## Installation

### Load as Unpacked Extension (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the directory containing this extension
6. The extension will now be active on supported sites

## Usage

1. Navigate to a supported site (e.g., nitrotype.com/stats)
2. The extension will automatically convert all WPM values to TPS
3. Converted values will be shown in **light green** to differentiate them

## Adding Support for New Sites

The extension is designed to be easily extensible. To add support for a new typing site:

### Step 1: Add Site Pattern to `content.js`

Edit the `SITE_PATTERNS` object in `content.js`:

```javascript
const SITE_PATTERNS = {
  'nitrotype.com': {
    selectors: [ /* ... */ ]
  },
  'your-new-site.com': {
    selectors: [
      {
        numberSelector: '.wpm-number',      // CSS selector for number element
        labelSelector: '.wpm-label',        // CSS selector for "WPM" label
        type: 'inline' // or 'sibling'
      }
    ]
  }
};
```

### Step 2: Understand Pattern Types

**`inline` type**: Number and label are in the same container

```html
<div class="stat">139 <span>WPM</span></div>
```

**`sibling` type**: Number and label are separate adjacent elements

```html
<div class="number">139</div>
<div class="label">WPM</div>
```

### Step 3: Add URL Pattern to `manifest.json`

Add the site's URL pattern to the `matches` array:

```json
"content_scripts": [
  {
    "matches": [
      "*://*.nitrotype.com/*",
      "*://*.your-new-site.com/*"
    ],
    "js": ["content.js"],
    "run_at": "document_idle"
  }
]
```

### Step 4: Reload Extension

1. Go to `chrome://extensions/`
2. Click the reload icon on the extension card
3. Test on the new site

## Example: Adding TypeRacer Support

```javascript
// In content.js - SITE_PATTERNS
'typeracer.com': {
  selectors: [
    {
      numberSelector: '.avgSpeed',
      labelSelector: '.avgSpeed .units',
      type: 'inline'
    }
  ]
}
```

```json
// In manifest.json - content_scripts.matches
"matches": [
  "*://*.nitrotype.com/*",
  "*://*.typeracer.com/*"
]
```

## Features

- ✅ Automatic conversion on page load
- ✅ Real-time conversion for dynamically loaded content
- ✅ Prevents duplicate conversions
- ✅ Extensible pattern-matching system
- ✅ Visual differentiation (light green text for TPS)

## Technical Details

- **Manifest Version**: 3 (Chrome Extensions Manifest V3)
- **Permissions**: None required
- **Content Script**: Runs on `document_idle` for optimal performance
- **DOM Observer**: Watches for dynamic content changes

## Development

### File Structure

```
chrome-tokensec/
├── manifest.json      # Extension configuration
├── content.js         # Main conversion logic
└── README.md          # This file
```

### Debugging

1. Open DevTools on a supported site (F12)
2. Check Console for log messages:
   - `[WPM to TPS] Converting WPM values on: [hostname]`
   - `[WPM to TPS] No pattern configured for this site: [hostname]`

## Contributing

To add support for a new typing site:

1. Inspect the site's HTML to find WPM value patterns
2. Add the pattern to `SITE_PATTERNS` in `content.js`
3. Add the URL pattern to `manifest.json`
4. Test thoroughly
5. Submit a pull request

## License

MIT
