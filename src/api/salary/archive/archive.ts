// src/api/salary/archive/archive.ts

import request from '@/utils/request';
import type {
  ArchiveInitReqDTO,
  ArchiveAdjustReqDTO,
  ArchiveAuditReqDTO,
  SalaryArchiveVO,
  ArchiveQueryReqDTO,
} from '@/types/salary/archive/archive';
import type { PageResult } from '@/types/common.ts';

/**
 * 员工入职定薪 (初始化 V1 版本)
 * @param data 定薪配置单 (包含基础金额及明细项列表)
 * @returns 返回新建的薪资档案 ID
 */
export function initEmployeeArchiveApi(data: ArchiveInitReqDTO) {
  return request.post<number | string>('/api/salary/archive/init', data);
}

/**
 * 员工调薪申请 (生成 V(n+1) 草稿版本)
 * @param data 调薪配置单 (需包含调薪原因及全量最新的明细项)
 * @returns 返回调薪草稿档案的 ID
 */
export function adjustSalaryApi(data: ArchiveAdjustReqDTO) {
  return request.post<number | string>('/api/salary/archive/adjust', data, { dedupe: true });
}

/**
 * 调薪审批处理 (拉链表截断逻辑)
 * @param data 审批结果对象 (包含是否通过及审批意见)
 * @returns 返回审批操作是否成功
 */
export function auditArchiveApi(data: ArchiveAuditReqDTO) {
  return request.post<boolean>('/api/salary/archive/audit', data);
}

/**
 * 获取员工当前 [已生效] 且 [最新] 的薪资档案
 * 💡 前端在“调薪申请”页面回显老数据时，强烈依赖此接口
 * @param employeeId 员工 ID
 */
export function getLatestEffectiveArchiveApi(employeeId: number | string) {
  return request.get<SalaryArchiveVO>(`/api/salary/archive/latest/${employeeId}`);
}

/**
 * 获取员工薪资调整历史版本记录 (按版本号倒序)
 * @param employeeId 员工 ID
 * @returns 返回该员工所有的薪资档案历史列表
 */
export function listArchiveHistoryApi(employeeId: number | string) {
  return request.get<SalaryArchiveVO[]>(`/api/salary/archive/history/${employeeId}`);
}
/**
 * 分页查询薪资档案列表 (🌟 新增)
 * 用于后台“薪资档案管理”列表页，支持按姓名、工号、状态搜索
 * @param data 查询条件及分页参数
 */
export function getArchivePageApi(data: ArchiveQueryReqDTO) {
  return request.post<PageResult<SalaryArchiveVO>>('/api/salary/archive/page', data);
}
