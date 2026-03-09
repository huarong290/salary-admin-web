// src/api/rolemenu/index.ts
import request from '@/utils/request';
import type { RoleMenuAssignReqDTO } from '@/types/rolemenu/rolemenu';

/**
 * 获取角色拥有的菜单ID列表 (用于回显)
 * @param roleId 角色主键ID
 * @returns 返回纯数字数组，例如: [1, 101, 102]
 */
export const getRoleMenuIdsApi = (roleId: number) => {
  // 只保留一个泛型参数 number[]，代表后端 ApiResult 里的 data 是一个数字数组
  return request.get<number[]>(`/rolemenu/listMenuIds/${roleId}`);
};

/**
 * 给角色分配菜单 (覆盖旧权限)
 * @param data 包含 roleId 和 menuIds 数组的对象
 */
export const assignRoleMenuApi = (data: RoleMenuAssignReqDTO) => {
  //只保留一个泛型参数 void 或者 any (因为这个接口只要成功就行，不需要返回具体数据)
  return request.post<void>('/rolemenu/assignMenus', data);
};
