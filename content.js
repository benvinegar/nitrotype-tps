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
      },
      {
        // Race results list items (e.g., "141 <span>WPM</span>")
        numberSelector: '.list-item',
        labelSelector: '.list-item span',
        type: 'inline'
      },
      {
        // Earnings section (e.g., "141 WPM Typing Speed")
        numberSelector: '.raceResults-reward-title',
        labelSelector: null, // No separate label element
        type: 'inline'
      },
      {
        // Live race dashboard (grid layout with label and number in separate columns)
        numberSelector: '.dash-metrics .list-item',
        labelSelector: null,
        type: 'grid' // Special type for grid layouts
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
 * Get all text nodes within an element (including nested ones)
 * @param {Element} element
 * @returns {Array<Text>} Array of text nodes
 */
function getAllTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim()) {
      textNodes.push(node);
    }
  }

  return textNodes;
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
    } else if (pattern.type === 'grid') {
      // Pattern: Grid layout with label in one column, number in adjacent column
      // Example: <div class="g-b"><span>WPM</span></div><div class="g-b"><span>139</span></div>

      // Find all text content to check if this contains "WPM" or "TPS" (if already converted)
      const fullText = numberEl.textContent;
      if (!fullText.includes('WPM') && !fullText.includes('TPS')) {
        return; // Skip this element if it doesn't contain WPM or TPS
      }

      // Find the label element containing "WPM" or "TPS"
      const allSpans = numberEl.querySelectorAll('span');
      for (let span of allSpans) {
        const text = span.textContent.trim();
        if (text === 'WPM' || text === 'TPS') {
          labelEl = span;
          break;
        }
      }

      if (!labelEl) {
        return; // Couldn't find WPM/TPS label
      }

      // Find the grid cell containing the label
      const labelCell = labelEl.closest('.g-b');
      if (!labelCell) {
        return;
      }

      // Find the adjacent grid cell with the number
      const numberCell = labelCell.nextElementSibling;
      if (!numberCell) {
        return;
      }

      // Find the number element (usually h4 or span)
      const numberSpan = numberCell.querySelector('.h4, span');
      if (!numberSpan) {
        return;
      }

      // Extract the number value - this is the CURRENT value in the DOM
      const currentDisplayValue = parseFloat(numberSpan.textContent.trim());
      if (isNaN(currentDisplayValue)) {
        return;
      }

      // Determine if the current value is WPM or TPS
      // During a race, the game constantly updates the value with WPM
      // We detect this by checking if the value is in WPM range (typically > 10)
      // vs TPS range (typically < 10)
      if (labelEl.textContent.trim() === 'TPS' && currentDisplayValue < 10) {
        // Label is TPS and value is small - this is already TPS, skip
        return;
      } else {
        // Either label is WPM, or label is TPS but value is large (game overwrote our TPS with WPM)
        // Treat the current value as WPM
        wpmValue = Math.round(currentDisplayValue);
      }

      // Store reference to number element for later update
      numberEl.numberElement = numberSpan;
    }

    // Convert and update if we found a valid WPM value
    if (wpmValue !== null) {
      const tpsValue = wpmToTps(wpmValue);

      // For grid type (live dashboard), always reconvert as the value updates in real-time
      // For other types, only convert once
      const shouldConvert = pattern.type === 'grid'
        ? (numberEl.dataset.lastWpm !== String(wpmValue)) // Reconvert if value changed
        : !numberEl.dataset.converted; // Only convert once

      if (shouldConvert) {
        // Mark as converted and store the WPM value
        numberEl.dataset.converted = 'true';
        numberEl.dataset.lastWpm = String(wpmValue);

        if (pattern.type === 'inline') {
          // For inline type, we need to preserve child elements like <span>
          // Update label first if it exists
          if (labelEl) {
            labelEl.textContent = 'TPS';
            labelEl.style.color = '#90EE90';
          }

          // Replace the number in text nodes (preserves child elements)
          // First try immediate children, then all descendants if needed
          let textNodes = Array.from(numberEl.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
          if (textNodes.length === 0) {
            textNodes = getAllTextNodes(numberEl);
          }

          for (let node of textNodes) {
            const match = node.textContent.match(/\b\d+/);
            if (match) {
              node.textContent = node.textContent.replace(/\b\d+/, tpsValue);
              break;
            }
          }

          // If no span label was found, also replace "WPM" in text nodes
          if (!labelEl) {
            for (let node of textNodes) {
              if (node.textContent.includes('WPM')) {
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
        } else if (pattern.type === 'grid' && labelEl && numberEl.numberElement) {
          // For grid type, update label and number in their respective grid cells
          labelEl.textContent = 'TPS';
          labelEl.style.color = '#90EE90';
          numberEl.numberElement.textContent = tpsValue;
        }
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
    let shouldConvert = false;

    for (const mutation of mutations) {
      // Check for added nodes with WPM text
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

      // Check for character data changes (text content updates)
      if (mutation.type === 'characterData') {
        // Check if this text change is within a dashboard metrics area
        const target = mutation.target;
        if (target && target.parentElement) {
          const closest = target.parentElement.closest('.dash-metrics, .stat-box, .list-item, .table-cell, .raceResults');
          if (closest) {
            shouldConvert = true;
            break;
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
    subtree: true,
    characterData: true,
    characterDataOldValue: true
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
