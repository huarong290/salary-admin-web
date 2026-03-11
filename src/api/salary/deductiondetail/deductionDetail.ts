// src/api/salary/deductiondetail/deductionDetail.ts
import request from '@/utils/request';
import type {
  DeductionDetailAddReqDTO,
  DeductionDetailQueryReqDTO,
  DeductionDetailVO,
} from '@/types/salary/deductiondetail/deductionDetail.ts';
import type { PageResult } from '@/types/common.ts';

/**
 * 录入扣款流水
 */
export function addDeductionDetailApi(data: DeductionDetailAddReqDTO) {
  return request.post<number>(`/salary/deduction-detail/add`, data);
}

/**
 * 分页查询扣款流水
 */
export function getDeductionDetailPageApi(data: DeductionDetailQueryReqDTO) {
  return request.post<PageResult<DeductionDetailVO>>(`/salary/deduction-detail/page`, data);
}

/**
 * 删除单条扣款流水
 */
export function deleteDeductionDetailApi(id: number | string, logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/deduction-detail/delete/${id}`, {
    params: { logicalDelete },
  });
}
