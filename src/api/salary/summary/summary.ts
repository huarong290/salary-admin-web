// src/api/salary/summary/summary.ts
import request from '@/utils/request';
import type {
  SummaryCalcByPeriodReqDTO,
  SummaryCalcReqDTO,
  SummaryQueryReqDTO,
  SummaryVO,
} from '@/types/salary/summary/summary.ts';
import type { PageResult } from '@/types/common.ts';

/**
 * 🌟 触发全员一键结算核心引擎 (按月份全局核算)
 * @param data 包含 settlementMonth 和 remark 的请求对象
 */
export function calculateSummaryApi(data: SummaryCalcReqDTO) {
  return request.post<void>(`/salary/summary/calculate`, data);
}

/**
 * 🌟 触发指定周期薪资核算 (单人即时核算/局部批量核算)
 * @param data 包含 periodIds 数组 和 remark 的请求对象
 */
export function calculateSummaryByPeriodsApi(data: SummaryCalcByPeriodReqDTO) {
  return request.post<void>(`/salary/summary/calculate/periods`, data);
}
/**
 * 🌟 同步/刷新汇总单总金额 (通常在对账明细页手工强制平账后触发)
 * @param periodId 薪资周期ID
 */
export function syncSummaryAmountApi(periodId: number | string) {
  return request.post<void>(`/salary/summary/sync/amount/${periodId}`);
}
/**
 * 分页查询薪资结算单大盘列表
 */
export function getSummaryPageApi(data: SummaryQueryReqDTO) {
  return request.post<PageResult<SummaryVO>>(`/salary/summary/page`, data);
}

/**
 * 获取结算单详情
 */
export function getSummaryDetailApi(id: number | string) {
  return request.get<SummaryVO>(`/salary/summary/${id}`);
}

/**
 * 单条删除结算单
 */
export function deleteSummaryApi(id: number | string, logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/summary/delete/${id}`, {
    params: { logicalDelete },
  });
}

/**
 * 批量删除结算单
 */
export function batchDeleteSummaryApi(ids: (number | string)[], logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/summary/delete/batch`, {
    params: { logicalDelete },
    data: ids,
  });
}

/**
 *  获取单人核算预览结果 (读操作，无副作用)
 */
export function previewSummaryCalculateApi(periodId: number | string) {
  return request.get<SummaryVO>(`/salary/summary/preview/${periodId}`);
}
