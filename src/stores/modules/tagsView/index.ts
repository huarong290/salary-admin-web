// src/stores/modules/tagsView/index.ts

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';

/**
 * 🏷️ TagsView 页签与组件缓存状态管理 (Setup Store 范式)
 * 职责：管理系统顶部多页签的打开、关闭，以及配合 <keep-alive> 控制组件的缓存存活期
 */
export const useTagsViewStore = defineStore('tagsView', () => {
  // ==================== 1. 状态 (State) ====================

  // 用户访问过的视图列表 (用于渲染顶部的标签)
  const visitedViews = ref<RouteLocationNormalized[]>([]);

  // 需要缓存的视图名称列表 (提供给 keep-alive 的 include)
  const cachedViews = ref<string[]>([]);

  // ==================== 2. 动作 (Actions) ====================

  /**
   * ：添加新的视图 (同时触发页签栏新增与组件缓存)
   * @param view 传入的 Vue Router 规范路由对象
   */
  const addView = (view: RouteLocationNormalized) => {
    addVisitedView(view);
    addCachedView(view);
  };

  /**
   * 添加到已访问的视图列表 (仅控制顶部页签的渲染)
   */
  const addVisitedView = (view: RouteLocationNormalized) => {
    // 避免重复添加
    if (visitedViews.value.some((v) => v.path === view.path)) return;

    // 必须拷贝一份对象，防止路由对象被污染 (浅拷贝切断原路由的响应式追踪)
    visitedViews.value.push(Object.assign({}, view));
  };

  /**
   * 添加到需要缓存的视图列表 (供 <keep-alive> 组件匹配 name 使用)
   */
  const addCachedView = (view: RouteLocationNormalized) => {
    const viewName = view.name as string;
    if (!viewName) return;
    if (cachedViews.value.includes(viewName)) return;

    // 如果路由 meta 中没有显式声明 noCache: true，则默认将其加入缓存队列
    if (!view.meta.noCache) {
      cachedViews.value.push(viewName);
    }
  };

  /**
   * 关闭/删除指定的视图页签
   * @returns 返回被删除后最新的视图和缓存列表，方便业务层根据结果决定下一次路由跳转
   */
  const delView = (view: RouteLocationNormalized) => {
    return new Promise<{ visitedViews: RouteLocationNormalized[]; cachedViews: string[] }>(
      (resolve) => {
        delVisitedView(view);
        delCachedView(view);
        resolve({
          visitedViews: [...visitedViews.value],
          cachedViews: [...cachedViews.value],
        });
      }
    );
  };

  /**
   * 仅从顶部页签列表中移除该视图
   */
  const delVisitedView = (view: RouteLocationNormalized) => {
    const index = visitedViews.value.findIndex((v) => v.path === view.path);
    if (index > -1) {
      visitedViews.value.splice(index, 1);
    }
  };

  /**
   * 仅销毁该视图的 <keep-alive> 组件缓存
   * (极其重要：关闭页签时必须销毁缓存，否则下次点开该页面依然是旧数据)
   */
  const delCachedView = (view: RouteLocationNormalized) => {
    const viewName = view.name as string;
    const index = cachedViews.value.indexOf(viewName);
    if (index > -1) {
      cachedViews.value.splice(index, 1);
    }
  };

  /**
   * 关闭除了当前视图以外的其他所有页签
   * 常用于右键菜单中的 "关闭其他" 操作
   */
  const delOthersViews = (view: RouteLocationNormalized) => {
    return new Promise<{ visitedViews: RouteLocationNormalized[]; cachedViews: string[] }>(
      (resolve) => {
        delOthersVisitedViews(view);
        delOthersCachedViews(view);
        resolve({
          visitedViews: [...visitedViews.value],
          cachedViews: [...cachedViews.value],
        });
      }
    );
  };

  /**
   * 从已访问列表中剔除其他页签 (强制保留首页工作台)
   */
  const delOthersVisitedViews = (view: RouteLocationNormalized) => {
    visitedViews.value = visitedViews.value.filter((v) => {
      // 保留工作台和当前选中的标签
      return v.path === '/dashboard' || v.path === view.path;
    });
  };

  /**
   * 从缓存列表中销毁其他组件缓存 (强制保留首页工作台)
   */
  const delOthersCachedViews = (view: RouteLocationNormalized) => {
    const viewName = view.name as string;
    cachedViews.value = cachedViews.value.filter((name) => {
      return name === 'Dashboard' || name === viewName;
    });
  };

  /**
   * 一键关闭所有标签页
   * 常用于右键菜单中的 "全部关闭" 操作
   */
  const delAllViews = () => {
    return new Promise<{ visitedViews: RouteLocationNormalized[]; cachedViews: string[] }>(
      (resolve) => {
        delAllVisitedViews();
        delAllCachedViews();
        resolve({
          visitedViews: [...visitedViews.value],
          cachedViews: [...cachedViews.value],
        });
      }
    );
  };

  /**
   * 清空访问记录列表 (底层拦截：强行保留 dashboard)
   */
  const delAllVisitedViews = () => {
    // 强行保留工作台，避免系统陷入无页面可渲染的白屏死区
    const affixTags = visitedViews.value.filter((tag) => tag.path === '/dashboard');
    visitedViews.value = affixTags;
  };

  /**
   * 粗暴清空所有组件缓存
   */
  const delAllCachedViews = () => {
    cachedViews.value = [];
  };

  // ==================== 3. 暴露模块 API ====================
  return {
    visitedViews,
    cachedViews,
    addView,
    addVisitedView,
    addCachedView,
    delView,
    delVisitedView,
    delCachedView,
    delOthersViews,
    delOthersVisitedViews,
    delOthersCachedViews,
    delAllViews,
    delAllVisitedViews,
    delAllCachedViews,
  };
});
