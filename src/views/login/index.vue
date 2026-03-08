<template>
  <div class="login-container">
    <el-card class="login-box" shadow="hover">
      <h2 class="title">Study Admin 登录</h2>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="captchaCode">
          <div class="captcha-wrapper">
            <el-input
              v-model="loginForm.captchaCode"
              placeholder="验证码"
              :prefix-icon="CircleCheck"
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
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock, CircleCheck } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
// 1. 引入 Auth Store 和 验证码 API
import { useAuthStore } from '@/stores/modules/auth';
import { getCaptchaApi } from '@/api/auth';
import { useUserStore } from '@/stores/modules/user/user.ts';

const router = useRouter();
const authStore = useAuthStore();

const loginFormRef = ref<FormInstance>();
const loading = ref(false);
const captchaImg = ref(''); // 存储 Base64 验证码图片

// 2. 表单数据 (增加验证码字段)
const loginForm = reactive({
  username: 'admin',
  password: '123456',
  captchaId: '', // 关联后端的验证码ID
  captchaCode: '',
});

// 3. 校验规则 (增加验证码校验)
const loginRules = reactive<FormRules>({
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
  captchaCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
});

// 4. 获取验证码逻辑
const fetchCaptcha = async () => {
  try {
    const res = await getCaptchaApi();
    captchaImg.value = res.captchaImage; // 假设后端返回的是 base64
    loginForm.captchaId = res.captchaId;
  } catch (err) {
    console.error('验证码加载失败', err);
  }
};

// 页面加载时自动获取验证码
onMounted(() => {
  fetchCaptcha();
});

// 5. 核心登录逻辑
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        // 构造符合后端 UserLoginReqDTO 的数据
        const loginData = {
          username: loginForm.username,
          password: loginForm.password,
          captchaId: loginForm.captchaId,
          captchaCode: loginForm.captchaCode,
          // 注入客户端信息（对应后端 ClientInfo）
          clientInfo: {
            deviceId: authStore.deviceId || 'WEB_CLIENT_' + Date.now(), // 简单模拟，建议用 FingerprintJS
            clientType: 'WEB',
            // 可选：增加 OS 和 Browser 信息，让后端的日志更漂亮
            os: 'macOS',
            browser: 'Chrome',
          },
        };

        // 🌟 调用 Pinia 封装的登录 Action
        await authStore.login(loginData);
        // 登录成功后清空用户信息，避免持久化的 menus 导致守卫不触发
        const userStore = useUserStore();
        userStore.clearUserInfo();
        ElMessage.success('登录成功');
        router.push('/'); // 跳转至首页
      } catch (error: any) {
        // 登录失败后刷新验证码
        fetchCaptcha();
        // 错误提示已在 axios 拦截器中统一处理
        console.error('登录异常', error);
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped lang="scss">
.login-container {
  /* 布局核心：使用 Flexbox 实现全屏水平垂直居中 */
  display: flex;
  justify-content: center;
  align-items: center;
  /* 尺寸控制：占据整个视口高度，确保背景铺满 */
  height: 100vh;
  /* 色彩规范：使用 Element Plus 官方页面背景变量，自动适配暗黑模式 */
  background-color: var(--el-bg-color-page);
}

.login-box {
  /* 响应式基础：设定登录框宽度 */
  width: 400px;
  /* 视觉打磨：大圆角更显现代感，通过 Padding 撑开内部呼吸感 */
  border-radius: 12px;
  padding: 30px 20px;
}

.title {
  /* 排版规范：水平居中并增加底部间距，与表单保持安全距离 */
  text-align: center;
  margin-bottom: 40px;
  /* 文字打磨：增加字重和字间距，提升品牌展示效果 */
  font-weight: 600;
  letter-spacing: 2px;
  /* 文字色彩：使用 Element 主文本色变量 */
  color: var(--el-text-color-primary);
}

.captcha-wrapper {
  /* 布局核心：横向排列输入框与验证码图片 */
  display: flex;
  width: 100%;
  /* 间距控制：通过 gap 代替 margin，确保元素分布均匀 */
  gap: 12px;
  /* 对齐方式：确保输入框和图片在同一水平线上 */
  align-items: center;
  .captcha-img {
    /* 尺寸锁定：高度与 el-input large 尺寸保持一致 (40px) */
    height: 40px;
    /* 弹性控制：固定宽度，防止图片加载前后导致布局抖动 */
    flex: 0 0 120px;
    width: 120px;
    /* 交互逻辑：设置手型指针提醒用户可点击刷新 */
    cursor: pointer;
    /* 边框规范：使用 Element 标准边框色 */
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    /* 防御性样式：防止图片过大导致溢出容器 */
    overflow: hidden;
    /* 兼容处理：图片透明时露出背景底色 */
    background-color: #fff;
    img {
      /* 填充策略：完全占据容器 */
      width: 100%;
      height: 100%;
      /*
         使用 contain 确保验证码图片按比例完整展示，
         即使后端返回的图片比例不一致，也不会被切掉。 */
      object-fit: cover;
      /* 去除图片底部的 inline 间隙 */
      display: block;
    }
  }
}

.login-btn {
  /* 布局策略：撑满容器宽度 */
  width: 100%;
  /* 尺寸加固：相比普通按钮稍大，增加视觉权重，作为首要操作点 (CTA) */
  height: 45px;
  font-size: 16px;
  /* 间距微调：与上方验证码区域保持逻辑分组的距离 */
  margin-top: 15px;
}
</style>
