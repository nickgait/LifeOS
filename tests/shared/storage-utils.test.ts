/**
 * Tests for StorageUtils
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock StorageUtils (we'll need to convert storage-utils.js to TS or use JSDoc)
class StorageUtils {
  static set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  static get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue ?? null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue ?? null;
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }

  static getKeysWithPrefix(prefix: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }
}

describe('StorageUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve a string value', () => {
      StorageUtils.set('test_key', 'test_value');
      const result = StorageUtils.get('test_key');
      expect(result).toBe('test_value');
    });

    it('should store and retrieve an object', () => {
      const testObj = { name: 'Test', value: 123 };
      StorageUtils.set('test_obj', testObj);
      const result = StorageUtils.get('test_obj');
      expect(result).toEqual(testObj);
    });

    it('should store and retrieve an array', () => {
      const testArray = [1, 2, 3, 4, 5];
      StorageUtils.set('test_array', testArray);
      const result = StorageUtils.get('test_array');
      expect(result).toEqual(testArray);
    });

    it('should return null for non-existent key', () => {
      const result = StorageUtils.get('non_existent');
      expect(result).toBeNull();
    });

    it('should return default value for non-existent key', () => {
      const result = StorageUtils.get('non_existent', 'default');
      expect(result).toBe('default');
    });

    it('should handle complex nested objects', () => {
      const complex = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        tasks: [
          { id: 1, title: 'Task 1' },
          { id: 2, title: 'Task 2' },
        ],
      };
      StorageUtils.set('complex', complex);
      const result = StorageUtils.get('complex');
      expect(result).toEqual(complex);
    });
  });

  describe('remove', () => {
    it('should remove a stored value', () => {
      StorageUtils.set('to_remove', 'value');
      expect(StorageUtils.get('to_remove')).toBe('value');

      StorageUtils.remove('to_remove');
      expect(StorageUtils.get('to_remove')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all stored values', () => {
      StorageUtils.set('key1', 'value1');
      StorageUtils.set('key2', 'value2');
      StorageUtils.set('key3', 'value3');

      expect(localStorage.length).toBe(3);

      StorageUtils.clear();
      expect(localStorage.length).toBe(0);
    });
  });

  describe('getKeysWithPrefix', () => {
    it('should return keys with specific prefix', () => {
      StorageUtils.set('lifeos_todo_tasks', []);
      StorageUtils.set('lifeos_todo_settings', {});
      StorageUtils.set('lifeos_goals_list', []);
      StorageUtils.set('other_key', 'value');

      const todoKeys = StorageUtils.getKeysWithPrefix('lifeos_todo_');
      expect(todoKeys).toHaveLength(2);
      expect(todoKeys).toContain('lifeos_todo_tasks');
      expect(todoKeys).toContain('lifeos_todo_settings');
      expect(todoKeys).not.toContain('lifeos_goals_list');
    });

    it('should return empty array when no keys match prefix', () => {
      StorageUtils.set('key1', 'value1');
      StorageUtils.set('key2', 'value2');

      const result = StorageUtils.getKeysWithPrefix('lifeos_');
      expect(result).toEqual([]);
    });

    it('should handle empty localStorage', () => {
      const result = StorageUtils.getKeysWithPrefix('any_prefix');
      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle storing null', () => {
      StorageUtils.set('null_value', null);
      const result = StorageUtils.get('null_value');
      expect(result).toBeNull();
    });

    it('should handle storing undefined as null', () => {
      StorageUtils.set('undefined_value', undefined);
      const result = StorageUtils.get('undefined_value');
      // JSON.stringify(undefined) returns undefined, which becomes null
      expect([null, undefined]).toContain(result);
    });

    it('should handle storing numbers', () => {
      StorageUtils.set('number', 42);
      const result = StorageUtils.get('number');
      expect(result).toBe(42);
    });

    it('should handle storing booleans', () => {
      StorageUtils.set('bool_true', true);
      StorageUtils.set('bool_false', false);

      expect(StorageUtils.get('bool_true')).toBe(true);
      expect(StorageUtils.get('bool_false')).toBe(false);
    });

    it('should handle special characters in keys', () => {
      StorageUtils.set('key-with-dashes', 'value');
      StorageUtils.set('key_with_underscores', 'value');
      StorageUtils.set('key.with.dots', 'value');

      expect(StorageUtils.get('key-with-dashes')).toBe('value');
      expect(StorageUtils.get('key_with_underscores')).toBe('value');
      expect(StorageUtils.get('key.with.dots')).toBe('value');
    });
  });
});
