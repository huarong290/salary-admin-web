// src/api/userrole/index.ts
import request from '@/utils/request';
import type { UserRoleAssignReqDTO } from '@/types/userrole/userrole';

/**
 *  提醒：需要你在后端 SysUserRoleController 中补充这个回显接口！
 * 获取用户拥有的角色ID列表
 */
export const getUserRoleIdsApi = (userId: number) => {
  return request.get<number[]>(`/userrole/listRoleIds/${userId}`);
};

/**
 * 给用户分配角色
 */
export const assignUserRoleApi = (data: UserRoleAssignReqDTO) => {
  return request.post<void>('/userrole/assignRoles', data);
};
