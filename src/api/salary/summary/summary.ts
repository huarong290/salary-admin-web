// src/api/salary/summary/summary.ts
import request from '@/utils/request';
import type {
  SummaryCalcReqDTO,
  SummaryQueryReqDTO,
  SummaryVO,
} from '@/types/salary/summary/summary.ts';
import type { PageResult } from '@/types/common.ts';

/**
 * 🌟 触发一键结算核心引擎 (可重复调用)
 * @param data 包含 periodId 和 remark 的请求对象
 */
export function calculateSummaryApi(data: SummaryCalcReqDTO) {
  return request.post<number>(`/salary/summary/calculate`, data);
}

/**
 * 分页查询薪资结算单
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
