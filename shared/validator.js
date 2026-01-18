/**
 * LifeOS Input Validation Utilities
 * Pure JavaScript validation (Zod-like API without dependencies)
 */

const Validator = {
  /**
   * Validation error class
   */
  ValidationError: class extends Error {
    constructor(field, message, value) {
      super(message);
      this.name = 'ValidationError';
      this.field = field;
      this.value = value;
    }
  },

  /**
   * String validator
   */
  string(options = {}) {
    return {
      type: 'string',
      options: {
        min: options.min || 0,
        max: options.max || Infinity,
        pattern: options.pattern || null,
        trim: options.trim !== false,
        required: options.required !== false
      },
      validate(value, field) {
        if (value === null || value === undefined || value === '') {
          if (this.options.required) {
            throw new Validator.ValidationError(field, `${field} is required`, value);
          }
          return '';
        }

        let str = String(value);
        if (this.options.trim) {
          str = str.trim();
        }

        if (str.length < this.options.min) {
          throw new Validator.ValidationError(field, `${field} must be at least ${this.options.min} characters`, value);
        }
        if (str.length > this.options.max) {
          throw new Validator.ValidationError(field, `${field} must be at most ${this.options.max} characters`, value);
        }
        if (this.options.pattern && !this.options.pattern.test(str)) {
          throw new Validator.ValidationError(field, `${field} has invalid format`, value);
        }

        return str;
      }
    };
  },

  /**
   * Number validator
   */
  number(options = {}) {
    return {
      type: 'number',
      options: {
        min: options.min !== undefined ? options.min : -Infinity,
        max: options.max !== undefined ? options.max : Infinity,
        integer: options.integer || false,
        positive: options.positive || false,
        required: options.required !== false
      },
      validate(value, field) {
        if (value === null || value === undefined || value === '') {
          if (this.options.required) {
            throw new Validator.ValidationError(field, `${field} is required`, value);
          }
          return 0;
        }

        const num = Number(value);
        if (isNaN(num)) {
          throw new Validator.ValidationError(field, `${field} must be a valid number`, value);
        }
        if (this.options.integer && !Number.isInteger(num)) {
          throw new Validator.ValidationError(field, `${field} must be an integer`, value);
        }
        if (this.options.positive && num < 0) {
          throw new Validator.ValidationError(field, `${field} must be positive`, value);
        }
        if (num < this.options.min) {
          throw new Validator.ValidationError(field, `${field} must be at least ${this.options.min}`, value);
        }
        if (num > this.options.max) {
          throw new Validator.ValidationError(field, `${field} must be at most ${this.options.max}`, value);
        }

        return num;
      }
    };
  },

  /**
   * Date validator (ISO format)
   */
  date(options = {}) {
    return {
      type: 'date',
      options: {
        min: options.min || null,
        max: options.max || null,
        required: options.required !== false
      },
      validate(value, field) {
        if (value === null || value === undefined || value === '') {
          if (this.options.required) {
            throw new Validator.ValidationError(field, `${field} is required`, value);
          }
          return null;
        }

        const str = String(value).trim();
        // Validate ISO date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          throw new Validator.ValidationError(field, `${field} must be a valid date (YYYY-MM-DD)`, value);
        }

        const date = new Date(str);
        if (isNaN(date.getTime())) {
          throw new Validator.ValidationError(field, `${field} is not a valid date`, value);
        }

        if (this.options.min && date < new Date(this.options.min)) {
          throw new Validator.ValidationError(field, `${field} must be after ${this.options.min}`, value);
        }
        if (this.options.max && date > new Date(this.options.max)) {
          throw new Validator.ValidationError(field, `${field} must be before ${this.options.max}`, value);
        }

        return str;
      }
    };
  },

  /**
   * Enum validator
   */
  enum(allowedValues, options = {}) {
    return {
      type: 'enum',
      allowedValues,
      options: {
        required: options.required !== false
      },
      validate(value, field) {
        if (value === null || value === undefined || value === '') {
          if (this.options.required) {
            throw new Validator.ValidationError(field, `${field} is required`, value);
          }
          return this.allowedValues[0]; // Return default
        }

        const str = String(value).trim();
        if (!this.allowedValues.includes(str)) {
          throw new Validator.ValidationError(field, `${field} must be one of: ${this.allowedValues.join(', ')}`, value);
        }

        return str;
      }
    };
  },

  /**
   * Boolean validator
   */
  boolean(options = {}) {
    return {
      type: 'boolean',
      options: {
        required: options.required || false
      },
      validate(value, field) {
        if (value === null || value === undefined) {
          return false;
        }
        if (typeof value === 'boolean') {
          return value;
        }
        if (value === 'true' || value === '1' || value === 'on') {
          return true;
        }
        if (value === 'false' || value === '0' || value === 'off' || value === '') {
          return false;
        }
        return Boolean(value);
      }
    };
  },

  /**
   * Array validator
   */
  array(itemValidator, options = {}) {
    return {
      type: 'array',
      itemValidator,
      options: {
        min: options.min || 0,
        max: options.max || Infinity,
        required: options.required || false
      },
      validate(value, field) {
        if (value === null || value === undefined) {
          if (this.options.required) {
            throw new Validator.ValidationError(field, `${field} is required`, value);
          }
          return [];
        }

        if (!Array.isArray(value)) {
          throw new Validator.ValidationError(field, `${field} must be an array`, value);
        }

        if (value.length < this.options.min) {
          throw new Validator.ValidationError(field, `${field} must have at least ${this.options.min} items`, value);
        }
        if (value.length > this.options.max) {
          throw new Validator.ValidationError(field, `${field} must have at most ${this.options.max} items`, value);
        }

        return value.map((item, index) =>
          this.itemValidator.validate(item, `${field}[${index}]`)
        );
      }
    };
  },

  /**
   * Create a schema from field definitions
   */
  schema(fields) {
    return {
      fields,
      validate(data) {
        const result = {};
        const errors = [];

        for (const [fieldName, validator] of Object.entries(this.fields)) {
          try {
            result[fieldName] = validator.validate(data[fieldName], fieldName);
          } catch (error) {
            if (error instanceof Validator.ValidationError) {
              errors.push({
                field: error.field,
                message: error.message,
                value: error.value
              });
            } else {
              throw error;
            }
          }
        }

        if (errors.length > 0) {
          return { success: false, errors, data: null };
        }

        return { success: true, errors: [], data: result };
      },

      /**
       * Validate and throw on first error
       */
      parse(data) {
        const result = this.validate(data);
        if (!result.success) {
          throw new Validator.ValidationError(
            result.errors[0].field,
            result.errors[0].message,
            result.errors[0].value
          );
        }
        return result.data;
      },

      /**
       * Validate silently (no throws)
       */
      safeParse(data) {
        return this.validate(data);
      }
    };
  },

  // ==================== PREDEFINED SCHEMAS ====================

  /**
   * Goal schema
   */
  goalSchema: null, // Initialized below

  /**
   * Expense schema
   */
  expenseSchema: null,

  /**
   * Activity schema
   */
  activitySchema: null,

  /**
   * Journal entry schema
   */
  journalSchema: null,

  /**
   * Task schema
   */
  taskSchema: null,

  /**
   * Financial holding schema
   */
  holdingSchema: null
};

// Initialize predefined schemas
Validator.goalSchema = Validator.schema({
  name: Validator.string({ min: 1, max: 200 }),
  description: Validator.string({ max: 2000, required: false }),
  category: Validator.enum(['career', 'personal', 'financial', 'education', 'health', 'fitness', 'other']),
  targetDate: Validator.date(),
  status: Validator.enum(['active', 'completed', 'paused'], { required: false })
});

Validator.expenseSchema = Validator.schema({
  description: Validator.string({ min: 1, max: 500 }),
  amount: Validator.number({ min: 0.01, max: 1000000000, positive: true }),
  category: Validator.string({ min: 1, max: 100 }),
  date: Validator.date()
});

Validator.activitySchema = Validator.schema({
  type: Validator.enum(['pushups', 'planks', 'crunches', 'bike', 'jog', 'walk', 'weights', 'other']),
  amount: Validator.number({ min: 0.01, positive: true }),
  date: Validator.date(),
  notes: Validator.string({ max: 1000, required: false })
});

Validator.journalSchema = Validator.schema({
  title: Validator.string({ max: 200, required: false }),
  content: Validator.string({ min: 1, max: 50000 }),
  mood: Validator.enum(['amazing', 'good', 'okay', 'bad', 'terrible']),
  date: Validator.date(),
  tags: Validator.array(Validator.string({ max: 50 }), { max: 20, required: false })
});

Validator.taskSchema = Validator.schema({
  title: Validator.string({ min: 1, max: 300 }),
  description: Validator.string({ max: 2000, required: false }),
  priority: Validator.enum(['high', 'medium', 'low']),
  dueDate: Validator.date(),
  recurring: Validator.enum(['none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'], { required: false })
});

Validator.holdingSchema = Validator.schema({
  ticker: Validator.string({ min: 1, max: 10, pattern: /^[A-Za-z0-9.^-]+$/ }),
  name: Validator.string({ min: 1, max: 200 }),
  shares: Validator.number({ min: 0 }),
  sector: Validator.enum([
    'Technology', 'Healthcare', 'Financial', 'Consumer Staples',
    'Consumer Discretionary', 'Energy', 'Industrial', 'Materials',
    'Utilities', 'Real Estate', 'Communication', 'International',
    'Fixed Income', 'Diversified'
  ], { required: false })
});

// Make available globally
window.Validator = Validator;
