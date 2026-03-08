// src/api/user/index.ts

import request from '@/utils/request';
import type {
  SysUserVO,
  UserAddReqDTO,
  UserEditReqDTO,
  UserInfoDTO,
  UserQueryReqDTO,
} from '@/types/user/user.ts';
import type { PageResult } from '@/types/common.ts';

/**
 * 获取当前登录用户信息（聚合接口）
 * 包含：基本信息、角色列表、权限标识、动态菜单树
 */
export function getUserInfoApi() {
  return request.get<UserInfoDTO>('/user/userInfo');
}

/**
 * 分页查询用户列表
 * @param data 查询条件参数
 */
export function getUserPageApi(data: UserQueryReqDTO) {
  return request.post<PageResult<SysUserVO>>('/user/page', data);
}

/**
 * 新增用户
 * @param data 新增用户信息
 * @returns 返回新生成的记录 ID
 */
export function addUserApi(data: UserAddReqDTO) {
  return request.post<number>('/user/add', data);
}

/**
 * 修改用户基本信息
 * @param data 修改用户信息 (不含用户名)
 */
export function editUserApi(data: UserEditReqDTO) {
  return request.put<number>('/user/edit', data);
}

/**
 * 重置用户密码
 * @param data 包含用户ID和新密码的对象
 */
export function resetUserPwdApi(data: { id: number | string; password?: string }) {
  return request.put<boolean>('/user/resetPwd', data);
}

/**
 * 单条删除用户
 * @param id 用户ID
 * @param logicalDelete 是否逻辑删除 (默认 true)
 */
export function deleteUserApi(id: number | string, logicalDelete: boolean = true) {
  return request.delete<boolean>(`/user/delete/${id}`, {
    params: { logicalDelete },
  });
}

/**
 * 批量删除用户
 * @param ids 用户ID数组
 * @param logicalDelete 是否逻辑删除 (默认 true)
 */
export function batchDeleteUserApi(ids: (number | string)[], logicalDelete: boolean = true) {
  // 💡 注意：Axios 的 delete 方法传递 body 数据时，必须包裹在 config 对象的 data 属性中
  return request.delete<boolean>('/user/delete', {
    params: { logicalDelete },
    data: ids,
  });
}
