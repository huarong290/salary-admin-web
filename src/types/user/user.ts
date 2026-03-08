// src/types/user/index.ts

import type { MenuTreeVO } from '@/types/menu/menu';

/** 用户返回对象 VO (用于表格数据展示) */
export interface SysUserVO {
  /** 用户ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 用户昵称 */
  nickname: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 头像 */
  avatar?: string;
  /** 是否启用 (0:停用, 1:正常) */
  status?: number;
  /** 性别 (0:未知, 1:男, 2:女) */
  sex?: number;
  /** 最后登录时间 */
  lastLoginTime?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/** 聚合用户信息响应对象 (当前登录用户) */
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

/** 分页查询用户请求参数 (UserQueryReqDTO) */
export interface UserQueryReqDTO {
  /** 当前页码 */
  pageNum: number;
  /** 每页条数 */
  pageSize: number;
  /** 用户名 (支持模糊查询) */
  username?: string;
  /** 状态 (0:停用, 1:正常) */
  status?: number;
}

/** 新增用户请求参数 (UserAddReqDTO) */
export interface UserAddReqDTO {
  /** 用户名 (登录账号) - 必填项 */
  username: string;
  /** 用户昵称 - 必填项 */
  nickname: string;
  /** 登录密码 (不传则使用系统默认密码) */
  password?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 状态 (0:禁用, 1:正常)，默认 1 */
  status?: number;
  /** 性别 (0:未知, 1:男, 2:女)，默认 0 */
  sex?: number;
}

/** 修改用户请求参数 (UserEditReqDTO) */
export interface UserEditReqDTO {
  /** 用户ID - 必填项 */
  id: number | string;
  /** 💡 注意：修改时通常不允许改登录账号(username)，此处已剔除 */

  /** 用户昵称 */
  nickname?: string;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 状态 (0:禁用, 1:正常) */
  status?: number;
  /** 性别 (0:未知, 1:男, 2:女) */
  sex?: number;
}

/** 分页通用返回结果 (PageResult) */
export interface PageResult<T> {
  /** 总记录数 */
  total: number;
  /** 列表数据 */
  records: T[];
}
