interface ImportMetaEnv {
  readonly VITE_APP_BASE_API: string;
  readonly VITE_APP_PROXY_TARGET: string;
  readonly VITE_USER_NODE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 声明 lunar-javascript 模块，消除 TS 找不到类型文件的警告
declare module 'lunar-javascript';
