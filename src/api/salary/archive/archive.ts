// src/api/salary/archive/archive.ts

import type {
  ArchiveAddReqDTO,
  ArchiveQueryReqDTO,
  SalaryArchiveVO,
} from '@/types/salary/archive/archive.ts';
import type { PageResult } from '@/types/common.ts';
import request from '@/utils/request';

/**
 * 分页查询薪资档案列表
 * (支持关键字搜索员工姓名和编号，默认查询当前最新版本)
 */
export function getArchivePageApi(data: ArchiveQueryReqDTO) {
  return request.post<PageResult<SalaryArchiveVO>>(`/salary/archive/page`, data);
}

/**
 * 提交定薪/调薪方案
 * (为员工定薪或发起调薪。系统会自动闭合旧版本并生成待审核的新版本记录)
 */
export function saveOrAdjustArchiveApi(data: ArchiveAddReqDTO) {
  return request.post<boolean>(`/salary/archive/save`, data);
}

/**
 * 获取员工当前生效档案
 * (常用于调薪时的初始数据回显)
 */
export function getCurrentArchiveApi(employeeId: number | string) {
  return request.get<SalaryArchiveVO>(`/salary/archive/current/${employeeId}`);
}

/**
 * 获取特定版本档案详情
 * (根据档案主键ID查询，包含该版本下的所有配置明细)
 */
export function getArchiveDetailApi(archiveId: number | string) {
  return request.get<SalaryArchiveVO>(`/salary/archive/detail/${archiveId}`);
}

/**
 * 撤销最新调薪版本
 * (仅限撤销未核算的草稿/待审版本，并恢复上一个有效版本)
 */
export function revokeLatestVersionApi(employeeId: number | string) {
  return request.delete<boolean>(`/salary/archive/revoke/${employeeId}`);
}
