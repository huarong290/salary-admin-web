// src/stores/index.ts

//  全局 Pinia 实例
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
// 可以在这里挂载插件，比如持久化插件
const pinia = createPinia();
// 注入持久化插件
pinia.use(piniaPluginPersistedstate);
export default pinia;
