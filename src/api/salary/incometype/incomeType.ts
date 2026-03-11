// src/api/salary/incometype/incomeType.ts

import request from '@/utils/request';
import type {
  IncomeTypeAddReqDTO,
  IncomeTypeEditReqDTO,
  IncomeTypeQueryReqDTO,
  IncomeTypeVO,
} from '@/types/salary/incometype/incomeType.ts';
import type { PageResult } from '@/types/common.ts';

export function addIncomeTypeApi(data: IncomeTypeAddReqDTO) {
  return request.post<number>(`/salary/income-type/add`, data);
}

export function editIncomeTypeApi(data: IncomeTypeEditReqDTO) {
  return request.put<boolean>(`/salary/income-type/edit`, data);
}

export function getIncomeTypePageApi(data: IncomeTypeQueryReqDTO) {
  return request.post<PageResult<IncomeTypeVO>>(`/salary/income-type/page`, data);
}

export function getIncomeTypeDetailApi(id: number | string) {
  return request.get<IncomeTypeVO>(`/salary/income-type/${id}`);
}

export function deleteIncomeTypeApi(id: number | string, logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/income-type/delete/${id}`, {
    params: { logicalDelete },
  });
}

export function batchDeleteIncomeTypeApi(ids: (number | string)[], logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/income-type/delete/batch`, {
    params: { logicalDelete },
    data: ids,
  });
}
