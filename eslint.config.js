export default [
  {
    ignores: ['.github/workflows/', 'README.md'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2022,
    },
    rules: {
      // Add ESLint rules here as needed, e.g.:
      'no-unused-vars': 'warn',
      'semi': ['error', 'always'],
    },
  },
];
