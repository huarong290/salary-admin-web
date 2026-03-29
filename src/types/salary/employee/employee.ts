// src/types/salary/employee/employee.ts

import type { PageQuery } from '@/types/common.ts';

/**
 * 员工档案返回对象 VO (用于表格数据展示)
 * 对应后端: com.salary.admin.model.vo.salary.employee.EmployeeVO
 */
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
  /** 岗位名称/职级 */
  jobTitle?: string;
  /** 在职状态: 1-正式, 2-试用, 3-实习, 4-兼职/外包, 0-离职 */
  employmentStatus?: number;
  /** 是否转岗 (0:否, 1:是) */
  transferFlag?: number;
  /** 住宿状态 (0:不住宿, 1:公司宿舍, 2:外宿补贴) */
  accommodationStatus?: number;
  /** 入职日期 */
  entryDate?: string;
  /** 预计转正日期 */
  probationEndDate?: string;
  /** 实际离职日期 */
  actualLeaveDate?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 创建者 */
  createBy?: string;
  /** 在职状态文字标签 (后端冗余字段) */
  employmentStatusLabel?: string;
}

/**
 * 分页查询员工请求参数
 * 对应后端查询对象
 */
export interface EmployeeQueryReqDTO extends PageQuery {
  /** 员工姓名或工号 (支持模糊查询) */
  keyword?: string;
  /** 所属部门 */
  department?: string;
  /** 在职状态: 1-正式, 2-试用, 3-实习, 4-兼职/外包, 0-离职 */
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
  /** 岗位名称/职级 */
  jobTitle?: string;
  /** 在职状态: 1-正式, 2-试用, 3-实习, 4-兼职/外包, 0-离职 */
  employmentStatus?: number;
  /** 是否转岗 (0:否, 1:是) */
  transferFlag?: number;
  /** 住宿状态 (0:不住宿, 1:公司宿舍, 2:外宿) */
  accommodationStatus?: number;
  /** 入职日期 */
  entryDate?: string;
  /** 预计转正日期 */
  probationEndDate?: string;
  /** 实际离职日期 */
  actualLeaveDate?: string;
}

/** 修改员工请求参数 */
export interface EmployeeEditReqDTO extends EmployeeAddReqDTO {
  /** 员工ID - 必填项 */
  id: number | string;
}

/** 员工简易下拉选项对象 (用于 Select 远程搜索) */
export interface EmployeeOptionVO {
  /** 员工ID */
  id: number;
  /** 员工工号 */
  employeeCode: string;
  /** 员工姓名 */
  employeeName: string;
}
