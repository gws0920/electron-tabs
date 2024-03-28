import { RouteRecordRaw } from 'vue-router';
import WindowContainer from '../layouts/WindowContainer.vue';
import About from '../pages/About.vue';
import Home from '../pages/Home.vue';
import Other from '../pages/Other.vue';
import DefaultPage from '../pages/DefaultPage.vue';
import { ColorSwitch, User } from '@vicons/carbon';

const routes: RouteRecordRaw[] = [
  { path: '/', component: DefaultPage },
  { path: '/Home', component: Home, meta: {title: '首页'}},
  { path: '/About', component: About, meta: {title: 'About页', icon: shallowRef(ColorSwitch)}},
  { path: '/Other', component: Other, meta: {title: 'Other页', icon: shallowRef(User)}},
]

export default routes