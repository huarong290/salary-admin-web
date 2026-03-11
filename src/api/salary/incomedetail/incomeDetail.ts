// src/api/salary/incomedetail/incomeDetail.ts

import request from '@/utils/request';
import type {
  IncomeDetailAddReqDTO,
  IncomeDetailQueryReqDTO,
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
