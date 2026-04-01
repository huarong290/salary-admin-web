// src/api/salary/engine/engine.ts
import request from '@/utils/request';

import type { PageResult } from '@/types/common';
import type {
  CalcRuleVO,
  CalcRuleQueryReqDTO,
  CalcRuleFormDTO,
  CalcPipelineVO,
} from '@/types/salary/engine/engine';

/**
 * 分页查询计算规则
 */
export function getCalcRulePageApi(data: CalcRuleQueryReqDTO) {
  return request.post<PageResult<CalcRuleVO>>('/salary/calc-rule/page', data);
}

/**
 * 新增计算规则
 */
export function addCalcRuleApi(data: CalcRuleFormDTO) {
  return request.post<number>('/salary/calc-rule/add', data);
}

/**
 * 编辑计算规则
 */
export function editCalcRuleApi(data: CalcRuleFormDTO) {
  return request.put<boolean>('/salary/calc-rule/edit', data);
}

/**
 * 删除计算规则
 * @param id 规则 ID
 * @param logical 是否逻辑删除 (默认 true)
 */
export function deleteCalcRuleApi(id: number | string, logical: boolean = true) {
  return request.delete<boolean>(`/salary/calc-rule/${id}`, { params: { logical } });
}

/**
 * 获取指定管道的步骤明细
 */
export function getPipelineStepsApi(pipelineCode: string) {
  return request.get<CalcPipelineVO[]>(`/salary/pipeline/list/${pipelineCode}`);
}

/**
 * 批量保存管道编排 (先删后插)
 */
export function savePipelineBatchApi(pipelineCode: string, data: CalcPipelineVO[]) {
  return request.post<boolean>(`/salary/pipeline/save-batch/${pipelineCode}`, data);
}
