// src/types/salary/archive/archive.ts

import type { PageQuery } from '@/types/common';
import type { ArchiveItemReqDTO, SalaryArchiveItemVO } from '../archiveitem/archiveItem';

/** 分页查询薪资档案请求参数 */
export interface ArchiveQueryReqDTO extends PageQuery {
  /** 员工姓名/编号模糊搜索 */
  keyword?: string;
  /** 是否仅查询当前最新版本 (1-是, 0-否) */
  latestFlag?: number;
  /** 审核状态: 0-待审核, 1-已生效, 2-被驳回 */
  auditStatus?: number;
  /** 部门名称筛选 */
  department?: string;
}

/**
/**
 * 员工入职定薪请求参数 (DTO)
 */
export interface ArchiveInitReqDTO {
  /** 员工ID (关联 salary_employee) */
  employeeId: number;
  /** 基本工资/转正底薪 */
  baseSalary: number;
  /** 试用期底薪 (选填) */
  probationBaseSalary?: number;
  /** 默认结算币种 (如: CNY, USD) */
  currency: string;
  currencyLabel?: string;
  taxRuleCode: string;

  /** 生效日期 (YYYY-MM-DD) */
  effectiveDate?: string;
  expiryDate?: string;
  /** 调薪原因 (强管控必填) */
  changeReason: string;
  remark?: string;
  /** 级联保存的附加薪资项列表 */
  archiveItems: ArchiveItemReqDTO[];
}

/**
 * 员工调薪申请请求参数 (DTO)
 * 结构与定薪高度相似，但 changeReason 是强管控必填项
 */
export interface ArchiveAdjustReqDTO extends ArchiveInitReqDTO {
  /** 调薪草稿档案的ID (对应后端 id) */
  id: number;
}

/**
 * 薪资档案审批请求参数 (DTO)
 */
export interface ArchiveAuditReqDTO {
  /** 调薪草稿档案的ID (对应后端 id) */
  id: number;
  /** * 审核状态 (对应后端 auditStatus)
   * 1 - 通过
   * 2 - 驳回
   */
  auditStatus: number;
  /** 审核意见或驳回原因 (驳回时建议必填) */
  remark?: string;
}

/**
 * 薪资档案详情视图对象 (VO)
 */
export interface SalaryArchiveVO {
  /** 档案ID */
  id: number;
  /** 员工ID (关联 salary_employee) */
  employeeId: number;
  /**  员工姓名 (动态关联填充) */
  employeeName: string;
  /** 员工编号 (工号) */
  employeeCode: string;
  /** 版本号 (每次调薪递增) */
  version: number;

  /** 基本工资/转正底薪 */
  baseSalary: number;
  /** 试用期底薪 (选填) */
  probationBaseSalary?: number;

  /** 审核状态: 0-草稿/待审, 1-已生效, 2-驳回 */
  auditStatus: number;
  /** 是否当前最新版本: 0-历史, 1-最新 */
  latestFlag: number;

  /** 默认结算币种 (如: CNY, USD) */
  currency: string;
  currencyLabel?: string;
  taxRuleCode: string;

  /** 调薪原因 (如: 年度普调、晋升) */
  changeReason: string;
  /** 生效起始日期 (YYYY-MM-DD) */
  effectiveDate: string;
  /** 失效日期 (YYYY-MM-DD) */
  expiryDate: string;

  /** 档案备注 */
  remark: string;
  /** 聚合的明细项列表 */
  archiveItems: SalaryArchiveItemVO[];
}
