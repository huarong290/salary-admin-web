// src/types/rolemenu/rolemenu.ts

/**
 * 角色分配菜单请求参数 DTO
 * 与后端 com.salary.admin.model.dto.rolemenu.RoleMenuAssignReqDTO 保持绝对一致
 */
export interface RoleMenuAssignReqDTO {
  /**
   * 角色主键ID
   */
  roleId: number;

  /**
   * 菜单ID列表 (传空数组代表清空该角色的所有权限)
   */
  menuIds: number[];
}
