// src/api/salary/paymentrecord/paymentrecord.ts

import request from '@/utils/request';
import type { PageResult } from '@/types/common.ts';
import type { SalaryPaymentRecordVO, PaymentRecordQueryReqDTO } from '@/types/salary/paymentrecord';

/** 分页查询明细 */
export function getPaymentRecordPageApi(data: PaymentRecordQueryReqDTO) {
  return request.post<PageResult<SalaryPaymentRecordVO>>('/salary/payment-record/page', data);
}

/** 获取单条详情 (含快照) */
export function getPaymentRecordDetailApi(id: number | string) {
  return request.get<SalaryPaymentRecordVO>(`/salary/payment-record/${id}`);
}

/** 手动更新/调整金额 */
export function updatePaymentRecordApi(data: any) {
  return request.put<boolean>('/salary/payment-record/update', data);
}

/** 删除记录 (会自动联动更新汇总单金额) */
export function deletePaymentRecordApi(id: number | string) {
  return request.delete<boolean>(`/salary/payment-record/${id}`);
}
