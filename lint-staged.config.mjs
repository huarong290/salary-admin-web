// lint-staged.config.mjs
export default {
    // 对 js, ts, vue 文件先执行 eslint 修复，再执行 prettier 格式化
    '*.{js,jsx,ts,tsx,vue}': [
        'eslint --fix',
        'prettier --write'
    ],
    // 对样式和配置文件只执行格式化
    '*.{json,md,css,scss,html}': [
        'prettier --write'
    ]
};