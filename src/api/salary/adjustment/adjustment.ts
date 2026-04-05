// src/api/salary/adjustment/adjustment.ts

import request from '@/utils/request';
import type {
  AdjustmentAddReqDTO,
  AdjustmentEditReqDTO,
  AdjustmentQueryReqDTO,
  SalaryAdjustmentVO,
} from '@/types/salary/adjustment/adjustment';
import type { PageResult } from '@/types/common';

/**
 * 新增专项调整 (录入手工账/动态发薪项)
 * 前端仅需传原币种和汇率，结算本币金额由后端引擎强制折算防篡改
 * @param data 专项调整表单数据 (包含发生金额、币种、关联周期等)
 * @returns 返回新建的专项调整记录 ID
 */
export function addAdjustmentApi(data: AdjustmentAddReqDTO) {
  // 增加 dedupe: true 防止 HR 连击按钮导致重复发钱
  return request.post<number | string>('/salary/adjustment/add', data, { dedupe: true });
}

/**
 * 修改专项调整 (仅限草稿状态)
 * @param data 修改表单数据 (必须包含调整记录的 ID)
 * @returns 返回修改操作是否成功
 */
export function editAdjustmentApi(data: AdjustmentEditReqDTO) {
  return request.put<boolean>('/salary/adjustment/edit', data, { dedupe: true });
}

/**
 * 批量删除专项调整 (仅限草稿状态)
 *  状态机保护：已生效的数据在后端会被拦截，无法删除
 * @param ids 待删除的记录 ID 数组集合
 * @returns 返回删除操作是否成功
 */
export function deleteAdjustmentsApi(ids: (number | string)[]) {
  // Axios 中 DELETE 请求传递 body 数组，需要包在 data 属性里
  return request.delete<boolean>('/salary/adjustment/delete', { data: ids });
}

/**
 * 批量生效/撤回专项调整
 *  生效后数据将被物理锁定，直接参与当期 Aviator 薪资引擎的运算
 * @param ids 待操作的记录 ID 数组集合
 * @param status 目标状态 (0-草稿待生效, 1-已生效)
 * @returns 返回状态变更是否成功
 */
export function auditAdjustmentsApi(ids: (number | string)[], status: number) {
  return request.put<boolean>(`/salary/adjustment/audit/${status}`, ids);
}

/**
 * 分页查询专项调整列表
 * 用于后台“手工账管理/本期变动项”列表页，支持按核算周期、员工、状态搜索
 * @param params 查询条件及分页参数
 * @returns 返回包含 VO 的分页结果
 */
export function getAdjustmentPageApi(params: AdjustmentQueryReqDTO) {
  // GET 请求参数在 Axios 中使用 params 属性包装
  return request.get<PageResult<SalaryAdjustmentVO>>('/salary/adjustment/page', { params });
}
