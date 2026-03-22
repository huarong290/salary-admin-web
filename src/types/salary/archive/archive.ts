// src/types/salary/archive/archive.ts

import type { PageQuery } from '@/types/common.ts';
import type { ArchiveItemDTO } from '@/types/salary/archiveitem/archiveItem.ts';

/** 薪资档案返回视图对象 VO (包含版本历史及定薪明细) */
export interface SalaryArchiveVO {
  /** 档案ID */
  id: number;
  /** 员工ID (关联 salary_employee) */
  employeeId: number;
  /** 🌟 员工姓名 (动态关联填充) */
  employeeName: string;
  /** 员工编号 (工号) */
  employeeCode: string;
  /** 版本号 (每次调薪递增) */
  version: number;
  /** 是否当前最新版本: 0-历史, 1-最新 */
  isLatest: number;
  /** 生效起始日期 (YYYY-MM-DD) */
  effectiveDate: string;
  /** 失效日期 (YYYY-MM-DD) */
  expiryDate?: string;
  /** 审核状态: 0-草稿/待审, 1-已生效, 2-驳回 */
  auditStatus: number;
  /** 基本工资/转正底薪 */
  baseSalary: number;
  /** 全勤奖 */
  fullAttendanceBonus: number;
  /** 试用期底薪 (选填) */
  probationBaseSalary?: number;
  /** 默认结算币种 (如: CNY, USD) */
  currency: string;
  /** 调薪原因 (如: 年度普调、晋升) */
  changeReason?: string;
  /** 计税方案: 0-不计税, 1-居民个人所得税, 2-劳务报酬税" */
  taxScheme?: number;
  /** 档案备注 */
  remark?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 🌟 关联的薪资配置明细项列表 */
  items: ArchiveItemDTO[];
}

/** 分页查询薪资档案请求参数 */
export interface ArchiveQueryReqDTO extends PageQuery {
  /** 员工姓名/编号模糊搜索 */
  keyword?: string;
  /** 是否仅查询当前最新版本 (1-是, 0-否) */
  isLatest?: number;
  /** 部门名称筛选 */
  department?: string;
}

/** 新增定薪/调薪请求参数 (发起版本更迭) */
export interface ArchiveAddReqDTO {
  /** 员工ID - 必填项 */
  employeeId: number | string;
  /** 基本工资/转正底薪 - 必填项 */
  baseSalary: number;
  /** 全勤奖 */
  fullAttendanceBonus: number;
  /** 试用期底薪 */
  probationBaseSalary?: number;
  /** 生效起始日期 - 必填项 (YYYY-MM-DD) */
  effectiveDate: string;
  /** 默认结算币种 */
  currency?: string;
  /** 调薪原因 */
  changeReason?: string;
  /** 计税方案: 0-不计税, 1-居民个人所得税, 2-劳务报酬税" */
  taxScheme?: number;
  /** 档案版本 */
  version: number;
  /** 档案备注 */
  remark?: string;
  /** 🌟 薪资项明细列表 - 包含新增的收入与扣款配置 */
  items: ArchiveItemDTO[];
}

/** 🌟 薪资档案审核请求参数 (处理版本生效/驳回) */
export interface ArchiveAuditDTO {
  /** 薪资档案主键ID - 必填项 */
  id: number;
  /** 审核状态结果: 1-审核通过(生效), 2-审核驳回 - 必填项 */
  auditStatus: number;
  /** 审核意见或驳回原因 (驳回时建议必填) */
  remark?: string;
}
