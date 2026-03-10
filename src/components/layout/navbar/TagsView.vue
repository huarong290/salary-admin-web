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
          @contextmenu.prevent="openMenu(tag, $event)"
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
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li v-if="selectedTag.path !== '/dashboard'" @click="closeSelectedTag(selectedTag)">
        关闭当前
      </li>
      <li @click="closeOthersTags">关闭其他</li>
      <li @click="closeAllTags">关闭所有</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue';
import { useRoute, useRouter, type RouteLocationNormalized } from 'vue-router';
import { useTagsViewStore } from '@/stores/modules/tagsView';
import { Close } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const tagsViewStore = useTagsViewStore();

const visitedViews = computed(() => tagsViewStore.visitedViews);
// 右键菜单相关状态
const visible = ref(false);
const top = ref(0);
const left = ref(0);
const selectedTag = ref<RouteLocationNormalized>({} as RouteLocationNormalized);

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

// 🌟 右键菜单控制引擎
const openMenu = (tag: RouteLocationNormalized, e: MouseEvent) => {
  const menuMinWidth = 105;
  // 获取当前可视区域边缘，防止菜单超出屏幕边界
  const maxLeft = window.innerWidth - menuMinWidth;
  const currentLeft = e.clientX + 15; // 鼠标右侧偏移15px体验更好

  left.value = currentLeft > maxLeft ? maxLeft : currentLeft;
  top.value = e.clientY;

  visible.value = true;
  selectedTag.value = tag;
};

const closeMenu = () => {
  visible.value = false;
};

// 监听菜单显示状态，点击屏幕任意其他位置则关闭菜单
watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', closeMenu);
  } else {
    document.body.removeEventListener('click', closeMenu);
  }
});

// 🎯 操作：关闭选中标签
const closeSelectedTag = async (view: RouteLocationNormalized) => {
  const { visitedViews } = await tagsViewStore.delView(view);
  if (isActive(view)) {
    const latestView = visitedViews.slice(-1)[0];
    if (latestView) {
      router.push(latestView.path);
    } else {
      router.push('/dashboard');
    }
  }
};

// 🎯 操作：关闭其他标签
const closeOthersTags = async () => {
  await tagsViewStore.delOthersViews(selectedTag.value);
  // 如果当前路由不是右键选中的路由，自动跳转过去
  if (selectedTag.value.path !== route.path) {
    router.push(selectedTag.value.path);
  }
};

// 🎯 操作：关闭所有标签
const closeAllTags = async () => {
  await tagsViewStore.delAllViews();
  // 清空后直接回城
  router.push('/dashboard');
};
</script>

<style scoped lang="scss">
.tags-view-container {
  height: 34px;
  width: 100%;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: var(--el-box-shadow-light);

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
    /* 🌟 1. 未激活标签的自适应颜色 */
    border: 1px solid var(--el-border-color);
    color: var(--el-text-color-regular);
    background: var(--el-bg-color);
    padding: 0 8px;
    font-size: 12px;
    margin-right: 5px;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

    &:first-of-type {
      margin-left: 0;
    }

    /* 🌟 2. 激活态标签完美跟随自定义主题色与反色算法 */
    &.active {
      background-color: var(--el-color-primary);
      border-color: var(--el-color-primary);
      color: var(--theme-primary-text-color, #ffffff);
      &::before {
        content: '';
        background: var(--theme-primary-text-color, #ffffff);
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
        /* 关闭按钮的 hover 背景也改为动态变量 */
        background-color: var(--el-text-color-placeholder);
        color: var(--el-bg-color-overlay);
      }
    }
  }

  /* 🌟 右键菜单悬浮样式 */
  .contextmenu {
    margin: 0;
    z-index: 3000;
    position: fixed;
    list-style-type: none;
    padding: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;

    /* 替换写死的 #fff 和 #333 */
    background: var(--el-bg-color-overlay);
    color: var(--el-text-color-regular);
    box-shadow: var(--el-box-shadow-light);

    li {
      margin: 0;
      padding: 7px 16px;
      cursor: pointer;
      &:hover {
        /* hover 状态的高亮背景 */
        background: var(--el-fill-color-light);
      }
    }
  }
}
</style>
