/**
 * LifeOS Form Utilities
 * Shared form handling functions used across all apps
 */

class FormUtils {
  /**
   * Reset a form and show success message
   * @param {HTMLFormElement|string} form - Form element or form ID
   * @param {string} message - Success message to display
   * @param {Function} onSuccess - Optional callback after form reset
   */
  static resetFormWithSuccess(form, message = 'Success!', onSuccess = null) {
    // Get form element if string ID provided
    if (typeof form === 'string') {
      form = document.getElementById(form);
    }

    if (!form) {
      console.warn('Form not found for reset');
      return;
    }

    // Reset form fields
    form.reset();

    // Show notification
    UIUtils.showNotification(message, 'success', 3000);

    // Call optional callback
    if (onSuccess && typeof onSuccess === 'function') {
      onSuccess();
    }
  }

  /**
   * Show form error message
   * @param {string} fieldId - ID of the form field
   * @param {string} message - Error message
   */
  static showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    // Remove existing error if present
    this.clearFieldError(fieldId);

    // Add error styling
    field.classList.add('form-error');
    field.setAttribute('aria-invalid', 'true');

    // Create and insert error message
    const errorEl = document.createElement('div');
    errorEl.className = 'form-error-message';
    errorEl.id = `${fieldId}-error`;
    errorEl.textContent = message;
    field.parentNode.insertBefore(errorEl, field.nextSibling);
  }

  /**
   * Clear field error
   * @param {string} fieldId - ID of the form field
   */
  static clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    field.classList.remove('form-error');
    field.setAttribute('aria-invalid', 'false');

    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
      errorEl.remove();
    }
  }

  /**
   * Validate required fields
   * @param {Array<string>} fieldIds - Array of field IDs to validate
   * @returns {boolean} True if all fields are valid
   */
  static validateRequired(fieldIds) {
    let isValid = true;

    fieldIds.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (!field) return;

      const value = field.value.trim();

      if (!value) {
        this.showFieldError(fieldId, 'This field is required');
        isValid = false;
      } else {
        this.clearFieldError(fieldId);
      }
    });

    return isValid;
  }

  /**
   * Validate email field
   * @param {string} fieldId - Field ID
   * @returns {boolean} True if valid
   */
  static validateEmail(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return false;

    const email = field.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      this.showFieldError(fieldId, 'Please enter a valid email address');
      return false;
    }

    this.clearFieldError(fieldId);
    return true;
  }

  /**
   * Validate number field
   * @param {string} fieldId - Field ID
   * @param {Object} options - Validation options
   * @returns {boolean} True if valid
   */
  static validateNumber(fieldId, options = {}) {
    const field = document.getElementById(fieldId);
    if (!field) return false;

    const value = parseFloat(field.value);
    const { min = null, max = null, allowNegative = true } = options;

    if (isNaN(value)) {
      this.showFieldError(fieldId, 'Please enter a valid number');
      return false;
    }

    if (!allowNegative && value < 0) {
      this.showFieldError(fieldId, 'This field must be positive');
      return false;
    }

    if (min !== null && value < min) {
      this.showFieldError(fieldId, `Minimum value is ${min}`);
      return false;
    }

    if (max !== null && value > max) {
      this.showFieldError(fieldId, `Maximum value is ${max}`);
      return false;
    }

    this.clearFieldError(fieldId);
    return true;
  }

  /**
   * Validate date field
   * @param {string} fieldId - Field ID
   * @param {Object} options - Validation options
   * @returns {boolean} True if valid
   */
  static validateDate(fieldId, options = {}) {
    const field = document.getElementById(fieldId);
    if (!field) return false;

    const value = field.value.trim();
    const { minDate = null, maxDate = null, pastOnly = false, futureOnly = false } = options;

    if (!value) {
      this.showFieldError(fieldId, 'Please select a date');
      return false;
    }

    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pastOnly && date >= today) {
      this.showFieldError(fieldId, 'Please select a past date');
      return false;
    }

    if (futureOnly && date <= today) {
      this.showFieldError(fieldId, 'Please select a future date');
      return false;
    }

    if (minDate && date < new Date(minDate)) {
      this.showFieldError(fieldId, `Date must be after ${minDate}`);
      return false;
    }

    if (maxDate && date > new Date(maxDate)) {
      this.showFieldError(fieldId, `Date must be before ${maxDate}`);
      return false;
    }

    this.clearFieldError(fieldId);
    return true;
  }

  /**
   * Get form data as object
   * @param {HTMLFormElement|string} form - Form element or ID
   * @returns {Object} Form data
   */
  static getFormData(form) {
    if (typeof form === 'string') {
      form = document.getElementById(form);
    }

    if (!form) return {};

    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      if (data.hasOwnProperty(key)) {
        // Handle multiple values (checkboxes, multi-select)
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  /**
   * Set form data from object
   * @param {HTMLFormElement|string} form - Form element or ID
   * @param {Object} data - Data to set
   */
  static setFormData(form, data) {
    if (typeof form === 'string') {
      form = document.getElementById(form);
    }

    if (!form) return;

    Object.keys(data).forEach(key => {
      const field = form.elements[key];
      if (!field) return;

      if (field.type === 'checkbox' || field.type === 'radio') {
        field.checked = data[key];
      } else {
        field.value = data[key];
      }
    });
  }

  /**
   * Disable all form fields
   * @param {HTMLFormElement|string} form - Form element or ID
   * @param {boolean} disabled - True to disable, false to enable
   */
  static setFormDisabled(form, disabled = true) {
    if (typeof form === 'string') {
      form = document.getElementById(form);
    }

    if (!form) return;

    const fields = form.querySelectorAll('input, textarea, select, button');
    fields.forEach(field => {
      field.disabled = disabled;
    });
  }

  /**
   * Clear all form errors
   * @param {HTMLFormElement|string} form - Form element or ID
   */
  static clearAllErrors(form) {
    if (typeof form === 'string') {
      form = document.getElementById(form);
    }

    if (!form) return;

    const fields = form.querySelectorAll('.form-error');
    fields.forEach(field => {
      field.classList.remove('form-error');
      field.setAttribute('aria-invalid', 'false');
    });

    const errorMessages = form.querySelectorAll('.form-error-message');
    errorMessages.forEach(msg => msg.remove());
  }
}

// Add form error styling if not already present
if (!document.getElementById('form-utils-styles')) {
  const style = document.createElement('style');
  style.id = 'form-utils-styles';
  style.textContent = `
    .form-error {
      border-color: #ef4444 !important;
      background-color: #fef2f2 !important;
    }

    .form-error:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }

    .form-error-message {
      color: #ef4444;
      font-size: 13px;
      margin-top: 4px;
      margin-bottom: 8px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
      color: #333;
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  `;
  document.head.appendChild(style);
}
