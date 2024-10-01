import companyPrettierConfig from '@oclif/prettier-config';

export default {
  ...companyPrettierConfig,
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 80
};
