import WindowContainer from '../layouts/WindowContainer.vue';
import About from '../pages/About.vue';
import Home from '../pages/Home.vue';

export default [
  { path: '/', component: WindowContainer},
  { path: '/Home', component: Home},
  { path: '/About', component: About}
]