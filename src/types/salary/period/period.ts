// src/types/salary/period/period.ts
import type { PageQuery } from '@/types/common.ts';

/** 薪资周期返回对象 VO (用于展示月度出勤及周期基础信息) */
export interface PeriodVO {
  /** 周期ID */
  id: number;
  /** 员工ID (关联 salary_employee) */
  employeeId: number;
  /** 🌟 员工姓名 (动态关联填充，用于前端直观展示) */
  employeeName?: string;
  /** 在岗月份  */
  workMonth?: string;
  /** 结算月份 (格式：YYYYMM) */
  settlementMonth: string;
  /** 周期开始日期 (YYYY-MM-DD) */
  startDate?: string;
  /** 周期结束日期 (YYYY-MM-DD) */
  endDate?: string;
  /** 本月自然天数 */
  monthDays?: number;
  /** 实际出勤天数 */
  attendanceDays?: number;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 创建者 */
  createBy?: string;
}

/** 分页查询薪资周期请求参数 */
export interface PeriodQueryReqDTO extends PageQuery {
  /** 指定员工ID */
  employeeId?: number | string;
  /** 员工姓名模糊搜索 */
  keyword?: string;
  /** 结算月份 (如: 202603) */
  settlementMonth?: string;
  /** 在岗月份 */
  workMonth?: string;
  /** 部门名称筛选 */
  department?: string;
}

/** 新增薪资周期请求参数 */
export interface PeriodAddReqDTO {
  /** 员工ID - 必填项 */
  employeeId: number | string;
  /** 在岗月份 */
  workMonth?: string;
  /** 结算月份- 必填项 */
  settlementMonth: string;
  /** 周期开始日期 */
  startDate?: string;
  /** 周期结束日期 */
  endDate?: string;
  /** 本月自然天数 */
  monthDays?: number;
  /** 实际出勤天数 */
  attendanceDays?: number;
}

/** 修改薪资周期请求参数 */
export interface PeriodEditReqDTO extends PeriodAddReqDTO {
  /** 周期ID - 必填项 */
  id: number | string;
}

/** 薪资周期简易下拉选项对象 */
export interface PeriodOptionVO {
  /** 周期ID (备用) */
  id?: number | string;
  /** 展示文本 (如：2026-03) */
  label: string;
  /** 实际值 (如：202603) */
  value: string;
}
/** 批量初始化薪资周期请求参数 */
export interface PeriodBatchInitReqDTO {
  /** 结算月份 (格式：YYYYMM，必填) */
  settlementMonth: string;
  /** 在岗月份 (格式：YYYY-MM，可选) */
  workMonth?: string;
  /** 备注 */
  remark?: string;
}
