// src/store/index.ts

//  全局 Pinia 实例
import { createPinia } from 'pinia';

// 可以在这里挂载插件，比如持久化插件
const pinia = createPinia();

export default pinia;