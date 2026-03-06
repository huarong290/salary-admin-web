import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from '@vue/eslint-config-prettier/skip-formatting';
import globals from 'globals'; // 👇 新增：引入全局变量字典
export default tseslint.config(
  // 1. 替代原来的 .eslintignore (声明忽略检查的目录)
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-ssr/**',
      '*.local',
      '.husky/**',
      '.vscode/**',
      'public/**',
      'commitlint.config.mjs',
      'lint-staged.config.mjs',
    ],
  },

  // 2. 基础 JS 和 TS 推荐规则
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Vue 3 推荐规则
  ...pluginVue.configs['flat/recommended'],
  //  4：将浏览器 (window, document) 和 Node.js (process, __dirname) 的全局变量加入白名单
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  // 5. 解析 .vue 文件中的 <script lang="ts">
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // 6. 致命防线：关闭所有与 Prettier 冲突的规则
  eslintConfigPrettier,

  // 7. 咱们的自定义业务规则
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  }
);
