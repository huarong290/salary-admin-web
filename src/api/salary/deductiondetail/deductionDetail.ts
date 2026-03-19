// src/api/salary/deductiondetail/deductionDetail.ts
import request from '@/utils/request';
import type {
  DeductionDetailAddReqDTO,
  DeductionDetailQueryReqDTO,
  DeductionDetailUpdateReqDTO,
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
 * 修改扣款流水 (HR发现金额填错时使用)
 */
export function updateDeductionDetailApi(data: DeductionDetailUpdateReqDTO) {
  return request.put<boolean>(`/salary/deduction-detail/update`, data);
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
/**
 * 批量删除扣款流水 (清空错误导入的整批数据时使用)
 */
export function batchDeleteDeductionDetailApi(
  ids: (number | string)[],
  logicalDelete: boolean = true
) {
  return request.delete<boolean>(`/salary/deduction-detail/delete/batch`, {
    data: ids, // 💡 注意：Axios 的 delete 请求传 body 必须放在 data 属性里
    params: { logicalDelete },
  });
}
