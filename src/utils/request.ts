// src/utils/request.ts
import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/modules/auth';
import type { ApiResult } from '@/types/common';

/**
 * 扩展请求配置
 */
export interface CustomRequestConfig extends Omit<InternalAxiosRequestConfig, 'headers'> {
  //让 headers 可选，避免调用时必须传
  headers?: Record<string, string>;
  silent?: boolean;
  isUpload?: boolean;
  noToken?: boolean;
  /** 防重复请求 */
  dedupe?: boolean;
  /** 自动重试次数 */
  retry?: number;
  /** 缓存（仅 GET） */
  cache?: boolean;
  // 防止死循环
  _retry?: boolean;
}
/**
 * 创建 Axios 实例
 */
const service: AxiosInstance = axios.create({
  // 建议配合 vite 环境变量
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' },
});
// ==================== 无感刷新核心变量 ====================
let isRefreshing = false; // 标记是否正在刷新 Token 中
// 不仅要存成功的回调，还要存失败的回调，杜绝 Promise 永久挂起 (Memory Leak)
interface PendingTask {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let requests: PendingTask[] = [];

// ================== 请求去重 ==================
const pendingMap = new Map<string, AbortController>();

function getRequestKey(config: CustomRequestConfig) {
  const { url, method, params, data } = config;
  return `${method}_${url}_${JSON.stringify(params)}_${JSON.stringify(data)}`;
}

function addPending(config: CustomRequestConfig) {
  const key = getRequestKey(config);
  if (pendingMap.has(key)) {
    pendingMap.get(key)?.abort();
  }
  const controller = new AbortController();
  config.signal = controller.signal;
  pendingMap.set(key, controller);
}

function removePending(config: CustomRequestConfig) {
  const key = getRequestKey(config);
  pendingMap.delete(key);
}

// ================== 缓存 ==================
const cacheMap = new Map<string, any>();
// ==================== Axios 实例 ====================

// ==================== 请求拦截 ====================
/**
 * 请求拦截器
 */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const customConfig = config as CustomRequestConfig;
    const authStore = useAuthStore();
    // 保证 headers 一定存在 (非常重要，否则下面赋值会 undefined 报错)
    customConfig.headers = customConfig.headers || {};
    // Token 注入
    if (authStore.accessToken && !customConfig.noToken) {
      customConfig.headers['Authorization'] = `${authStore.tokenType} ${authStore.accessToken}`;
    }

    // GET 请求加时间戳防缓存
    if (customConfig.method?.toLowerCase() === 'get') {
      customConfig.params = {
        ...customConfig.params,
        _t: Date.now(),
      };
    }

    // 上传文件
    if (customConfig.isUpload) {
      // 绝对不能手动写死 'multipart/form-data'
      // 必须删掉默认的 Content-Type，让浏览器检测到 FormData 后自己生成带 boundary 的完整请求头
      delete customConfig.headers['Content-Type'];
    }
    // 去重
    if (customConfig.dedupe) {
      addPending(customConfig);
    }
    // 缓存
    if (customConfig.cache && customConfig.method === 'get') {
      const key = getRequestKey(customConfig);
      if (cacheMap.has(key)) {
        return Promise.reject({
          __fromCache: true,
          data: cacheMap.get(key),
        });
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// ==================== 响应拦截 ====================
/**
 * 响应拦截器
 *  返回业务数据，调用时直接拿到结果
 */
service.interceptors.response.use(
  <T>(response: AxiosResponse) => {
    const config = response.config as CustomRequestConfig;
    removePending(config);
    // 文件下载特判！如果是二进制流，直接返回，绝对不能拦截 code
    if (['blob', 'arraybuffer'].includes(response.config.responseType || '')) {
      return response.data;
    }
    const res = response.data as ApiResult<any>;
    // 匹配后端 ApiResult 的成功码
    if ([0, 200, '0', '200'].includes(res.code)) {
      // 缓存
      if (config.cache && config.method === 'get') {
        const key = getRequestKey(config);
        cacheMap.set(key, res.data);
      }
      return res.data as T;
    }

    if (!config.silent) {
      ElMessage.error(res.message || '系统接口异常');
    }
    return Promise.reject(res);
  },
  async (error) => {
    const config = error.config as CustomRequestConfig;
    const authStore = useAuthStore();
    // 命中缓存
    if (error.__fromCache) {
      return error.data;
    }
    removePending(config);

    // -------------------- 🌟 核心：401 无感刷新逻辑 --------------------
    if (error.response?.status === 401 && !config.noToken && !config._retry) {
      // 🚫 防止 refresh 自己进入死循环
      if (config.url?.includes('/auth/refresh')) {
        authStore.logout();
        return Promise.reject(error);
      }

      // 1. 如果已经在刷新中了，将当前请求塞入队列，返回一个 Pending 的 Promise
      if (isRefreshing) {
        // 正在刷新中，将当前请求挂起，返回未决的 Promise
        return new Promise((resolve, reject) => {
          requests.push({
            resolve: (token: string) => {
              config.headers!['Authorization'] = `${authStore.tokenType} ${token}`;
              resolve(service(config));
            },
            reject,
          });
        });
      }

      // 2. 开启刷新锁
      config._retry = true;
      isRefreshing = true;

      try {
        // 3. 调用 store 里的刷新逻辑（内部会调 /auth/refresh）
        const newToken = await authStore.doRefreshToken();

        // 4. 刷新成功：批量释放挂起的请求
        requests.forEach((task) => task.resolve(newToken));
        requests = []; // 清空队列
        // 5. 重发当前触发 401 的原始请求
        config.headers!['Authorization'] = `${authStore.tokenType} ${newToken}`;
        return service(config);
      } catch (refreshError) {
        // 6. 刷新也失败（说明 RefreshToken 也过期或被盗用）
        // 刷新 Token 也过期时，必须逐个 reject 队列中的请求，否则页面将永久卡死
        requests.forEach((task) => task.reject(refreshError));
        requests = [];
        await authStore.logout(); // 内部含跳转登录页
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // 释放锁
      }
    }
    // ================== 自动重试 ==================
    if (config.retry && config.retry > 0) {
      config.retry--;
      await new Promise((r) => setTimeout(r, 300));
      return service(config);
    }
    // ----------------------------------------------------------------

    // 普通错误处理

    if (!config?.silent) {
      const message = error.response?.data?.message || error.message || '请求失败';
      ElMessage.error(message);
    }
    return Promise.reject(error);
  }
);

/**
 * 封装统一的请求方法
 *  泛型 <T> 保证调用时类型安全
 */
const request = {
  get<T = any>(url: string, config?: CustomRequestConfig): Promise<T> {
    return service.get<any, T>(url, config);
  },
  post<T = any>(url: string, data?: unknown, config?: CustomRequestConfig): Promise<T> {
    return service.post<any, T>(url, data, config);
  },
  put<T = any>(url: string, data?: unknown, config?: CustomRequestConfig): Promise<T> {
    return service.put<any, T>(url, data, config);
  },
  // 这里的 config 会完美接收 api.ts 中传来的 { data: ids, params: {...} }
  delete<T = any>(url: string, config?: CustomRequestConfig): Promise<T> {
    return service.delete<any, T>(url, config);
  },
};

export default request;
