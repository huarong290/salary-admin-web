// src/api/salary/deductiontype/deductionType.ts

import request from '@/utils/request';
import type {
  DeductionTypeAddReqDTO,
  DeductionTypeEditReqDTO,
  DeductionTypeOptionVO,
  DeductionTypeQueryReqDTO,
  DeductionTypeVO,
} from '@/types/salary/deductiontype/deductionType.ts';
import type { PageResult } from '@/types/common.ts';

export function addDeductionTypeApi(data: DeductionTypeAddReqDTO) {
  return request.post<number>(`/salary/deduction-type/add`, data);
}

export function editDeductionTypeApi(data: DeductionTypeEditReqDTO) {
  return request.put<boolean>(`/salary/deduction-type/edit`, data);
}

export function getDeductionTypePageApi(data: DeductionTypeQueryReqDTO) {
  return request.post<PageResult<DeductionTypeVO>>(`/salary/deduction-type/page`, data);
}

export function getDeductionTypeDetailApi(id: number | string) {
  return request.get<DeductionTypeVO>(`/salary/deduction-type/${id}`);
}

export function deleteDeductionTypeApi(id: number | string, logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/deduction-type/delete/${id}`, {
    params: { logicalDelete },
  });
}

export function batchDeleteDeductionTypeApi(
  ids: (number | string)[],
  logicalDelete: boolean = true
) {
  return request.delete<boolean>(`/salary/deduction-type/delete/batch`, {
    params: { logicalDelete },
    data: ids,
  });
}
/** 获取扣款类型下拉列表 (新增) */
export function getDeductionTypeOptionsApi() {
  return request.get<DeductionTypeOptionVO[]>(`/salary/deduction-type/listOptions`);
}
