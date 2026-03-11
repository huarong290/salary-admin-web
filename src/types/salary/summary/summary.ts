// src/types/salary/summary/summary.ts

import type { PageQuery } from '@/types/common.ts';

/** 薪资结算汇总返回对象 VO (展示最终的工资单和跨国结算结果) */
export interface SummaryVO {
  /** 汇总单ID */
  id: number;
  /** 薪资周期ID (关联 salary_period) */
  periodId: number;

  /* ================== 🌟 扩展显示字段 ================== */
  /** 员工姓名 (动态关联查询填充) */
  employeeName?: string;
  /** 结算月份 (如: 202603，动态关联查询填充) */
  settlementMonth?: string;

  /* ================== 💰 核心财务与多币种快照 ================== */
  /** 结算币种 (如: CNY/PHP/USDT) */
  currency?: string;
  /** 汇率 (1本币兑X目标币快照) */
  exchangeRate?: number | string;
  /** 应发小计 (本币：汇总所有 IncomeDetail) */
  salarySubtotal?: number | string;
  /** 扣款小计 (本币：汇总所有 DeductionDetail) */
  salaryDeductionTotal?: number | string;
  /** 最终结算薪资 (本币：应发 - 应扣) */
  salaryTotal?: number | string;
  /** 实发金额 (目标币：根据汇率转换后实际到账金额) */
  salaryConverted?: number | string;
  /** 折合人民币 (对账存档) */
  salaryRmb?: number | string;
  /** 折合USDT (对账存档) */
  salaryUsdt?: number | string;

  /* ================== 🏧 支付状态 ================== */
  /** 发放账号/钱包地址 (快照) */
  targetAccount?: string;
  /** 支付状态 (0:未支付, 1:已支付, 2:失败, 3:锁定) */
  paymentStatus?: number | boolean;
  /** 实际发放/确认时间 */
  payTime?: string;

  /** 结算备注 */
  remark?: string;
  /** 结算单生成时间 */
  createTime?: string;
}

/** 分页查询薪资汇总单请求参数 */
export interface SummaryQueryReqDTO extends PageQuery {
  /** 指定查询的薪资周期ID */
  periodId?: number | string;
  /** 结算月份 (如: 202603) */
  settlementMonth?: string;
  /** 员工ID (用于查询某员工的历史工资单) */
  employeeId?: number | string;
}

/** 🚨 触发薪资计算请求参数 (核心计算引擎入口) */
export interface SummaryCalcReqDTO {
  /** 需要进行结算的薪资周期ID - 必填项 */
  periodId: number | string;
  /** 手工备注 (如: 2026年3月特殊结算) */
  remark?: string;
}
