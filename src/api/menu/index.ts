// src/api/menu/index.ts

import request from '@/utils/request';
import type { MenuAddReqDTO, MenuEditReqDTO, MenuTreeVO } from '@/types/menu/menu.ts';

/**
 * 获取全量菜单树形列表
 * @description 用于菜单管理页面的树形表格展示，或分配权限时的树形复选框
 */
export function getMenuTreeApi() {
  return request.get<MenuTreeVO[]>('/menu/tree');
}

/**
 * 新增菜单/按钮
 * @param data 新增菜单的表单数据
 */
export function addMenuApi(data: MenuAddReqDTO) {
  return request.post<number>('/menu/add', data);
}

/**
 * 修改菜单/按钮信息
 * @param data 修改菜单的表单数据 (必须包含 id)
 */
export function editMenuApi(data: MenuEditReqDTO) {
  return request.put<number>('/menu/edit', data);
}

/**
 * 删除菜单/按钮
 * @param id 菜单主键ID
 */
export function deleteMenuApi(id: number | string) {
  return request.delete<boolean>(`/menu/delete/${id}`);
}
