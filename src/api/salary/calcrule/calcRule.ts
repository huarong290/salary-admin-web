// src/salary/calcrule/calcRule.ts

import request from '@/utils/request';

import type { PageResult } from '@/types/common.ts';
import type {
  CalcRuleAddReqDTO,
  CalcRuleEditReqDTO,
  CalcRuleQueryReqDTO,
  CalcRuleVO,
} from '@/types/salary/calcrule/calcrule.ts';

/**
 * 分页查询薪资计算规则列表
 * @param data 查询条件 (包含 keyword, status 等)
 */
export function getCalcRulePageApi(data: CalcRuleQueryReqDTO) {
  return request.post<PageResult<CalcRuleVO>>('/salary/calc-rule/page', data);
}

/**
 * 新增薪资计算规则
 * @param data 规则配置信息 (包含 ruleCode, ruleScript 等)
 */
export function addCalcRuleApi(data: CalcRuleAddReqDTO) {
  return request.post<number>('/salary/calc-rule/add', data);
}

/**
 * 修改薪资计算规则
 * @param data 修改数据 (必须包含 id)
 */
export function editCalcRuleApi(data: CalcRuleEditReqDTO) {
  return request.put<boolean>('/salary/calc-rule/edit', data);
}

/**
 * 删除计算规则
 * @param id 规则ID
 * @param logical 是否逻辑删除 (默认 true)
 */
export function deleteCalcRuleApi(id: number | string, logical: boolean = true) {
  return request.delete<boolean>(`/salary/calc-rule/${id}`, {
    params: { logical },
  });
}

/**
 * 获取所有启用状态的规则列表
 * 用于规则引擎预览或配置关联时调用
 */
export function listActiveRulesApi() {
  return request.get<CalcRuleVO[]>('/salary/calc-rule/listActive');
}

/**
 * 根据 ID 获取规则详情
 * @param id 规则ID
 */
export function getCalcRuleDetailApi(id: number | string) {
  return request.get<CalcRuleVO>(`/salary/calc-rule/${id}`);
}
