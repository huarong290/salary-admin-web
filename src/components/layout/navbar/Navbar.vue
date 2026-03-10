<!--src/components/layout/navbar/Navbar.vue-->
<!--顶部导航-->
<template>
  <div class="navbar">
    <div class="left-menu">
      <Breadcrumb />
    </div>
    <div class="right-menu">
      <div class="theme-setting">
        <el-tooltip
          :content="menuStyle === 'brilliant' ? '当前：实心高亮风格' : '当前：柔和呼吸风格'"
          placement="bottom"
        >
          <el-button
            circle
            size="small"
            :icon="menuStyle === 'brilliant' ? MagicStick : WindPower"
            @click="handleStyleChange"
          />
        </el-tooltip>
        <el-tooltip :content="isDark ? '切换亮色模式' : '切换暗黑模式'" placement="bottom">
          <el-switch
            :model-value="isDark"
            inline-prompt
            :active-icon="iconMoon"
            :inactive-icon="iconSunny"
            style="--el-switch-on-color: #2c2c2c; --el-switch-off-color: #e5eaf3"
            @change="handleToggleDark"
          />
        </el-tooltip>

        <el-tooltip content="自定义主题色" placement="bottom">
          <el-color-picker
            v-model="primaryColor"
            :predefine="predefineColors"
            size="small"
            @change="changePrimaryColor"
          />
        </el-tooltip>
      </div>
      <el-dropdown trigger="click">
        <span class="avatar-wrapper">
          <el-avatar
            :size="30"
            src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
          />
          <span class="name">{{ userStore.userInfo?.nickname || '管理员' }}</span>
          <el-icon><CaretBottom /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人中心</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, markRaw } from 'vue'; // 🌟 引入 markRaw
import Breadcrumb from '@/components/layout/navbar/Breadcrumb.vue';
import { useUserStore } from '@/stores/modules/user';
import { useAuthStore } from '@/stores/modules/auth';
import { useRouter } from 'vue-router';
// 🌟 [修改]：增加 MagicStick 和 WindPower 图标用于风格切换
import { CaretBottom, Moon, Sunny, MagicStick, WindPower } from '@element-plus/icons-vue';
// 🌟 引入主题 Hook
import { useTheme } from '@/hooks/useTheme';
const userStore = useUserStore();
const authStore = useAuthStore();
const router = useRouter();
// 🌟 提取主题控制方法和状态 menuStyle 和 changeMenuStyle
const { primaryColor, isDark, menuStyle, changePrimaryColor, toggleDark, changeMenuStyle } =
  useTheme();
// 预定义好看的大厂主题色
const predefineColors = ref([
  '#409EFF',
  '#2F54EB',
  '#009688',
  '#536DFE',
  '#FF5C93',
  '#E53935',
  '#FD726D',
  '#FAAD14',
]);
// 🌟 [新增]：处理菜单风格切换的函数
const handleStyleChange = () => {
  const targetStyle = menuStyle.value === 'brilliant' ? 'breeze' : 'brilliant';
  changeMenuStyle(targetStyle);
};
// 增加一个过渡动画类的控制，让切黑白模式时不那么生硬
const handleToggleDark = () => {
  document.documentElement.classList.add('transition-theme');
  toggleDark();
  setTimeout(() => {
    document.documentElement.classList.remove('transition-theme');
  }, 300);
};
// 🌟 使用 markRaw 冻结图标组件，极致优化性能
const iconMoon = markRaw(Moon);
const iconSunny = markRaw(Sunny);
// 提前把退出登录的坑位填上
const handleLogout = async () => {
  await authStore.logout();
  userStore.clearUserInfo();
  router.push('/login');
};
</script>

<style scoped lang="scss">
.navbar {
  /* 确保沾满 main-container */
  width: 100%;
  height: 50px;
  overflow: hidden;
  position: relative;
  background: var(--salary-header-bg);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;

  .right-menu {
    display: flex;
    align-items: center;
    /* 增加右侧各区块（控制器与头像）之间的间距 */
    gap: 20px;
    /*  新增的主题控制器样式 */
    .theme-setting {
      display: flex;
      align-items: center;
      gap: 15px; /* 开关和颜色选择器之间的间距 */
      /* 🌟 [新增]：让风格切换按钮和开关对齐更美观 */
      .el-button {
        border-color: var(--el-border-color-lighter);
        &:hover {
          color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
        }
      }
    }
    .avatar-wrapper {
      display: flex;
      align-items: center;
      cursor: pointer;
      .name {
        margin: 0 8px;
        font-size: 14px;
      }
    }
  }
}
</style>
