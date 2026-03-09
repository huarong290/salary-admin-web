// src/types/role/role.ts

/** 角色信息展示视图对象 (用于表格数据展示与下拉框) */
export interface SysRoleVO {
  /** 角色主键ID */
  id: number;
  /** 角色名称 (如: 超级管理员, 财务主管) */
  roleName: string;
  /** 角色编码 (如: admin, finance) */
  roleCode: string;
  /** 显示顺序 (数字越小越靠前) */
  roleSort: number;
  /** 角色状态 (0:停用, 1:正常) */
  roleStatus: number;
  /** 角色描述 */
  roleDesc?: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime?: string;
  /** 修改时间 */
  updateTime?: string;
}

/** 分页查询角色请求参数 (RoleQueryReqDTO) */
export interface RoleQueryReqDTO {
  /** 当前页码 */
  pageNum: number;
  /** 每页条数 */
  pageSize: number;
  /** 角色名称 (支持模糊查询) */
  roleName?: string;
  /** 角色编码 (支持精确/模糊查询，由后端决定) */
  roleCode?: string;
  /** 角色状态 (0:停用, 1:正常) */
  roleStatus?: number;
}

/** 新增角色请求参数 (RoleAddReqDTO) */
export interface RoleAddReqDTO {
  /** 角色名称 - 必填项 */
  roleName: string;
  /** 角色编码 (如 admin) - 必填项 */
  roleCode: string;
  /** 显示顺序 - 必填项 */
  roleSort: number;
  /** 角色状态 (0:停用, 1:正常)，默认 1 */
  roleStatus?: number;
  /** 角色描述 */
  roleDesc?: string;
  /** 备注 */
  remark?: string;
}

/** 修改角色请求参数 (RoleEditReqDTO) */
export interface RoleEditReqDTO {
  /** 角色主键ID - 必填项 */
  id: number | string;
  /** 角色名称 - 必填项 */
  roleName: string;
  /** 角色编码 (如 admin) - 必填项 */
  roleCode: string;
  /** 显示顺序 - 必填项 */
  roleSort: number;
  /** 角色状态 (0:停用, 1:正常) */
  roleStatus?: number;
  /** 角色描述 */
  roleDesc?: string;
  /** 备注 */
  remark?: string;
}

/** * 分页通用返回结果 (PageResult)
 * 💡 注：如果该类型已在 '@/types/common' 中定义，建议直接 import 复用，无需在此重复声明
 */
export interface PageResult<T> {
  /** 总记录数 */
  total: number;
  /** 列表数据 */
  records: T[];
}
