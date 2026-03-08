// src/types/user/index.ts

import type { MenuTreeVO } from '@/types/menu/menu.ts';

/** 用户基本信息 */
export interface SysUserVO {
  /** 用户ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 用户昵称 */
  nickname: string;
  /** 用户头像 */
  avatar?: string;
  /** 用户邮箱 */
  email?: string;
  /** 用户手机号 */
  phoneNumber?: string;
  /** 用户部门 */
  deptName?: string;
}

/** 聚合用户信息响应对象 */
export interface UserInfoDTO {
  /** 用户基础信息 */
  user: SysUserVO;
  /** 角色标识列表 (如: ['admin', 'hr']) */
  roles: string[];
  /** 权限标识列表 (如: ['sys:user:add', 'sys:user:edit']) */
  permissions: string[];
  /** 🚨 动态菜单树：用于 Sidebar 渲染 */
  menus: MenuTreeVO[];
}
