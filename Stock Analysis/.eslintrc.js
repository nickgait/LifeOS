export default [
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        Chart: "readonly",
        fetch: "readonly"
      }
    },
    rules: {
      // Error prevention
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-undef": "error",
      "no-console": "warn",
      "no-debugger": "error",
      
      // Code style
      "indent": ["error", 4],
      "quotes": ["error", "single"],
      "semi": ["error", "always"],
      "comma-dangle": ["error", "never"],
      
      // Best practices
      "eqeqeq": "error",
      "no-implicit-globals": "error",
      "prefer-const": "error",
      "no-var": "error",
      
      // ES6+
      "arrow-spacing": "error",
      "template-curly-spacing": "error"
    }
  }
];