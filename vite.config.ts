// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        // 配置路径别名，'@' 指向 'src' 目录
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        port: 5173,
        host: true, // 允许局域网访问
        open: true, // 启动时自动打开浏览器
        // 反向代理配置，解决本地开发跨域问题
        proxy: {
            '/api': {
                target: 'http://localhost:28080', // 你的 SpringBoot 后端地址
                changeOrigin: true,
                // 如果后端接口没有 /api 前缀，需要在这里重写去掉
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
});
