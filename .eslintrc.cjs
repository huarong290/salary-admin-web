// .eslintrc.cjs
module.exports = {
    // 停止向上级目录查找配置文件，确保只使用当前目录的配置
    root: true,

    // 预定义全局变量，避免 ESLint 报 "window is not defined" 等错误
    env: {
        browser: true,
        node: true,
        es2021: true,
    },

    // 指定 Vue 文件的解析器
    parser: 'vue-eslint-parser',

    // 解析器具体配置
    parserOptions: {
        ecmaVersion: 'latest',
        parser: '@typescript-eslint/parser', // 内部使用 TS 解析器解析 <script lang="ts">
        sourceType: 'module',
    },

    // 继承的规则集合（注意顺序：后面的会覆盖前面的）
    extends: [
        'eslint:recommended',                          // ESLint 官方推荐的基础规则
        'plugin:vue/vue3-recommended',                 // Vue3 官方推荐的最严苛规则
        '@vue/eslint-config-typescript/recommended',   // Vue 官方提供的 TS 规则整合

        // 🛡️ 致命防线：必须放在数组最后！
        // 它的作用是强行关闭 ESLint 中所有与 Prettier 冲突的代码格式化规则，全权交由 Prettier 处理。
        '@vue/eslint-config-prettier',
    ],

    // 自定义规则（针对业务场景的微调）
    rules: {
        // 允许单单词组件名。Vue 官方建议组件名用多单词(如 UserList.vue)，但系统里常有 index.vue，关闭此报错。
        'vue/multi-word-component-names': 'off',

        // 允许使用 any。在项目初期快速迭代，或者对接后端复杂的动态 JSON 时，适度使用 any 是提高效率的妥协。
        '@typescript-eslint/no-explicit-any': 'off',

        // 允许使用 @ts-ignore 来压制某些顽固的 TS 报错
        '@typescript-eslint/ban-ts-comment': 'off',

        // 声明了变量但未使用时，只给警告(warn)而不是直接报错阻断运行，提升开发体验
        '@typescript-eslint/no-unused-vars': 'warn',

        // 生产环境禁用 console 和 debugger，开发环境允许
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
};