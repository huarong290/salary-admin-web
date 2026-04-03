// src/api/salary/engine/engine.ts
import request from '@/utils/request';
import type {
  SalaryCalcBatchReqDTO,
  SalaryCalcSingleReqDTO,
} from '@/types/salary/engine/engine.ts';
import type { SummaryInitReqDTO, SalarySummaryVO } from '@/types/salary/summary/summary.ts';

/**
 * 引擎：初始化本月账套 (生成空壳单据)
 * @param data 包含结算月份的请求对象
 */
export function initSummaryAccountApi(data: SummaryInitReqDTO) {
  return request.post<boolean>('/salary/engine/initAccount', data);
}

/**
 * 引擎：执行全员/批量薪资核算 (正式落盘)
 * 💡 用于发薪台点击【执行全员核算发薪】按钮，触发底层计算流转
 * @param data 批量核算参数 (包含待核算的 summaryIds 与 指定管道版本)
 */
export function calculateBatchSalaryApi(data: SalaryCalcBatchReqDTO) {
  return request.post<boolean>('/salary/engine/calc/batch', data);
}

/**
 * 引擎：单人核算数据实时预览 (仅计算，不落库)
 * 💡 用于发薪台点击【重新核算】时，调用引擎进行实时试算，供 HR 在弹窗中核对
 * @param data 单人核算参数
 * @returns 返回试算后的薪资单快照 (SalarySummaryVO)
 */
export function previewSingleSalaryApi(data: SalaryCalcSingleReqDTO) {
  return request.post<SalarySummaryVO>('/salary/engine/calc/preview', data);
}

/**
 * 引擎：执行单人薪资重新核算 (正式落盘)
 * 💡 用于发薪台单据预览确认无误后，点击【确认存盘并更新】按钮
 * @param data 单人核算参数 (包含 summaryId 及预留的强算标识)
 */
export function calculateSingleSalaryApi(data: SalaryCalcSingleReqDTO) {
  return request.post<boolean>('/salary/engine/calc/single', data);
}
