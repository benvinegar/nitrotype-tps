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

- **Nitro Type** (nitrotype.com)

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked** and select the `chrome-tokensec` directory
5. Visit nitrotype.com to see it in action

## Usage

Visit Nitro Type and the extension automatically converts all WPM values to TPS in real-time. Converted values appear in light green.

Works on:
- Stats page (average speed, highest record, summary tables)
- Race results (your speed, opponent speeds, earnings)
- Live race dashboard (real-time conversion as you type)

## License

MIT
