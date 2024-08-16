module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["plugin:vue/vue3-recommended", "standard"],
  parserOptions: {
    ecmaVersion: "latest",
    parser: "@typescript-eslint/parser",
    sourceType: "module",
  },
  globals: {
    UserInfo: "writable",
    User: "writable",
  },
  plugins: ["vue", "@typescript-eslint"],
  rules: {
    semi: 0,
    quotes: [0],
    "space-before-function-paren": [
      2,
      {
        anonymous: "always",
        named: "never",
        asyncArrow: "always",
      },
    ],
    "vue/singleline-html-element-content-newline": [0],
    "vue/max-attributes-per-line": [0],
    "vue/html-self-closing": [0],
    "no-unused-vars": [1],
    "comma-dangle": [0],
    "no-undef": [0],
  },
};
