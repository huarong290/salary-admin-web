// src/api/salary/kpirecord/kpiRecord.ts
import request from '@/utils/request';
import type { PageResult } from '@/types/common';
import type {
  KpiBatchInitReqDTO,
  KpiEvaluateReqDTO,
  KpiRecordQueryReqDTO,
  SalaryKpiRecordVO,
} from '@/types/salary/kpirecord/kpiRecord.ts';

/**
 * 分页查询绩效大盘明细
 */
export function getKpiRecordPageApi(data: KpiRecordQueryReqDTO) {
  return request.post<PageResult<SalaryKpiRecordVO>>(`/salary/kpi/page`, data);
}

/**
 * 批量初始化/派发当月绩效单
 */
export function initMonthlyKpiApi(data: KpiBatchInitReqDTO) {
  return request.post<boolean>(`/salary/kpi/init`, data);
}

/**
 * 提交/修改业务打分
 */
export function evaluateKpiApi(data: KpiEvaluateReqDTO) {
  return request.post<boolean>(`/salary/kpi/evaluate`, data);
}

/**
 * 批量确认/定稿 (数组传参)
 */
export function confirmKpiApi(ids: number[]) {
  return request.post<boolean>(`/salary/kpi/confirm`, ids);
}
