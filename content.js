/**
 * WPM to TPS Converter
 * Converts Words Per Minute to Tokens Per Second for LLM comparison
 *
 * Conversion logic:
 * - Average tokens per word: ~1.3
 * - TPS = (WPM / 60) * 1.3
 * - Formula: TPS ≈ WPM * 0.02167
 */

const WPM_TO_TPS_RATIO = 0.02167;

// Site-specific patterns for finding and converting WPM values
const SITE_PATTERNS = {
  'nitrotype.com': {
    // Pattern 1: stat-box with WPM in a span (e.g., "139 <span>WPM</span>")
    selectors: [
      {
        // Main stat boxes
        numberSelector: '.stat-box--stat',
        labelSelector: '.stat-box--stat span',
        type: 'inline' // number and label in same container
      },
      {
        // Extra stats (Highest Record, etc.)
        numberSelector: '.stat-box--extra--stat',
        labelSelector: '.stat-box--extra--label',
        type: 'sibling' // number and label are siblings
      },
      {
        // Table cells with WPM
        numberSelector: '.table-cell',
        labelSelector: '.table-cell span',
        type: 'inline'
      }
    ]
  }
};

/**
 * Convert WPM value to TPS
 * @param {number} wpm - Words per minute
 * @returns {number} Tokens per second (rounded to 2 decimals)
 */
function wpmToTps(wpm) {
  return Math.round(wpm * WPM_TO_TPS_RATIO * 100) / 100;
}

/**
 * Check if an element or its children contain "WPM" text
 * @param {Element} element
 * @returns {Element|null} The element containing "WPM" or null
 */
function findWpmLabel(element) {
  if (!element) return null;

  // Check the element itself
  if (element.textContent && element.textContent.trim() === 'WPM') {
    return element;
  }

  // Check direct children
  const children = element.children;
  for (let child of children) {
    if (child.textContent && child.textContent.trim() === 'WPM') {
      return child;
    }
  }

  return null;
}

/**
 * Extract numeric WPM value from text
 * @param {string} text
 * @returns {number|null} The WPM value or null
 */
function extractWpmValue(text) {
  // Match number followed by optional whitespace and "WPM"
  const match = text.match(/(\d+)\s*WPM/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Convert WPM elements based on pattern type
 * @param {Object} pattern - Pattern configuration
 */
function convertWpmElements(pattern) {
  const numberElements = document.querySelectorAll(pattern.numberSelector);

  numberElements.forEach(numberEl => {
    let wpmValue = null;
    let labelEl = null;

    if (pattern.type === 'inline') {
      // Pattern: "139 <span>WPM</span>" - number and label in same container
      const fullText = numberEl.textContent;
      wpmValue = extractWpmValue(fullText);

      if (wpmValue !== null) {
        labelEl = findWpmLabel(numberEl);
      }
    } else if (pattern.type === 'sibling') {
      // Pattern: <div>139</div><div>WPM</div> - separate elements
      wpmValue = parseInt(numberEl.textContent.trim(), 10);

      if (!isNaN(wpmValue)) {
        // Check next sibling or use label selector
        if (pattern.labelSelector) {
          const parent = numberEl.parentElement;
          labelEl = parent ? parent.querySelector(pattern.labelSelector) : null;
        } else {
          labelEl = numberEl.nextElementSibling;
        }

        // Verify it's actually a WPM label
        if (labelEl && !labelEl.textContent.includes('WPM')) {
          labelEl = null;
          wpmValue = null;
        }
      }
    }

    // Convert and update if we found a valid WPM value
    if (wpmValue !== null && !numberEl.dataset.converted) {
      const tpsValue = wpmToTps(wpmValue);

      // Mark as converted to avoid re-processing
      numberEl.dataset.converted = 'true';

      if (pattern.type === 'inline') {
        // For inline type, we need to preserve child elements like <span>
        // Update label first if it exists
        if (labelEl) {
          labelEl.textContent = 'TPS';
          labelEl.style.color = '#90EE90';
        }

        // Replace the number in text nodes (preserves child elements)
        for (let node of numberEl.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            const match = node.textContent.match(/\b\d+/);
            if (match) {
              node.textContent = node.textContent.replace(/\b\d+/, tpsValue);
              break;
            }
          }
        }

        // If no span label was found, also replace "WPM" in text nodes
        if (!labelEl) {
          for (let node of numberEl.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('WPM')) {
              node.textContent = node.textContent.replace(/WPM/i, 'TPS');
              break;
            }
          }
        }
      } else if (pattern.type === 'sibling' && labelEl) {
        // For sibling type, elements are separate so we can update them independently
        numberEl.textContent = tpsValue;
        labelEl.textContent = 'TPS';
        labelEl.style.color = '#90EE90';
      }
    }
  });
}

/**
 * Main conversion function
 */
function convertWpmToTps() {
  const hostname = window.location.hostname;

  // Find matching site pattern
  let sitePattern = null;
  for (const [domain, pattern] of Object.entries(SITE_PATTERNS)) {
    if (hostname.includes(domain)) {
      sitePattern = pattern;
      break;
    }
  }

  if (!sitePattern) {
    console.log('[WPM to TPS] No pattern configured for this site:', hostname);
    return;
  }

  console.log('[WPM to TPS] Converting WPM values on:', hostname);

  // Apply each selector pattern
  sitePattern.selectors.forEach(pattern => {
    convertWpmElements(pattern);
  });
}

/**
 * Observe DOM changes to convert dynamically loaded content
 */
function observeDomChanges() {
  const observer = new MutationObserver((mutations) => {
    // Check if any mutations added nodes with WPM text
    let shouldConvert = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.textContent && node.textContent.includes('WPM')) {
              shouldConvert = true;
              break;
            }
          }
        }
      }
      if (shouldConvert) break;
    }

    if (shouldConvert) {
      // Debounce: wait a bit for all changes to settle
      setTimeout(convertWpmToTps, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    convertWpmToTps();
    observeDomChanges();
  });
} else {
  convertWpmToTps();
  observeDomChanges();
}
