// src/types/salary/paymentrecord/index.ts

import type { PageQuery } from '@/types/common.ts';

/** 薪资结算明细返回对象 VO (记录员工单月的最终核算结果与快照) */
export interface SalaryPaymentRecordVO {
  /** 明细记录唯一ID */
  id: number;
  /** 关联的汇总批次ID (对应 salary_summary.id) */
  summaryId: number;
  /** 员工ID (关联 salary_employee) */
  employeeId: number;
  /** 关联的薪资档案ID (定薪依据快照版本) */
  archiveId: number;

  /* ================== 🌟 员工及档案信息 (视图扩展) ================== */
  /** 员工姓名 (动态关联查询) */
  employeeName?: string;
  /** 员工工号 */
  employeeNo?: string;
  /** 结算月份 (如: 202603) */
  settlementMonth?: string;

  /** 结算币种 (如: CNY, PHP, USDT) */
  settlementCurrency: string;
  /* ================== 💰 核心核算金额 (本币/基准) ================== */
  /** 核算底薪 (取自当时档案的 base_salary) */
  baseSalary: number;
  /** 收入项合计 (津贴、奖金等加项总和) */
  incomeTotal: number;
  /** 扣款项合计 (五险一金、请假扣款等减项总和) */
  deductionTotal: number;
  /** 最终实发工资 (计算公式: 底薪 + 收入项 - 扣款项) */
  finalSalary: number;

  /* ================== 🔧 核算状态与快照 ================== */
  /** 核算模式: 0-系统自动核算, 1-人工手动调整 */
  isManual: number;
  /** 🌟 核算明细快照 JSON (存储核算当时的具体加减项详情，不可篡改依据) */
  detailJson?: string;
  /** 解析后的明细项快照列表 (前端渲染使用) */
  snapshotItems?: ArchiveItemDetailVO[];

  /** 备注信息 (手动调整原因等) */
  remark?: string;
  /** 核算生成时间 */
  createTime?: string;
  /** 最后更新时间 (手动微调时间) */
  updateTime?: string;
}

/** 薪资项明细快照数据对象 (detailJson 的解析结构) */
export interface ArchiveItemDetailVO {
  /** 薪资项名称 (如: 交通补贴, 个人所得税) */
  itemName: string;
  /** 薪资项类型: 1-收入(加项), 2-扣款(减项) */
  itemType: number;
  /** 核算时的具体金额 */
  amount: number;
}

/** 分页查询薪资结算明细请求参数 */
export interface PaymentRecordQueryReqDTO extends PageQuery {
  /** 汇总单ID (关联特定发薪批次) */
  summaryId?: number | string;
  /** 员工ID */
  employeeId?: number | string;
  /** 员工姓名/工号关键字 */
  employeeName?: string;
  /** 是否经过人工调整 (1-是, 0-否) */
  isManual?: number;
}

/** 🌟 薪资明细微调请求参数 (财务人工修正场景) */
export interface PaymentRecordUpdateDTO {
  /** 明细记录ID - 必填项 */
  id: number | string;
  /** 修正后的最终实发金额 - 必填项 */
  finalSalary: number;
  /** 手动调整备注 - 必填项 (财务合规审计要求) */
  remark: string;
}
