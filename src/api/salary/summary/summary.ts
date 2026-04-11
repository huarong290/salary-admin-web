// src/api/salary/summary/summary.ts
import request from '@/utils/request';
import type { PageResult } from '@/types/common.ts';
import type {
  SalarySummaryVO,
  SummaryQueryReqDTO,
  SalarySummaryOperateDTO,
  SummaryAdjustReqDTO,
} from '@/types/salary/summary/summary.ts';

/**
 * 分页查询薪资汇总列表
 * @param data 查询参数
 */
export function getSummaryPageApi(data: SummaryQueryReqDTO) {
  return request.post<PageResult<SalarySummaryVO>>('/salary/summary/page', data);
}

/**
 * 获取指定工资单的详细快照 (用于渲染工资条)
 * @param id 汇总表单条ID
 */
export function getSummaryDetailApi(id: number | string) {
  return request.get<SalarySummaryVO>(`/salary/summary/detail/${id}`);
}

/**
 * 统一变更锁定状态 (锁定/解锁/批量操作)
 * @param data { ids: [], lockFlag: 0|1, remark?: '' }
 */
export function updateSummaryLockStatusApi(data: SalarySummaryOperateDTO) {
  // 对应后端的 @PostMapping("/batch-lock-status")
  return request.post<boolean>('/salary/summary/batch-lock-status', data);
}
/**
 * 录入/修改手工发放补偿金额
 * @param data 包含 id, manualPaymentAmount, remark 的 DTO
 */
export function adjustSummaryAmountApi(data: SummaryAdjustReqDTO) {
  return request.post<boolean>('/salary/summary/adjust-manual-amount', data);
}
