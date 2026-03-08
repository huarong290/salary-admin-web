// src/api/user/index.ts

import request from '@/utils/request';
import type { UserInfoDTO } from '@/types/user/user.ts';

/**
 * 获取当前登录用户信息（聚合接口）
 * 包含：基本信息、角色列表、权限标识、动态菜单树
 */
export function getUserInfoApi() {
  return request.get<UserInfoDTO>('/user/userInfo');
}
