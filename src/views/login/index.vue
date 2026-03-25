<!--src/views/login/index.vue-->
<template>
  <div class="login-container">
    <div class="bg-decoration top"></div>
    <div class="bg-decoration bottom"></div>

    <el-card class="login-box" shadow="hover">
      <div class="login-header">
        <h2 class="title">Study Admin</h2>
        <p class="subtitle">财务后台管理系统</p>
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="rules" size="large">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="UserIcon"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="LockIcon"
            show-password
          />
        </el-form-item>

        <el-form-item prop="captchaCode">
          <div class="captcha-wrapper">
            <el-input
              v-model="loginForm.captchaCode"
              placeholder="验证码"
              :prefix-icon="CheckIcon"
              @keyup.enter="handleLogin"
            />
            <div class="captcha-img" @click="fetchCaptcha">
              <img v-if="captchaImg" :src="captchaImg" alt="验证码" title="点击刷新" />
              <el-skeleton v-else :rows="1" animated style="width: 100px" />
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button :loading="loading" type="primary" class="login-btn" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/** * ====================================================================
 * 📌 模块/组件说明
 * 功能描述: 系统登录页面
 * 核心逻辑: 验证码获取、登录 DTO 构造、身份令牌持久化
 * ====================================================================
 */

/**
 * --------------------------------------------------------------------
 * 📥 一、依赖导入区 (Import Dependencies)
 * --------------------------------------------------------------------
 */

// [1] Vue 核心钩子与原生生态
import { reactive, ref, onMounted, markRaw } from 'vue';
import { useRouter } from 'vue-router';

// [2] 第三方 UI 组件库与图标
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { User, Lock, CircleCheck } from '@element-plus/icons-vue';

// [3] 业务 API 与 全局 Store
import { useAuthStore } from '@/stores/modules/auth';
import { useUserStore } from '@/stores/modules/user';
import { getCaptchaApi } from '@/api/auth';

/**
 * --------------------------------------------------------------------
 * 📦 二、响应式状态区 (State Management)
 * --------------------------------------------------------------------
 */

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();

// [UI 控制状态]
const loading = ref(false);
const captchaImg = ref('');
const loginFormRef = ref<FormInstance>();

// [图标性能优化] - 使用 markRaw 避免 Vue 对图标进行无谓的 Proxy 代理
const UserIcon = markRaw(User);
const LockIcon = markRaw(Lock);
const CheckIcon = markRaw(CircleCheck);

// [业务表单数据]
const loginForm = reactive({
  username: 'admin',
  password: '123456',
  captchaId: '',
  captchaCode: '',
});

// [表单前端校验规则]
const rules = reactive<FormRules>({
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
  captchaCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
});

/**
 * --------------------------------------------------------------------
 * 🖱️ 三、UI 交互事件区 (UI Interactions)
 * --------------------------------------------------------------------
 */

/** 执行登录动作 */
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      await performLogin();
    }
  });
};

/**
 * --------------------------------------------------------------------
 * 🧠 四、核心业务逻辑区 (Business Logic)
 * --------------------------------------------------------------------
 */

/** 业务：获取/刷新验证码 */
const fetchCaptcha = async () => {
  try {
    const res = await getCaptchaApi();
    captchaImg.value = res.captchaImage;
    loginForm.captchaId = res.captchaId;
  } catch (err) {
    console.error('验证码加载失败', err);
  }
};

/** 业务：执行登录 API 调度 */
const performLogin = async () => {
  loading.value = true;
  try {
    // 构造符合后端 UserLoginReqDTO 的完整对象
    const loginData = {
      username: loginForm.username,
      password: loginForm.password,
      captchaId: loginForm.captchaId,
      captchaCode: loginForm.captchaCode,
      clientInfo: {
        deviceId: authStore.deviceId || 'WEB_' + Math.random().toString(36).slice(2),
        clientType: 'WEB',
        os: 'macOS',
        browser: 'Chrome',
      },
    };

    // 1. 调用 Pinia 封装的登录 Action
    await authStore.login(loginData);

    // 2. 清理旧缓存（非常重要，防止动态路由死循环）
    userStore.clearUserInfo();

    ElMessage.success('欢迎回来');
    await router.push('/');
  } catch (error) {
    // 登录失败必须刷新验证码
    await fetchCaptcha();
    console.error('登录异常', error);
  } finally {
    loading.value = false;
  }
};

/**
 * --------------------------------------------------------------------
 * ⚡ 五、Vue 生命周期区 (Lifecycle Hooks)
 * --------------------------------------------------------------------
 */
onMounted(() => {
  fetchCaptcha();
});
</script>

<style scoped lang="scss">
/* =====================================================================
   🎨 登录页私有样式定制
   ===================================================================== */

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--el-bg-color-page);
  /* 注入一点点科技感的径向渐变 */
  background-image: radial-gradient(
    circle at 50% 50%,
    var(--el-color-primary-light-9) 0%,
    var(--el-bg-color-page) 100%
  );
  position: relative;
  overflow: hidden;

  /* 背景装饰球 */
  .bg-decoration {
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.1;
    z-index: 0;
    &.top {
      background: var(--el-color-primary);
      top: -250px;
      right: -100px;
    }
    &.bottom {
      background: var(--el-color-success);
      bottom: -250px;
      left: -100px;
    }
  }
}

.login-box {
  width: 420px;
  border-radius: 16px;
  padding: 40px 30px;
  z-index: 10;
  border: 1px solid var(--el-border-color-lighter);

  /* 适配暗黑模式 */
  html.dark & {
    background-color: rgba(20, 20, 20, 0.8);
    backdrop-filter: blur(10px);
  }

  .login-header {
    text-align: center;
    margin-bottom: 40px;
    .title {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 12px;
      color: var(--el-text-color-primary);
    }
    .subtitle {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}

.captcha-wrapper {
  display: flex;
  width: 100%;
  gap: 12px;
  align-items: center;
  .captcha-img {
    height: 40px;
    flex: 0 0 120px;
    cursor: pointer;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    overflow: hidden;
    transition: all 0.3s;
    &:hover {
      border-color: var(--el-color-primary);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

/* =====================================================================
   🚀 风格联动：响应全局 MenuStyle 切换 (Brilliant vs Breeze)
   ===================================================================== */

/* 风格 A：实心高亮风 - 登录页显得更强硬、更有力量感 */
html[data-menu-style='brilliant'] {
  .login-box {
    border-radius: 4px;
  }
  .login-btn {
    border-radius: 4px;
  }
}

/* 风格 B：柔和呼吸风 - 登录页显得圆润、现代 */
html[data-menu-style='breeze'] {
  .login-box {
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  }
  .login-btn {
    border-radius: 24px;
  }
}
</style>
