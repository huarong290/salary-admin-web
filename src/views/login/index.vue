<!--src/views/login/index.vue-->

<template>
  <div class="login-container">
    <el-card class="login-box" shadow="hover">
      <h2 class="title">Salary Admin 登录</h2>

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
            @keyup.enter="handleLogin"
          />
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
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
// 引入 Element Plus 的图标
import { User, Lock } from '@element-plus/icons-vue';
// 引入类型，满足严格模式要求
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();

// 表单实例引用
const loginFormRef = ref<FormInstance>();
// 按钮加载状态
const loading = ref(false);

// 1. 表单绑定的数据 (帮你默认填好 admin，省得每次开发都要手敲)
const loginForm = reactive({
  username: 'admin',
  password: '123456',
});

// 2. 表单校验规则
const loginRules = reactive<FormRules>({
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 位', trigger: 'blur' },
  ],
});

// 3. 登录提交逻辑
const handleLogin = async () => {
  // 防御性编程：确保表单实例存在
  if (!loginFormRef.value) return;

  // 触发全局校验
  await loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true;

      // TODO: 这里马上要换成调用 Pinia 中的真实登录接口！
      console.log('校验通过，准备发送请求...', loginForm);

      // 模拟接口请求延迟
      setTimeout(() => {
        loading.value = false;
        // 登录成功后，跳转到首页 (咱们之前配置的重定向会把它带到 /dashboard)
        router.push('/');
      }, 1000);
    } else {
      console.log('表单校验未通过！');
    }
  });
};
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  // 背景色使用咱们之前配好的原生变量，适配性更强
  background-color: var(--el-bg-color-page);
}

.login-box {
  width: 400px;
  // 让卡片稍微圆润一点，更具现代感
  border-radius: 8px;
  padding: 20px 10px;
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: var(--el-text-color-primary);
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}
</style>
