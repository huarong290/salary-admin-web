// src/types/salary/calcrule/calcrule.ts

import type { PageQuery } from '@/types/common';

/**
 * 计算规则返回对象 VO
 * 对应后端: com.salary.admin.model.vo.calcrule.CalcRuleVO
 */
export interface CalcRuleVO {
  /** 规则唯一标识 ID */
  id: number;
  /** 规则编码 (唯一标识规则的字符串) */
  ruleCode: string;
  /** 规则名称 */
  ruleName: string;
  /** 规则类型: 1-公式, 2-函数 */
  ruleType: number;
  /** 规则脚本内容 (公式或函数实现) */
  ruleScript: string;
  /** 返回值类型 (如 BigDecimal, String 等) */
  returnType: string;
  /** 执行优先级 / 排序值 */
  sortValue: number;
  /** 状态: 1-启用, 0-停用 */
  status: number;
  /** 依赖变量 (多个以逗号分隔) */
  dependsOn?: string;
  /** 参数配置 (JSON 字符串) */
  paramJson?: string;
  /** 所属阶段: 1-基础, 2-补贴, 3-扣款, 4-税, 5-汇总 */
  stage: number;
  /** 备注信息 */
  remark?: string;
  /** 更新时间 (ISO 时间字符串) */
  updateTime?: string;
}

/**
 * 分页查询计算规则请求参数
 * 对应后端: com.salary.admin.model.dto.calcrule.CalcRuleQueryReqDTO
 */
export interface CalcRuleQueryReqDTO extends PageQuery {
  /** 关键字搜索 (规则名称或编码) */
  keyword?: string;
  /** 规则类型: 1-公式, 2-函数 */
  ruleType?: number;
  /** 状态: 1-启用, 0-停) */
  status?: number;
  /** 阶段筛选 */
  stage?: number;
}

/**
 * 薪资计算规则新增请求参数
 * 对应后端: com.salary.admin.model.dto.calcrule.CalcRuleAddReqDTO
 */
export interface CalcRuleAddReqDTO {
  /** 规则编码 */
  ruleCode: string;
  /** 规则名称 */
  ruleName: string;
  /** 规则类型 (1:公式, 2:函数) */
  ruleType: number;
  /** 表达式脚本 */
  ruleScript: string;
  /** 返回值类型 */
  returnType: string;
  /** 执行优先级 */
  sortValue: number;
  /** 状态 (1:启用, 0:停用) */
  status: number;
  /** 依赖变量 */
  dependsOn?: string;
  /** 参数配置 (JSON字符串) */
  paramJson?: string;
  /** 所属阶段 (1基础 2补贴 3扣款 4税 5汇总) */
  stage: number;
  /** 备注 */
  remark?: string;
}

/**
 * 薪资计算规则修改请求参数
 * 对应后端: com.salary.admin.model.dto.calcrule.CalcRuleEditReqDTO
 */
export interface CalcRuleEditReqDTO extends Partial<CalcRuleAddReqDTO> {
  /** 规则主键ID (修改时必传) */
  id: number;
}

/**
 * 管道阶段字典 (供前端映射显示)
 */
export const STAGE_OPTIONS = [
  { label: '基础薪资阶段', value: 1, color: 'info' },
  { label: '津贴与奖金阶段', value: 2, color: 'success' },
  { label: '扣款与社保阶段', value: 3, color: 'warning' },
  { label: '税务核算阶段', value: 4, color: 'danger' },
  { label: '最终汇总阶段', value: 5, color: 'primary' },
] as const;
