// src/utils/request.ts
import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessage } from 'element-plus';
// 1. 修改点：引入解耦后的 authStore
import { useAuthStore } from '@/stores/modules/auth';
// 2. 修改点：引入你后端 Record 定义的 ApiResult 类型
import type { ApiResult } from '@/types/common';

/**
 * 扩展请求配置
 */
export interface CustomRequestConfig extends Omit<InternalAxiosRequestConfig, 'headers'> {
  // ✅ 调整点：让 headers 可选，避免调用时必须传
  headers?: Record<string, string>;
  silent?: boolean;
  isUpload?: boolean;
  noToken?: boolean;
}
// ==================== 无感刷新核心变量 ====================
let isRefreshing = false; // 标记是否正在刷新 Token 中
let requests: ((token: string) => void)[] = []; // 存储由于 401 被挂起的请求回调队列
/**
 * 创建 Axios 实例
 */
const service: AxiosInstance = axios.create({
  // 建议配合 vite 环境变量
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' },
});

/**
 * 请求拦截器
 */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const customConfig = config as CustomRequestConfig;
    const userStore = useAuthStore();

    // GET 请求加时间戳防缓存
    if (customConfig.method?.toLowerCase() === 'get') {
      customConfig.params = { ...customConfig.params, _t: Date.now() };
    }

    // 保证 headers 一定存在
    customConfig.headers = customConfig.headers || {};

    // Token 注入
    if (userStore.accessToken && !customConfig.noToken) {
      customConfig.headers['Authorization'] = `${userStore.tokenType} ${userStore.accessToken}`;
    }

    if (customConfig.isUpload) {
      // 绝对不能手动写死 'multipart/form-data'
      // 必须删掉默认的 Content-Type，让浏览器检测到 FormData 后自己生成带 boundary 的完整请求头
      delete customConfig.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 响应拦截器
 *  返回业务数据，调用时直接拿到结果
 */
service.interceptors.response.use(
  <T>(response: AxiosResponse<ApiResult<T>>) => {
    const res = response.data;
    // 匹配后端 ApiResult 的成功码
    if ([0, 200, '0', '200'].includes(res.code)) {
      return res.data as T;
    }
    const config = response.config as CustomRequestConfig;
    if (!config.silent) {
      ElMessage.error(res.message || '请求失败');
    }
    return Promise.reject(new Error(res.message || '请求失败'));
  },
  async (error) => {
    const config = error.config as CustomRequestConfig;
    const authStore = useAuthStore();

    // -------------------- 🌟 核心：401 无感刷新逻辑 --------------------
    if (error.response?.status === 401 && !config.noToken) {
      // 1. 如果已经在刷新中了，将当前请求塞入队列，返回一个 Pending 的 Promise
      if (isRefreshing) {
        return new Promise((resolve) => {
          requests.push((token: string) => {
            config.headers!['Authorization'] = `${authStore.tokenType} ${token}`;
            resolve(service(config));
          });
        });
      }

      // 2. 开启刷新锁
      isRefreshing = true;

      try {
        // 3. 调用 store 里的刷新逻辑（内部会调 /auth/refresh）
        const newToken = await authStore.doRefreshToken();

        // 4. 刷新成功：执行队列中的所有请求
        requests.forEach((cb) => cb(newToken));
        requests = []; // 清空队列

        // 5. 重发当前触发 401 的原始请求
        config.headers!['Authorization'] = `${authStore.tokenType} ${newToken}`;
        return service(config);
      } catch (refreshError) {
        // 6. 刷新也失败（说明 RefreshToken 也过期或被盗用）
        requests = [];
        authStore.logout(); // 内部含跳转登录页
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // 释放锁
      }
    }
    // ----------------------------------------------------------------

    // 普通错误处理
    const responseData = error.response?.data as ApiResult;
    const message = responseData?.message || error.message || '请求失败';
    if (!config?.silent) {
      ElMessage.error(message);
    }
    return Promise.reject(new Error(message));
  }
);

/**
 * 封装统一的请求方法
 *  泛型 <T> 保证调用时类型安全
 */
const request = {
  get<T>(url: string, config?: CustomRequestConfig): Promise<T> {
    return service.get<ApiResult<T>>(url, config) as unknown as Promise<T>;
  },
  post<T>(url: string, data?: unknown, config?: CustomRequestConfig): Promise<T> {
    return service.post<ApiResult<T>>(url, data, config) as unknown as Promise<T>;
  },
  put<T>(url: string, data?: unknown, config?: CustomRequestConfig): Promise<T> {
    return service.put<ApiResult<T>>(url, data, config) as unknown as Promise<T>;
  },
  // 这里的 config 会完美接收 api.ts 中传来的 { data: ids, params: {...} }
  delete<T>(url: string, config?: CustomRequestConfig): Promise<T> {
    return service.delete<ApiResult<T>>(url, config) as unknown as Promise<T>;
  },
};

export default request;
