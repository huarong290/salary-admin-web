// src/types/salary/summary/summary.ts
import type { PageQuery } from '@/types/common.ts';

/** * ==========================================
 * 1. 薪资明细快照结构 (JSON 内部结构)
 * ==========================================
 */
export interface SalaryDetailItemDTO {
  /**项目编码 */
  itemCode: string;
  /**项目名称 */
  itemName: string;
  /**结算金额 */
  settlementAmount: number;
  /**原始金额 */
  originalAmount?: number;
  /**原始币种 */
  originalCurrency?: string;
  /**业务分类字典值 */
  categoryDictValue?: string;
  /**来源标识 (BASE, ARCHIVE, CALC) */
  source?: string;
  /**计算过程快照/公式日志 */
  calcLog?: string;
  /**排序号 */
  sort?: number;
}
/** 薪资结算全量快照 (JSON 解析后的结构) */
export interface SalarySnapshotDTO {
  /**当月计薪总天数 */
  monthDays?: number;
  /**实际出勤天数 */
  attendanceDays?: number;
  /**档案标准基础薪资 */
  baseSalary?: number;
  /**结算币种 */
  settlementCurrency?: string;
  /**核算汇率 */
  exchangeRate?: number;
  /**应发合计 (Gross) */
  grossSalary?: number;
  /**扣款合计 (Deduction)*/
  deductionTotal?: number;
  /**税费合计 (Tax)*/
  taxTotal?: number;
  /**实发合计 (Net)*/
  netSalary?: number;
  // 核心：三大分组明细
  /**收入明细*/
  income: SalaryDetailItemDTO[];
  /**扣款明细*/
  deduction: SalaryDetailItemDTO[];
  /**税费明细*/
  tax: SalaryDetailItemDTO[];
  /**公司成本明细*/
  companyExpense: SalaryDetailItemDTO[];
  /**计算时的自动备注*/
  calcRemark?: string;
}

/** * ==========================================
 * 2. 薪资汇总列表与详情 VO (对应后端 SalarySummaryVO)
 * ==========================================
 */
export interface SalarySummaryVO {
  id: number;
  /**员工ID */
  employeeId: number;
  /**员工Code */
  employeeCode: string;
  /**员工名称*/
  employeeName: string;
  /**周期ID*/
  periodId: number;
  /**结算月份*/
  settlementMonth: string;
  /**结算开始日期*/
  periodStartDate?: string;
  /**结算结束日期*/
  periodEndDate?: string;

  /* ================== 💰 核心汇总金额 ================== */
  /**收入合计*/
  incomeTotal: number;
  /**扣款合计*/
  deductionTotal: number;
  /**税费合计*/
  taxTotal: number;
  /**应发工资 (税前)*/
  grossSalary: number;
  /**实发工资 (税后/最终)*/
  netSalary: number;

  /* ================== 🏧 状态控制 ================== */
  /**计算状态: 0-未计算, 1-成功, 2-失败*/
  calcStatus: number;
  /**发放状态: 0-未支付, 1-已支付, 2-支付失败*/
  paymentStatus: number;
  /**锁定标识: 1-已锁定(防篡改), 0-未锁定*/
  lockFlag: number;
  /**计算版本号 (用于追溯)*/
  calcVersion: number;

  /* ================== 📦 结构化快照 ================== */
  /** * 薪资单详情快照
   * (列表查询时可能为空，调用详情接口时完整返回)
   */
  details?: SalarySnapshotDTO;
  /**备注*/
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

/** * ==========================================
 * 3. 接口请求 DTO
 * ==========================================
 */

/** 分页查询薪资汇总单请求参数 */
export interface SummaryQueryReqDTO extends PageQuery {
  /**员工姓名/工号*/
  keyword?: string;
  /**结算月份 (如: 202603)*/
  settlementMonth?: string;
  /**计算状态*/
  calcStatus?: number;
  /**发放状态*/
  paymentStatus?: number;
}

/**  触发薪资计算请求参数 (核心计算引擎入口预留) */
export interface SummaryCalcReqDTO {
  /**结算月份*/
  settlementMonth: string;
  /**指定员工计算 (为空则计算全员)*/
  employeeIds?: number[];
  /**手工备注*/
  remark?: string;
}

/** 🚀 统一的状态变更操作 DTO (锁定/解锁/批量) */
export interface SalarySummaryOperateDTO {
  /** 待操作的 ID 集合 */
  ids: (number | string)[];
  /** 目标锁定状态：0-解锁, 1-锁定 */
  lockFlag: number;
  /** 操作备注 */
  remark?: string;
}
