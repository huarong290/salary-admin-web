//src/main.ts
import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import pinia from './stores';

// 1. 引入 Element Plus 的全局样式 (如果你没有用自动按需导入的话)
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
// 2.  核心修复：引入咱们自己的全局基础样式与变量配置
import '@/styles/index.scss';

// 3. 引入所有 Element Plus 图标 (如果之前没显示图标，顺便加上这个)
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
const app = createApp(App);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
// 按顺序挂载插件
app.use(pinia);
app.use(router);
app.use(ElementPlus);

app.mount('#app');
