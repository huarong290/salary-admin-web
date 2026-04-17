// src/api/auth/index.ts
import request from '@/utils/request';
// 👇 统一从独立的数据字典中引入纯类型 (加上 type 关键字满足严格模式)
import type {
  UserLoginReqDTO,
  TokenRefreshReqDTO,
  TokenResDTO,
  CaptchaResDTO,
  LoginResultDTO,
  MfaVerifyReqDTO,
} from '@/types/auth/auth';

/**
 * 获取图形验证码
 */
export function getCaptchaApi() {
  return request.get<CaptchaResDTO>('/auth/captcha');
}

/**
 * 用户登录
 * 返回值类型从 TokenResDTO 更改为 LoginResultDTO，兼容 2FA 场景
 */
export function loginApi(data: UserLoginReqDTO) {
  // 设置 noToken: true 绕过请求拦截器里的 Token 注入
  return request.post<LoginResultDTO>('/auth/login', data, { noToken: true });
}

/**
 * 刷新令牌
 */
export function refreshTokenApi(data: TokenRefreshReqDTO) {
  return request.post<TokenResDTO>('/auth/refresh', data, { noToken: true });
}

/**
 * 用户登出
 * 逻辑：通知后端销毁当前会话（AccessToken 黑名单及删除 RefreshToken）
 * 注意：此接口不需要传参，请求头会自动带上当前 Authorization Token
 */
export function logoutApi() {
  return request.post<void>('/auth/logout');
}

/**
 *  MFA 两阶段验证接口
 * 携带临时令牌和动态验证码换取真实的 AccessToken
 */
export function verifyMfaApi(data: MfaVerifyReqDTO) {
  return request.post<TokenResDTO>('/auth/verify-mfa', data, { noToken: true });
}
