// vite.config.ts
import { type ConfigEnv, defineConfig, loadEnv, type UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

/**
 * Vite 工业级环境配置
 * * 核心功能：
 * 1. 动态环境变量加载：支持 .env.development 和 .env.production
 * 2. 路径别名：使用 @ 指向 src 目录，减少嵌套层级引用负担
 * 3. 自动化 CSS 注入：全局注入 SCSS 变量，无需在每个组件手动 @use
 * 4. 反向代理网关：解决开发期跨域，并支持 WebSocket 扩展
 */
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  // 💡 获取当前运行模式下的环境变量（process.cwd() 为项目根目录）
  const env = loadEnv(mode, process.cwd());

  return {
    // 基础路径，如果部署在子路径下需要修改此处
    base: './',

    plugins: [vue()],

    resolve: {
      // 设置路径别名
      alias: {
        '@': resolve(__dirname, 'src'),
      },
      // 自动尝试补全这些扩展名
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },

    css: {
      preprocessorOptions: {
        scss: {
          // ⚠️ 注意：如果你的 sass 版本较高，可能需要使用 'modern' 编译器 API
          // api: 'modern-compiler',
          // 自动在所有 scss 文件前注入全局变量
          additionalData: `@use "@/styles/variables.scss" as *;`,
        },
      },
    },

    server: {
      port: 5173,
      host: true, // 允许通过 IP 访问（方便手机或同事调试）
      open: true, // 启动成功自动打开浏览器

      // 🌟 核心代理网关配置
      proxy: {
        // 使用环境变量中定义的 VITE_APP_BASE_API (例如 /api) 作为前缀拦截
        [env.VITE_APP_BASE_API]: {
          // 目标服务器地址，从 .env.development 读取
          target: env.VITE_APP_PROXY_TARGET,
          changeOrigin: true, // 允许跨域
          ws: true, // 如果需要支持 websocket 请开启

          /**
           * 💡 重要路径重写逻辑说明：
           * 1. 如果后端 Controller 路径包含 /api (如 @RequestMapping("/api/user"))，
           * 则【不需要】重写，请注释掉 rewrite。
           * 2. 如果后端路径不包含 /api (如直接是 /user)，
           * 则【必须】开启重写，将前缀抹除再转发。
           */
          // rewrite: (path) => path.replace(new RegExp(`^${env.VITE_APP_BASE_API}`), ''),

          // 打印代理后的真实地址，方便本地排查 404 问题
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // 1. 使用 proxyReq 设置一个自定义请求头（演示用途）
              proxyReq.setHeader('X-Proxy-By', 'Vite-Gateway');
              // 打印代理后的真实地址，方便本地排查 404
              if (req.url) {
                console.log(
                  `[Proxying]: ${req.method} ${req.url} -> ${options.target}${req.url} | Response Status: ${res.statusCode}`
                );
              }
            });
          },
        },
      },
    },

    build: {
      // 生产环境构建输出目录
      outDir: 'dist',
      // 生成静态资源的存放路径
      assetsDir: 'static',
      // 是否生成 source map 文件（开发调试用，生产建议关闭）
      sourcemap: mode === 'development',
      // 💡 关键：必须指定混淆器为 terser，否则下面的 terserOptions 不生效
      minify: 'terser',
      // 消除打包过程中的控制台输出
      terserOptions: {
        // 💡 修复点：确保 compress 结构正确
        compress: {
          drop_console: true, // 生产环境移除 console
          drop_debugger: true, // 生产环境移除 debugger
        },
        // 选填：保留类名或方法名（如果业务逻辑依赖反射/类名）
        mangle: true,
      },
      // 块大小限制，大数据看板类项目建议适当调大
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          // 静态资源分库打包，避免单个文件过大导致首屏加载慢
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]',
        },
      },
    },
  };
});
