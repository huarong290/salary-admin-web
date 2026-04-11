// src/types/salary/kpirecord/kpiRecord.ts

import type { PageQuery } from '@/types/common';

/** 员工月度绩效考核视图对象 VO (用于大盘展示) */
export interface SalaryKpiRecordVO {
  /** 主键ID */
  id: number;
  /** 员工ID */
  employeeId: number;
  /** 员工姓名 (聚合字段) */
  employeeName?: string;
  /** 员工工号 (聚合字段) */
  employeeCode?: string;
  /** 所属部门 (聚合字段) */
  departmentName?: string;
  /** 关联的薪资周期ID */
  periodId: number;
  /** 考核/结算月份 (YYYYMM) */
  settlementMonth: string;
  /** 最终绩效评级 (如: S, A, B, C, D) */
  kpiGrade?: string;
  /** 考核打分 */
  kpiScore?: number;
  /** 换算后的绩效系数 (如: 1.2000) */
  kpiCoefficient?: number;
  /** 打分人/考核人 */
  evaluateBy?: string;
  /** 考核评语/说明 */
  evaluateRemark?: string;
  /** 审核流转状态: 0-打分中/草稿, 1-已确认/定稿, 2-申诉中 */
  auditStatus: number;
  /** 版本生效标识: 1-当前生效, 0-历史作废 */
  effectiveFlag: number;
  /** 最近一次操作时间 */
  updateTime?: string;
}

/** 分页查询绩效大盘请求参数 */
export interface KpiRecordQueryReqDTO extends PageQuery {
  /** 搜索关键词 (员工姓名/工号) */
  keyword?: string;
  /** 年份查询 */
  year?: string;
  /** 结算月份 (如: 202604) */
  settlementMonth?: string;
  /** 审核流转状态 */
  auditStatus?: number;
  /** 部门ID筛选 */
  departmentId?: number | string;
}

/** 批量初始化绩效草稿单请求参数 */
export interface KpiBatchInitReqDTO {
  /** 结算月份 (必填) */
  settlementMonth: string;
}

/** 提交绩效打分请求参数 */
export interface KpiEvaluateReqDTO {
  /** 绩效记录ID */
  id: number;
  /** 最终绩效评级 (必填) */
  kpiGrade: string;
  /** 考核具体分数 (选填) */
  kpiScore?: number;
  /** 考核评语 (选填) */
  evaluateRemark?: string;
}
