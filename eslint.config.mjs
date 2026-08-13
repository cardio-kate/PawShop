import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  { ignores: ['jest.config.js', 'postcss.config.js'] },
  ...coreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
