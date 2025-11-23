# WPM to TPS Converter

A Chrome extension that converts typing speed from **Words Per Minute (WPM)** to **Tokens Per Second (TPS)**, helping you visualize your typing speed in terms of LLM output.

Ever wondered how your typing speed compares to AI models like Claude or GPT? This extension bridges that gap by converting traditional WPM measurements into TPS, the standard metric for LLM token generation.

## Why TPS?

Language models output text in **tokens per second (TPS)**, not words per minute. By converting your typing speed to TPS, you can:
- Compare your speed directly to AI models
- Understand performance benchmarks in AI terms
- See typing speed from a modern, AI-centric perspective

## Conversion Formula

```
Average tokens per word: ~1.3
TPS = (WPM / 60) × 1.3
TPS ≈ WPM × 0.02167
```

**Example conversions:**
- 60 WPM → **1.30 TPS** (baseline typist)
- 100 WPM → **2.17 TPS** (proficient typist)
- 140 WPM → **3.03 TPS** (professional typist)
- 200 WPM → **4.33 TPS** (elite typist)

For context: Claude Sonnet 3.5 can generate 80-100+ TPS, while GPT-4 generates 30-50 TPS.

## Supported Sites

### Nitro Type (nitrotype.com)

Automatically converts WPM to TPS on:
- **Stats page** - Average speed, highest record, summary tables
- **Race results** - Individual race speeds, race leaderboard
- **Earnings section** - "X WPM Typing Speed" rewards

All converted values appear in **light green** for easy identification.

## Installation

### Option 1: Load as Unpacked Extension (Recommended)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/yourusername/chrome-tokensec.git
   ```

2. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked** and select the `chrome-tokensec` directory

5. The extension is now active! Visit nitrotype.com to see it in action

### Option 2: Install from Chrome Web Store

*Coming soon*

## Usage

1. **Visit Nitro Type** - Navigate to any Nitro Type page
2. **Automatic conversion** - All WPM values are instantly converted to TPS
3. **Visual distinction** - TPS values appear in light green

No configuration needed. The extension runs automatically on supported sites.

## What Gets Converted

### Stats Page (`/stats`)
- Main speed stat box
- Highest record
- Summary tables (Last 24 Hours avg speed)

### Race Results (after completing a race)
- Your race result
- Opponent race results
- Earnings section ("X WPM Typing Speed" bonus)

### Coming Soon
- Profile pages
- Team leaderboards
- Global rankings

---

## For Developers

### Adding Support for New Sites

The extension uses a flexible pattern-matching system. Adding a new typing site takes just a few minutes.

#### Step 1: Inspect the HTML

Open DevTools on the target site and find elements containing WPM values. Look for:
- The container element with the number
- The element containing "WPM" text
- Their relationship (same element or siblings)

#### Step 2: Add Pattern to `content.js`

Edit the `SITE_PATTERNS` object:

```javascript
const SITE_PATTERNS = {
  'nitrotype.com': { /* ... */ },
  'typeracer.com': {
    selectors: [
      {
        numberSelector: '.avgSpeed',      // CSS selector for element with number
        labelSelector: '.avgSpeed .units', // CSS selector for "WPM" label
        type: 'inline'                     // 'inline' or 'sibling'
      }
    ]
  }
};
```

#### Step 3: Understand Pattern Types

**`inline` type** - Number and label in the same container:
```html
<div class="stat">139 <span>WPM</span></div>
```

**`sibling` type** - Number and label are separate elements:
```html
<div class="number">139</div>
<div class="label">WPM</div>
```

#### Step 4: Add URL Pattern to `manifest.json`

```json
"content_scripts": [{
  "matches": [
    "*://*.nitrotype.com/*",
    "*://*.typeracer.com/*"
  ],
  "js": ["content.js"],
  "run_at": "document_idle"
}]
```

#### Step 5: Test

1. Go to `chrome://extensions/`
2. Click reload (⟳) on the extension
3. Visit the site and verify conversions work
4. Check different pages (stats, results, profiles)

### Architecture

**Pattern Matching System**
- Flexible CSS selector-based targeting
- Supports both inline and sibling HTML patterns
- Handles deeply nested text nodes using TreeWalker API

**Conversion Logic**
- Preserves HTML structure (doesn't break child elements)
- Only modifies text nodes
- Marks converted elements to prevent duplicate processing

**Dynamic Content**
- MutationObserver watches for DOM changes
- Automatically converts newly added content
- Debounced for performance

### File Structure

```
chrome-tokensec/
├── manifest.json      # Extension metadata and configuration
├── content.js         # Main conversion logic and patterns
└── README.md          # Documentation
```

### Technical Details

- **Manifest Version**: 3 (Chrome Extensions Manifest V3)
- **Permissions**: None required (privacy-friendly)
- **Content Script**: Runs at `document_idle` for optimal performance
- **DOM Observer**: Monitors dynamic content changes
- **No external dependencies**: Pure vanilla JavaScript

### Debugging

Enable DevTools (F12) on supported sites. Look for console messages:

```
[WPM to TPS] Converting WPM values on: nitrotype.com
```

If conversions aren't working:
1. Check that the element selectors are correct
2. Verify the pattern type (inline vs sibling)
3. Ensure the URL pattern matches in `manifest.json`
4. Check for console errors

### Features

- ✅ Real-time conversion on page load
- ✅ Automatic handling of dynamic content
- ✅ Prevents duplicate conversions
- ✅ Extensible pattern-matching system
- ✅ Visual differentiation (light green TPS labels)
- ✅ Preserves original HTML structure
- ✅ Zero external dependencies
- ✅ No permissions required

## Contributing

Contributions are welcome! To add support for a new typing site:

1. Fork this repository
2. Inspect the site's HTML structure
3. Add patterns to `SITE_PATTERNS` in `content.js`
4. Add URL patterns to `manifest.json`
5. Test thoroughly across different pages
6. Submit a pull request with:
   - Site name and URL
   - Screenshots showing conversions
   - List of pages/features supported

Popular typing sites to add:
- TypeRacer (typeracer.com)
- 10FastFingers (10fastfingers.com)
- Keybr (keybr.com)
- Monkeytype (monkeytype.com)

## Roadmap

- [ ] Add support for more typing platforms
- [ ] Options page for customization
- [ ] Custom conversion ratios
- [ ] Toggle to show/hide original WPM
- [ ] Side-by-side WPM/TPS display
- [ ] Statistics tracking

## FAQ

**Q: Why 1.3 tokens per word?**
A: This is the average across common English text. Longer words become multiple tokens, while short words might be a single token.

**Q: Does this work on mobile?**
A: Not yet. Chrome extensions on mobile have limited support. We're exploring alternatives.

**Q: Can I change the conversion ratio?**
A: Currently it's hardcoded, but we plan to add customization in future updates.

**Q: Why light green for TPS?**
A: To clearly distinguish converted values from original WPM numbers. This is customizable in the code.

**Q: Does the extension send my data anywhere?**
A: No. The extension requires zero permissions and runs entirely in your browser. Nothing is sent to external servers.

## License

MIT License - see LICENSE file for details

## Credits

Created by [Your Name]

Inspired by the need to bridge traditional typing metrics with modern AI performance benchmarks.

---

**Star this repo if you find it useful!** ⭐
