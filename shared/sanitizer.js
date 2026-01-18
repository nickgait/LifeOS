/**
 * LifeOS Sanitizer Utilities
 * XSS protection and safe HTML rendering
 */

const Sanitizer = {
  /**
   * Escape HTML special characters to prevent XSS
   * Use this for any user-provided content that should be displayed as plain text
   * @param {string} text - Raw text to escape
   * @returns {string} Escaped HTML-safe string
   */
  escapeHTML(text) {
    if (text === null || text === undefined) return '';
    const str = String(text);
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Sanitize HTML content using DOMPurify if available, otherwise strip all HTML
   * Use this for rich text content that may contain safe HTML
   * @param {string} html - HTML content to sanitize
   * @param {Object} options - DOMPurify options
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(html, options = {}) {
    if (html === null || html === undefined) return '';
    const str = String(html);

    // If DOMPurify is available, use it
    if (typeof DOMPurify !== 'undefined') {
      const defaultOptions = {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'class', 'id', 'target'],
        ALLOW_DATA_ATTR: false
      };
      return DOMPurify.sanitize(str, { ...defaultOptions, ...options });
    }

    // Fallback: escape all HTML
    return this.escapeHTML(str);
  },

  /**
   * Safely set text content of an element
   * @param {HTMLElement} element - Target element
   * @param {string} text - Text to set
   */
  setTextContent(element, text) {
    if (element) {
      element.textContent = text;
    }
  },

  /**
   * Safely set inner HTML of an element with sanitization
   * @param {HTMLElement} element - Target element
   * @param {string} html - HTML to set (will be sanitized)
   */
  setInnerHTML(element, html) {
    if (element) {
      element.innerHTML = this.sanitizeHTML(html);
    }
  },

  /**
   * Create a safe HTML string from a template with escaped values
   * Usage: Sanitizer.html`<div>${userInput}</div>`
   * @param {TemplateStringsArray} strings - Template strings
   * @param {...any} values - Values to interpolate (will be escaped)
   * @returns {string} Safe HTML string
   */
  html(strings, ...values) {
    return strings.reduce((result, string, i) => {
      const value = values[i - 1];
      const escaped = this.escapeHTML(value);
      return result + escaped + string;
    });
  },

  /**
   * Create a safe HTML string where some values are pre-sanitized HTML
   * Mark trusted values with { __html: 'content' }
   * @param {TemplateStringsArray} strings - Template strings
   * @param {...any} values - Values to interpolate
   * @returns {string} Safe HTML string
   */
  htmlSafe(strings, ...values) {
    return strings.reduce((result, string, i) => {
      const value = values[i - 1];
      let output;

      if (value && typeof value === 'object' && value.__html !== undefined) {
        // Trusted HTML - sanitize but allow HTML
        output = this.sanitizeHTML(value.__html);
      } else {
        // Untrusted - escape completely
        output = this.escapeHTML(value);
      }

      return result + output + string;
    });
  },

  /**
   * Sanitize an object's string properties
   * @param {Object} obj - Object with string properties
   * @param {string[]} fieldsToSanitize - Array of field names to sanitize (or all if not specified)
   * @returns {Object} Object with sanitized string values
   */
  sanitizeObject(obj, fieldsToSanitize = null) {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = { ...obj };
    const fields = fieldsToSanitize || Object.keys(sanitized);

    fields.forEach(field => {
      if (typeof sanitized[field] === 'string') {
        sanitized[field] = this.escapeHTML(sanitized[field]);
      }
    });

    return sanitized;
  },

  /**
   * Validate and sanitize a URL
   * Only allows http, https, and relative URLs
   * @param {string} url - URL to validate
   * @returns {string|null} Sanitized URL or null if invalid
   */
  sanitizeURL(url) {
    if (!url || typeof url !== 'string') return null;

    const trimmed = url.trim();

    // Allow relative URLs
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
      return trimmed;
    }

    // Allow http and https
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const parsed = new URL(trimmed);
        return parsed.href;
      } catch {
        return null;
      }
    }

    // Reject javascript:, data:, and other schemes
    return null;
  },

  /**
   * Create a DOM element safely with text content
   * @param {string} tagName - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string} textContent - Text content (will be set safely)
   * @returns {HTMLElement} Created element
   */
  createElement(tagName, attributes = {}, textContent = '') {
    const element = document.createElement(tagName);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, this.escapeHTML(value));
      } else if (key === 'href') {
        const safeUrl = this.sanitizeURL(value);
        if (safeUrl) element.setAttribute('href', safeUrl);
      } else {
        element.setAttribute(key, this.escapeHTML(value));
      }
    });

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  },

  /**
   * Build a list of items safely
   * @param {HTMLElement} container - Container element
   * @param {Array} items - Array of items
   * @param {Function} renderItem - Function that returns an HTMLElement for each item
   */
  renderList(container, items, renderItem) {
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Append each item
    items.forEach((item, index) => {
      const element = renderItem(item, index);
      if (element instanceof HTMLElement) {
        container.appendChild(element);
      }
    });
  }
};

// Make available globally
window.Sanitizer = Sanitizer;
