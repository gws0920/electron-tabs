import { RouteRecordRaw } from 'vue-router';
import About from '../pages/About.vue';
import Home from '../pages/Home.vue';
import UserPage from '../pages/User.vue';
import DefaultPage from '../pages/DefaultPage.vue';
import { ColorSwitch, User } from '@vicons/carbon';

const routes: RouteRecordRaw[] = [
  { path: '/', component: DefaultPage },
  { path: '/Home', component: Home, meta: {title: 'Home页'}},
  { path: '/About', component: About, meta: {title: 'About页', icon: shallowRef(ColorSwitch)}},
  { path: '/User', component: UserPage, meta: {title: 'User页', icon: shallowRef(User)}},
]

export default routes