/**
 * LifeOS Encrypted Storage Utilities
 * Secure storage for sensitive data using Web Crypto API
 */

const EncryptedStorage = {
  // Algorithm configuration
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12, // 96 bits for GCM
  SALT_LENGTH: 16,
  ITERATIONS: 100000,

  // Storage key for the encrypted data
  ENCRYPTED_PREFIX: 'lifeos-encrypted-',

  // Cache for derived key (session only, not persisted)
  _keyCache: null,
  _keySalt: null,

  /**
   * Check if encryption is available
   * @returns {boolean}
   */
  isAvailable() {
    return typeof crypto !== 'undefined' &&
           typeof crypto.subtle !== 'undefined' &&
           typeof TextEncoder !== 'undefined';
  },

  /**
   * Generate a random salt
   * @returns {Uint8Array}
   */
  generateSalt() {
    return crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
  },

  /**
   * Generate a random IV
   * @returns {Uint8Array}
   */
  generateIV() {
    return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
  },

  /**
   * Derive an encryption key from a password
   * @param {string} password - User password
   * @param {Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>}
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive the actual encryption key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Convert ArrayBuffer to Base64 string
   * @param {ArrayBuffer} buffer
   * @returns {string}
   */
  bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  /**
   * Convert Base64 string to ArrayBuffer
   * @param {string} base64
   * @returns {Uint8Array}
   */
  base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  },

  /**
   * Encrypt data
   * @param {any} data - Data to encrypt (will be JSON stringified)
   * @param {CryptoKey} key - Encryption key
   * @returns {Promise<object>} Encrypted data with IV
   */
  async encrypt(data, key) {
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const dataBuffer = encoder.encode(dataString);

    const iv = this.generateIV();

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      dataBuffer
    );

    return {
      iv: this.bufferToBase64(iv),
      data: this.bufferToBase64(encryptedBuffer)
    };
  },

  /**
   * Decrypt data
   * @param {object} encryptedObj - Object with iv and data
   * @param {CryptoKey} key - Decryption key
   * @returns {Promise<any>} Decrypted data
   */
  async decrypt(encryptedObj, key) {
    const iv = this.base64ToBuffer(encryptedObj.iv);
    const encryptedData = this.base64ToBuffer(encryptedObj.data);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    const dataString = decoder.decode(decryptedBuffer);
    return JSON.parse(dataString);
  },

  /**
   * Initialize encryption with a password
   * Creates or retrieves the salt and derives the key
   * @param {string} password - User password
   * @returns {Promise<boolean>} Success status
   */
  async initialize(password) {
    if (!this.isAvailable()) {
      console.error('Web Crypto API not available');
      return false;
    }

    try {
      // Check for existing salt
      const storedSalt = localStorage.getItem(this.ENCRYPTED_PREFIX + 'salt');

      if (storedSalt) {
        this._keySalt = this.base64ToBuffer(storedSalt);
      } else {
        // First time setup - generate new salt
        this._keySalt = this.generateSalt();
        localStorage.setItem(
          this.ENCRYPTED_PREFIX + 'salt',
          this.bufferToBase64(this._keySalt)
        );
      }

      // Derive key from password
      this._keyCache = await this.deriveKey(password, this._keySalt);

      // Verify the key works by trying to decrypt existing data
      // or by setting a verification value
      const verifyKey = this.ENCRYPTED_PREFIX + 'verify';
      const existingVerify = localStorage.getItem(verifyKey);

      if (existingVerify) {
        try {
          const encryptedVerify = JSON.parse(existingVerify);
          await this.decrypt(encryptedVerify, this._keyCache);
          return true;
        } catch (e) {
          // Wrong password - clear cache
          this._keyCache = null;
          return false;
        }
      } else {
        // First time - store verification value
        const encrypted = await this.encrypt({ verified: true }, this._keyCache);
        localStorage.setItem(verifyKey, JSON.stringify(encrypted));
        return true;
      }
    } catch (error) {
      console.error('Encryption initialization failed:', error);
      this._keyCache = null;
      return false;
    }
  },

  /**
   * Check if encryption is initialized and ready
   * @returns {boolean}
   */
  isInitialized() {
    return this._keyCache !== null;
  },

  /**
   * Lock the encryption (clear key from memory)
   */
  lock() {
    this._keyCache = null;
  },

  /**
   * Get encrypted data
   * @param {string} key - Storage key
   * @returns {Promise<any>} Decrypted data or null
   */
  async get(key) {
    if (!this.isInitialized()) {
      console.error('Encryption not initialized. Call initialize() first.');
      return null;
    }

    try {
      const stored = localStorage.getItem(this.ENCRYPTED_PREFIX + key);
      if (!stored) return null;

      const encryptedObj = JSON.parse(stored);
      return await this.decrypt(encryptedObj, this._keyCache);
    } catch (error) {
      console.error(`Error retrieving encrypted ${key}:`, error);
      return null;
    }
  },

  /**
   * Set encrypted data
   * @param {string} key - Storage key
   * @param {any} value - Data to encrypt and store
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value) {
    if (!this.isInitialized()) {
      console.error('Encryption not initialized. Call initialize() first.');
      return false;
    }

    try {
      const encrypted = await this.encrypt(value, this._keyCache);
      localStorage.setItem(this.ENCRYPTED_PREFIX + key, JSON.stringify(encrypted));

      // Dispatch event for cross-app communication
      window.dispatchEvent(
        new CustomEvent('lifeos-encrypted-data-changed', {
          detail: { key }
        })
      );
      return true;
    } catch (error) {
      console.error(`Error storing encrypted ${key}:`, error);
      return false;
    }
  },

  /**
   * Remove encrypted data
   * @param {string} key - Storage key
   */
  remove(key) {
    localStorage.removeItem(this.ENCRYPTED_PREFIX + key);
    window.dispatchEvent(
      new CustomEvent('lifeos-encrypted-data-removed', {
        detail: { key }
      })
    );
  },

  /**
   * Check if encrypted key exists
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  has(key) {
    return localStorage.getItem(this.ENCRYPTED_PREFIX + key) !== null;
  },

  /**
   * Change the encryption password
   * Re-encrypts all data with new password
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(oldPassword, newPassword) {
    if (!this.isInitialized()) {
      console.error('Encryption not initialized');
      return false;
    }

    try {
      // First, collect all encrypted data
      const allData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey.startsWith(this.ENCRYPTED_PREFIX) &&
            storageKey !== this.ENCRYPTED_PREFIX + 'salt' &&
            storageKey !== this.ENCRYPTED_PREFIX + 'verify') {
          const key = storageKey.replace(this.ENCRYPTED_PREFIX, '');
          allData[key] = await this.get(key);
        }
      }

      // Generate new salt and key
      const newSalt = this.generateSalt();
      const newKey = await this.deriveKey(newPassword, newSalt);

      // Clear old encrypted data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.ENCRYPTED_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Store new salt
      localStorage.setItem(
        this.ENCRYPTED_PREFIX + 'salt',
        this.bufferToBase64(newSalt)
      );

      // Update cache
      this._keySalt = newSalt;
      this._keyCache = newKey;

      // Store new verification
      const encrypted = await this.encrypt({ verified: true }, this._keyCache);
      localStorage.setItem(this.ENCRYPTED_PREFIX + 'verify', JSON.stringify(encrypted));

      // Re-encrypt all data
      for (const [key, value] of Object.entries(allData)) {
        await this.set(key, value);
      }

      return true;
    } catch (error) {
      console.error('Password change failed:', error);
      return false;
    }
  },

  /**
   * Export all encrypted data (still encrypted)
   * @returns {object} All encrypted data
   */
  exportEncrypted() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.ENCRYPTED_PREFIX)) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  },

  /**
   * Import encrypted data
   * @param {object} data - Encrypted data to import
   */
  importEncrypted(data) {
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  },

  /**
   * Check if there's existing encrypted data (for UI purposes)
   * @returns {boolean}
   */
  hasExistingData() {
    return localStorage.getItem(this.ENCRYPTED_PREFIX + 'salt') !== null;
  },

  /**
   * Clear all encryption data (destructive - requires re-setup)
   */
  clearAll() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.ENCRYPTED_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    this._keyCache = null;
    this._keySalt = null;
  },

  // ==================== SENSITIVE FIELD HELPERS ====================

  /**
   * Fields that should be encrypted by default
   */
  SENSITIVE_FIELDS: [
    'ssn',
    'socialSecurityNumber',
    'accountNumber',
    'routingNumber',
    'creditCardNumber',
    'pin',
    'password',
    'apiKey',
    'secretKey'
  ],

  /**
   * Check if a field name suggests sensitive data
   * @param {string} fieldName
   * @returns {boolean}
   */
  isSensitiveField(fieldName) {
    const lower = fieldName.toLowerCase();
    return this.SENSITIVE_FIELDS.some(sensitive =>
      lower.includes(sensitive.toLowerCase())
    );
  },

  /**
   * Encrypt only sensitive fields in an object
   * @param {object} data - Object with potential sensitive fields
   * @param {string[]} sensitiveFields - List of field names to encrypt
   * @returns {Promise<object>} Object with encrypted sensitive fields
   */
  async encryptSensitiveFields(data, sensitiveFields = null) {
    if (!this.isInitialized()) {
      console.warn('Encryption not initialized, returning data as-is');
      return data;
    }

    const fields = sensitiveFields || Object.keys(data).filter(k => this.isSensitiveField(k));
    const result = { ...data };

    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        const encrypted = await this.encrypt(result[field], this._keyCache);
        result[field] = { __encrypted: true, ...encrypted };
      }
    }

    return result;
  },

  /**
   * Decrypt sensitive fields in an object
   * @param {object} data - Object with encrypted sensitive fields
   * @returns {Promise<object>} Object with decrypted fields
   */
  async decryptSensitiveFields(data) {
    if (!this.isInitialized()) {
      console.warn('Encryption not initialized, returning data as-is');
      return data;
    }

    const result = { ...data };

    for (const [key, value] of Object.entries(result)) {
      if (value && typeof value === 'object' && value.__encrypted) {
        try {
          result[key] = await this.decrypt(value, this._keyCache);
        } catch (e) {
          console.error(`Failed to decrypt field ${key}:`, e);
          result[key] = null;
        }
      }
    }

    return result;
  }
};

// Make available globally
window.EncryptedStorage = EncryptedStorage;
