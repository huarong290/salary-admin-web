// src/types/auth/auth.ts
/**
 * ================================
 * Auth 模块类型定义
 * ================================
 * 用于前端与后端接口交互时的参数和返回值约束。
 * 保证与后端 DTO (UserLoginReqDTO) 完全匹配。
 */

/** 客户端环境信息 (嵌套在登录请求中) */
export interface ClientInfoDTO {
  os?: string;
  browser?: string;
  version?: string;
  // 其他根据你后端 ClientInfoDTO 实际定义的字段补充
}

/** 用户登录请求参数 (对应 UserLoginReqDTO) */
export interface UserLoginReqDTO {
  username: string;
  password: string;
  captchaCode: string;
  captchaId: string;
  clientInfo: ClientInfoDTO;
}

/** 令牌刷新请求参数 (对应 TokenRefreshReqDTO) */
export interface TokenRefreshReqDTO {
  refreshToken: string;
  deviceId?: string;
}
/** 认证令牌响应对象 (对应 TokenResDTO) */
export interface TokenResDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  deviceId?: string;
  clientType?: string;
  ip?: string;
  refreshExpiresIn?: number;
}
/** 图形验证码响应对象 (对应 CaptchaResDTO) */
export interface CaptchaResDTO {
  /** 验证码唯一标识 (对应后端的 Redis Key) */
  captchaId: string;
  /** 验证码图片 (Base64字符串，通常自带 data:image/png;base64, 前缀) */
  captchaImage: string;
  /** 过期时间 (秒/毫秒) */
  expireTime: number;
  /** 是否启用验证码动态开关 (true:需输入, false:隐藏输入框) */
  captchaEnabled: boolean;
}
