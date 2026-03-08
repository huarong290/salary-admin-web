<!--src/components/layout/navbar/Navbar.vue-->
<!--顶部导航-->
<template>
  <div class="navbar">
    <div class="left-menu">
      <Breadcrumb />
    </div>
    <div class="right-menu">
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
import Breadcrumb from '@/components/layout/navbar/Breadcrumb.vue';
import { useUserStore } from '@/stores/modules/user';
import { useAuthStore } from '@/stores/modules/auth';
import { useRouter } from 'vue-router';
import { CaretBottom } from '@element-plus/icons-vue';

const userStore = useUserStore();
const authStore = useAuthStore();
const router = useRouter();
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
