// src/types/userrole/userrole.ts

export interface UserRoleAssignReqDTO {
  /**
   * 用户主键ID
   */
  userId: number;
  /**
   * 角色ID列表(传空数组代表清空权限)
   */
  roleIds: number[];
}
