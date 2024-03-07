import { RouteRecordRaw } from 'vue-router';
import WindowContainer from '../layouts/WindowContainer.vue';
import About from '../pages/About.vue';
import Home from '../pages/Home.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', component: WindowContainer, meta: {title: '首页'}},
  { path: '/Home', component: Home, meta: {title: '第一页'}},
  { path: '/About', component: About, meta: {title: 'About页'}}
]

export default routes