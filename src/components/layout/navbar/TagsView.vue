<!--src/components/layout/navbar/TagsView.vue-->

<template>
  <div class="tags-view-container">
    <el-scrollbar wrap-class="tags-scrollbar" :vertical="false">
      <div class="tags-wrapper">
        <router-link
          v-for="tag in visitedViews"
          :key="tag.path"
          :to="{ path: tag.path, query: tag.query }"
          :class="isActive(tag) ? 'active' : ''"
          class="tags-view-item"
        >
          {{ tag.meta?.title || '未命名' }}
          <el-icon
            v-if="tag.path !== '/dashboard'"
            class="el-icon-close"
            @click.prevent.stop="closeSelectedTag(tag)"
          >
            <Close />
          </el-icon>
        </router-link>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import { useRoute, useRouter, type RouteLocationNormalized } from 'vue-router';
import { useTagsViewStore } from '@/stores/modules/tagsView';
import { Close } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const tagsViewStore = useTagsViewStore();

const visitedViews = computed(() => tagsViewStore.visitedViews);

const isActive = (tag: RouteLocationNormalized) => {
  return tag.path === route.path;
};

// 🌟 核心引擎：监听路由变化，自动将当前路由添加到标签池
const addTags = () => {
  const { name } = route;
  if (name && route.path !== '/login') {
    tagsViewStore.addView(route as RouteLocationNormalized);
  }
};

watch(
  () => route.path,
  () => {
    addTags();
  }
);

onMounted(() => {
  addTags();
});

// 关闭标签页的逻辑
const closeSelectedTag = async (view: RouteLocationNormalized) => {
  const { visitedViews } = await tagsViewStore.delView(view);

  // 如果关闭的是当前正在看的标签，智能回退到上一个标签
  if (isActive(view)) {
    const latestView = visitedViews.slice(-1)[0];
    if (latestView) {
      router.push(latestView.path);
    } else {
      router.push('/dashboard');
    }
  }
};
</script>

<style scoped lang="scss">
.tags-view-container {
  height: 34px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.12),
    0 0 3px 0 rgba(0, 0, 0, 0.04);

  .tags-wrapper {
    display: flex;
    padding: 3px 15px;
  }

  .tags-view-item {
    display: inline-block;
    position: relative;
    cursor: pointer;
    height: 26px;
    line-height: 26px;
    border: 1px solid #d8dce5;
    color: #495060;
    background: #fff;
    padding: 0 8px;
    font-size: 12px;
    margin-right: 5px;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

    &:first-of-type {
      margin-left: 0;
    }

    /* 激活态的 UI 打磨 */
    &.active {
      background-color: #409eff;
      color: #fff;
      border-color: #409eff;
      &::before {
        content: '';
        background: #fff;
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        position: relative;
        margin-right: 5px;
      }
    }

    .el-icon-close {
      width: 16px;
      height: 16px;
      vertical-align: middle;
      border-radius: 50%;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      margin-left: 5px;

      &:hover {
        background-color: #b4bccc;
        color: #fff;
      }
    }
  }
}
</style>
