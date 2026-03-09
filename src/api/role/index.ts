// src/api/role/index.ts

import type {
  RoleAddReqDTO,
  RoleEditReqDTO,
  RoleQueryReqDTO,
  SysRoleVO,
} from '@/types/role/role.ts';
import type { PageResult } from '@/types/common.ts';
import request from '@/utils/request';

/**
 * 分页查询角色列表
 */
export function getRolePageApi(data: RoleQueryReqDTO) {
  return request.post<PageResult<SysRoleVO>>('/role/page', data);
}

/**
 * 获取所有正常状态角色 (用于给用户分配角色时的下拉框)
 */
export function listAllNormalRolesApi() {
  return request.get<SysRoleVO[]>('/role/listAll');
}

/**
 * 新增角色
 */
export function addRoleApi(data: RoleAddReqDTO) {
  return request.post<number>('/role/add', data);
}

/**
 * 修改角色基本信息
 */
export function editRoleApi(data: RoleEditReqDTO) {
  return request.put<number>('/role/edit', data);
}

/**
 * 单条删除角色
 */
export function deleteRoleApi(id: number | string, logicalDelete: boolean = true) {
  return request.delete<boolean>(`/role/delete/${id}`, {
    params: { logicalDelete },
  });
}

/**
 * 批量删除角色
 */
export function batchDeleteRoleApi(ids: (number | string)[], logicalDelete: boolean = true) {
  return request.delete<boolean>('/role/delete', {
    params: { logicalDelete },
    data: ids,
  });
}
