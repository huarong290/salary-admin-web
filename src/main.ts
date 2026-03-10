//src/main.ts
import { createApp } from 'vue';
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
//  必须显式引入，否则守卫永远不会注册
import './router/permission';

//  引入刚刚写好的自定义指令注册函数
import { setupDirectives } from '@/directive';
const app = createApp(App);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
// 按顺序挂载插件
app.use(pinia);
app.use(router);
app.use(ElementPlus);
// 挂载全局指令
setupDirectives(app);
app.mount('#app');
