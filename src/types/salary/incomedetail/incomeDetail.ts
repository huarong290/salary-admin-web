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
  /** 🌟 收入项目名称 (动态关联填充，如: 岗位津贴) */
  incomeTypeName?: string;
  /** 🌟 员工姓名 (动态通过 periodId 关联填充) */
  employeeName?: string;
  /** 💰 金额 (使用 number | string 兼容后端 BigDecimal 防止精度丢失) */
  amount: number | string;
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
  /** 金额 (不能为负数) - 必填项 */
  amount: number | string;
  /** 备注 */
  remark?: string;
}
