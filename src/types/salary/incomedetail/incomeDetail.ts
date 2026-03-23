// src/types/salary/incomedetail/incomeDetail.ts

import type { PageQuery } from '@/types/common.ts';

/** 收入明细流水返回对象 VO (展示员工在特定周期内的各项收入) */
export interface IncomeDetailVO {
  /** 明细ID */
  id: number;
  /** 周期ID (关联 salary_period) */
  periodId: number;
  /** 收入类型ID (关联 salary_income_type) */
  incomeTypeId: number;
  /**  收入项目名称 (动态关联填充，如: 岗位津贴) */
  incomeTypeName?: string;
  /**  收入分类名称 (后端自动烙印，如: 奖金/津贴) */
  categoryName?: string;
  /**  员工id  */
  employeeId: number;
  /**  员工姓名 (动态通过 periodId 关联填充) */
  employeeName?: string;
  //  扩容：多币种展示字段
  /** 原币种 (如 CNY, PHP, USDT) */
  currency?: string;
  /** 原币金额 */
  originalAmount?: number | string;
  /** 录入时汇率 */
  exchangeRate?: number | string;
  /** 💰 金额 (使用 number | string 兼容后端 BigDecimal 防止精度丢失) */
  amount: number | string;
  /** 🌟 新增：结算币种 (入账时的系统本位币，如 CNY, USD) */
  settlementCurrency?: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime?: string;
  /** 创建者 */
  createBy?: string;
}

/** 分页查询收入明细请求参数 */
export interface IncomeDetailQueryReqDTO extends PageQuery {
  /** 指定查询的薪资周期ID */
  periodId?: number | string;
  /** 指定员工ID (用于查某员工的所有历史收入流水) */
  employeeId?: number | string;
}

/** 新增收入明细请求参数 */
export interface IncomeDetailAddReqDTO {
  /** 薪资周期ID - 必填项 */
  periodId: number | string;
  /** 收入类型ID - 必填项 */
  incomeTypeId: number | string;
  // 🌟 扩容：多币种录入字段（替代原本单一的 amount）
  /** 原币种 (默认 CNY) - 必填项 */
  currency: string;
  /** 原币金额 (不能为负数) - 必填项 */
  originalAmount: number | string;
  /** 汇率 (原币兑本币) - 必填项 */
  exchangeRate: number | string;
  /** 金额 (不能为负数) - 必填项 */
  amount?: number | string;
  /** 🌟 新增：结算币种 (入账时的系统本位币，如 CNY, USD) */
  settlementCurrency?: string;
  /** 备注 */
  remark?: string;
}

/** 🌟 修改收入明细请求参数 (大厂规范：继承 AddDTO 并强制要求传 ID) */
export interface IncomeDetailUpdateReqDTO extends IncomeDetailAddReqDTO {
  /** 明细ID - 修改时必填 */
  id: number;
}
