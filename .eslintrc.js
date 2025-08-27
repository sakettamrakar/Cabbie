module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2020, sourceType: 'module', ecmaFeatures:{ jsx:true } },
  extends: [
    'next/core-web-vitals',
    'plugin:jsx-a11y/recommended'
  ],
  plugins: ['jsx-a11y','react-hooks'],
  settings:{ react:{ version:'detect' } },
  rules: {
    // Custom relaxations or additions can go here
    'jsx-a11y/heading-has-content': 'error',
  'jsx-a11y/no-redundant-roles': 'warn',
  '@typescript-eslint/ban-ts-comment': 'off',
  'react-hooks/exhaustive-deps': 'warn'
  ,'@next/next/no-html-link-for-pages':'off'
  }
};
