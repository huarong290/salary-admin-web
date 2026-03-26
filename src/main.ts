//src/main.ts
import { createApp } from 'vue';
import App from './App.vue';

//一. 核心引擎
import pinia from './stores';
import router from './router';

//二. UI 框架与样式 (严格遵循层叠覆盖顺序)
// 2.1 引入 Element Plus 的全局样式 (如果你没有用自动按需导入的话)
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
// 2.2. 引入 Element Plus 暗黑模式的核心 CSS 变量库
import 'element-plus/theme-chalk/dark/css-vars.css';
// 2.3 引入咱们自己的全局基础样式与变量配置 自定义样式必须放在最后，确保拥有最高优先级
import '@/styles/index.scss';

//三. 插件与指令
// 3.1 引入所有 Element Plus 图标 (如果之前没显示图标，顺便加上这个)
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
// 3.2 引入刚刚写好的自定义指令注册函数
import { setupDirectives } from '@/directive';

//三. 路由守卫
//  必须显式引入，否则守卫永远不会注册
import './router/permission';

/**
 * 🚀 应用启动引导函数 (Bootstrap)
 * 职责：严格控制各类插件和基建的挂载顺序，隔离作用域
 */
const bootstrap = () => {
  const app = createApp(App);

  // 🛡️ 企业级防御：全局错误捕获边界
  // 防止局部组件的报错导致整个系统白屏崩溃，后续可在这里接入 Sentry 等监控平台
  app.config.errorHandler = (err, instance, info) => {
    console.error('【系统全局异常捕获】:', err);
    console.error('【错误详情】:', info);
    // 提取并打印报错的组件名称
    const componentName = instance?.$options?.name || instance?.$options?.__file || '匿名组件';
    console.error('【报错组件】:', componentName);
  };

  // 1. 挂载状态管理
  app.use(pinia);

  // 2. 挂载路由引擎
  app.use(router);

  // 3. 挂载 UI 框架
  app.use(ElementPlus);

  // 4. 挂载自定义指令 (如 v-hasPerm)
  setupDirectives(app);

  // 5. 注册全局图标
  // 注意：此处为全量注册，方便动态菜单配置。
  // 若未来追求极致首屏性能，建议重构为 unplugin-icons 自动按需引入
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }

  // 🚀 点火启动
  app.mount('#app');
};

// 执行启动
bootstrap();
