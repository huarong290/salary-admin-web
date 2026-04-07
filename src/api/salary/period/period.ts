// src/api/salary/period/period.ts
import request from '@/utils/request';
import type {
  PeriodAddReqDTO,
  PeriodBatchInitReqDTO,
  PeriodBatchInitResultVO,
  PeriodEditReqDTO,
  PeriodOptionVO,
  PeriodQueryReqDTO,
  PeriodSelectQueryReqDTO,
  PeriodVO,
} from '@/types/salary/period/period.ts';
import type { PageResult } from '@/types/common.ts';

/**
 * 新增薪资周期
 */
export function addPeriodApi(data: PeriodAddReqDTO) {
  return request.post<number>(`/salary/period/add`, data);
}

/**
 * 修改薪资周期
 */
export function editPeriodApi(data: PeriodEditReqDTO) {
  return request.put<boolean>(`/salary/period/edit`, data);
}

/**
 * 分页查询周期列表
 */
export function getPeriodPageApi(data: PeriodQueryReqDTO) {
  return request.post<PageResult<PeriodVO>>(`/salary/period/page`, data);
}

/**
 * 获取周期详情
 */
export function getPeriodDetailApi(id: number | string) {
  return request.get<PeriodVO>(`/salary/period/${id}`);
}

/**
 * 删除薪资周期
 */
export function deletePeriodApi(id: number | string, logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/period/delete/${id}`, {
    params: { logicalDelete },
  });
}

/**
 * 批量删除薪资周期
 */
export function batchDeletePeriodApi(ids: (number | string)[], logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/period/delete/batch`, {
    params: { logicalDelete },
    data: ids,
  });
}

/**
 * 获取去重后的结算月份列表 (下拉框使用)
 */
export function getPeriodOptionsApi() {
  return request.get<PeriodOptionVO[]>(`/salary/period/listOption`);
}

/**
 * 批量初始化薪资周期
 * (根据在职员工名单，一键生成指定月份的薪资周期)
 * 🌟 修正：返回统计摘要 VO 替代 boolean
 */
export function batchInitPeriodApi(data: PeriodBatchInitReqDTO) {
  return request.post<PeriodBatchInitResultVO>(`/salary/period/batch-init`, data);
}
/**
 * 获取指定员工的结算月份列表 (无分页，级联下拉框专用)
 * @param params 包含可选的 employeeId
 */
export function listPeriodOptionsByEmployeeApi(params?: PeriodSelectQueryReqDTO) {
  return request.get<PeriodOptionVO[]>(`/salary/period/listOptionByEmployee`, {
    params,
  });
}
