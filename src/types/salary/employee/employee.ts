// src/types/salary/employee/employee.ts

import type { PageQuery } from '@/types/common.ts';

/** 员工档案返回对象 VO (用于表格数据展示) */
export interface EmployeeVO {
  /** 员工ID */
  id: number;
  /** 员工工号 */
  employeeCode: string;
  /** 员工姓名 */
  employeeName: string;
  /** 所属公司/主体名称 */
  companyName?: string;
  /** 所属部门 */
  department?: string;
  /** 在职状态 (0:离职, 1:在职) */
  employmentStatus?: number;
  /** 是否已转正 (false:试用期, true:已转正) */
  isTransferred?: boolean;
  /** 住宿状态 (0:不住宿, 1:公司宿舍, 2:外租补贴) */
  accommodationStatus?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 创建者 */
  createBy?: string;
}

/** 分页查询员工请求参数 */
export interface EmployeeQueryReqDTO extends PageQuery {
  /** 员工姓名或工号 (支持模糊查询) */
  keyword?: string;
  /** 所属部门 */
  department?: string;
  /** 在职状态 (0:离职, 1:在职) */
  employmentStatus?: number;
}

/** 新增员工请求参数 */
export interface EmployeeAddReqDTO {
  /** 员工工号 - 必填项 */
  employeeCode: string;
  /** 员工姓名 - 必填项 */
  employeeName: string;
  /** 所属公司/主体名称 */
  companyName?: string;
  /** 所属部门 */
  department?: string;
  /** 在职状态 (0:离职, 1:在职)，默认 1 */
  employmentStatus?: number;
  /** 是否已转正，默认 false */
  isTransferred?: boolean;
  /** 住宿状态 */
  accommodationStatus?: number;
}

/** 修改员工请求参数 */
export interface EmployeeEditReqDTO extends EmployeeAddReqDTO {
  /** 员工ID - 必填项 */
  id: number | string;
}
