// src/stores/modules/tagsView/index.ts

import { defineStore } from 'pinia';
import type { RouteLocationNormalized } from 'vue-router';

export const useTagsViewStore = defineStore('tagsView', {
  state: () => ({
    // 用户访问过的视图列表 (用于渲染顶部的标签)
    visitedViews: [] as RouteLocationNormalized[],
    // 需要缓存的视图名称列表 (提供给 keep-alive 的 include)
    cachedViews: [] as string[],
  }),
  actions: {
    addView(view: RouteLocationNormalized) {
      this.addVisitedView(view);
      this.addCachedView(view);
    },
    addVisitedView(view: RouteLocationNormalized) {
      // 避免重复添加
      if (this.visitedViews.some((v) => v.path === view.path)) return;
      // 必须拷贝一份对象，防止路由对象被污染
      this.visitedViews.push(Object.assign({}, view));
    },
    addCachedView(view: RouteLocationNormalized) {
      const viewName = view.name as string;
      if (!viewName) return;
      if (this.cachedViews.includes(viewName)) return;
      // 如果路由 meta 中没有显式声明 noCache: true，则默认缓存
      if (!view.meta.noCache) {
        this.cachedViews.push(viewName);
      }
    },
    delView(view: RouteLocationNormalized) {
      return new Promise<{ visitedViews: RouteLocationNormalized[]; cachedViews: string[] }>(
        (resolve) => {
          this.delVisitedView(view);
          this.delCachedView(view);
          resolve({
            visitedViews: [...this.visitedViews],
            cachedViews: [...this.cachedViews],
          });
        }
      );
    },
    delVisitedView(view: RouteLocationNormalized) {
      for (const [i, v] of this.visitedViews.entries()) {
        if (v.path === view.path) {
          this.visitedViews.splice(i, 1);
          break;
        }
      }
    },
    delCachedView(view: RouteLocationNormalized) {
      const viewName = view.name as string;
      const index = this.cachedViews.indexOf(viewName);
      if (index > -1) {
        this.cachedViews.splice(index, 1);
      }
    },
    delOthersViews(view: RouteLocationNormalized) {
      return new Promise<{ visitedViews: RouteLocationNormalized[]; cachedViews: string[] }>(
        (resolve) => {
          this.delOthersVisitedViews(view);
          this.delOthersCachedViews(view);
          resolve({
            visitedViews: [...this.visitedViews],
            cachedViews: [...this.cachedViews],
          });
        }
      );
    },
    delOthersVisitedViews(view: RouteLocationNormalized) {
      this.visitedViews = this.visitedViews.filter((v) => {
        // 保留工作台和当前选中的标签
        return v.path === '/dashboard' || v.path === view.path;
      });
    },
    delOthersCachedViews(view: RouteLocationNormalized) {
      const viewName = view.name as string;
      this.cachedViews = this.cachedViews.filter((name) => {
        return name === 'Dashboard' || name === viewName;
      });
    },

    delAllViews() {
      return new Promise<{ visitedViews: RouteLocationNormalized[]; cachedViews: string[] }>(
        (resolve) => {
          this.delAllVisitedViews();
          this.delAllCachedViews();
          resolve({
            visitedViews: [...this.visitedViews],
            cachedViews: [...this.cachedViews],
          });
        }
      );
    },
    delAllVisitedViews() {
      // 强行保留工作台
      const affixTags = this.visitedViews.filter((tag) => tag.path === '/dashboard');
      this.visitedViews = affixTags;
    },
    delAllCachedViews() {
      this.cachedViews = [];
    },
  },
});
