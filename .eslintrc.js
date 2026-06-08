module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  // Este eslint cobre apenas o backend (src/). Frontend e as Lambdas avulsas
  // (JS puro / fora do tsconfig) sao ignorados para nao quebrar o parser TS.
  ignorePatterns: [
    '.eslintrc.js',
    'dist',
    'node_modules',
    'frontend',
    'certificate-lambda',
    'fraud-lambda',
    'lambda-package',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
