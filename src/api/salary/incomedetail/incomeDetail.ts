// src/api/salary/incomedetail/incomeDetail.ts

import request from '@/utils/request';
import type {
  IncomeDetailAddReqDTO,
  IncomeDetailQueryReqDTO,
  IncomeDetailUpdateReqDTO,
  IncomeDetailVO,
} from '@/types/salary/incomedetail/incomeDetail.ts';
import type { PageResult } from '@/types/common.ts';

/**
 * 录入收入流水
 */
export function addIncomeDetailApi(data: IncomeDetailAddReqDTO) {
  return request.post<number>(`/salary/income-detail/add`, data);
}
/**
 * 🌟 修改收入流水 (HR发现金额填错时使用)
 */
export function updateIncomeDetailApi(data: IncomeDetailUpdateReqDTO) {
  return request.put<boolean>(`/salary/income-detail/update`, data);
}
/**
 * 分页查询收入流水
 */
export function getIncomeDetailPageApi(data: IncomeDetailQueryReqDTO) {
  return request.post<PageResult<IncomeDetailVO>>(`/salary/income-detail/page`, data);
}

/**
 * 删除单条收入流水
 */
export function deleteIncomeDetailApi(id: number | string, logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/income-detail/delete/${id}`, {
    params: { logicalDelete },
  });
}

/**
 * 🌟 批量删除收入流水 (清空错误导入的整批数据时使用)
 */
export function batchDeleteIncomeDetailApi(
  ids: (number | string)[],
  logicalDelete: boolean = true
) {
  return request.delete<boolean>(`/salary/income-detail/delete/batch`, {
    data: ids, // 💡 注意：Axios 的 delete 请求传 body 必须放在 data 属性里
    params: { logicalDelete },
  });
}
