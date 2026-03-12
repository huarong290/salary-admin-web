// src/api/salary/employee/index.ts

import request from '@/utils/request';
import type {
  EmployeeAddReqDTO,
  EmployeeEditReqDTO,
  EmployeeOptionVO,
  EmployeeQueryReqDTO,
  EmployeeVO,
} from '@/types/salary/employee/employee.ts';
import type { PageResult } from '@/types/common.ts';

/**
 * 新增员工档案
 * @param data 新增请求数据
 */
export function addEmployeeApi(data: EmployeeAddReqDTO) {
  return request.post<number>(`/salary/employee/add`, data);
}

/**
 * 修改员工档案
 * @param data 修改请求数据
 */
export function editEmployeeApi(data: EmployeeEditReqDTO) {
  return request.put<boolean>(`/salary/employee/edit`, data);
}

/**
 * 分页查询员工列表
 * @param data 查询条件参数
 */
export function getEmployeePageApi(data: EmployeeQueryReqDTO) {
  return request.post<PageResult<EmployeeVO>>(`/salary/employee/page`, data);
}

/**
 * 获取员工详情
 * @param id 员工ID
 */
export function getEmployeeDetailApi(id: number | string) {
  return request.get<EmployeeVO>(`/salary/employee/${id}`);
}

/**
 * 单条删除员工
 * @param id 员工ID
 * @param logicalDelete 是否逻辑删除 (默认 true)
 */
export function deleteEmployeeApi(id: number | string, logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/employee/delete/${id}`, {
    params: { logicalDelete },
  });
}

/**
 * 批量删除员工
 * @param ids 员工ID数组
 * @param logicalDelete 是否逻辑删除 (默认 true)
 */
export function batchDeleteEmployeeApi(ids: (number | string)[], logicalDelete: boolean = true) {
  return request.delete<boolean>(`/salary/employee/delete/batch`, {
    params: { logicalDelete },
    data: ids,
  });
}

/**
 * 获取在职员工简易列表(用于下拉选择)
 * @param keyword 模糊搜索关键字(姓名/工号)
 */
export function listEmployeeOptionsApi(keyword?: string) {
  return request.get<EmployeeOptionVO[]>(`/salary/employee/listOption`, {
    params: { keyword },
  });
}
