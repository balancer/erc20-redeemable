import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import Home from '@/views/Home.vue';
import User from '@/views/User.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  { path: '/:address', name: 'user', component: User },
  { path: '/', name: 'home', component: Home },
  { path: '/*', name: 'error-404', beforeEnter: (to, from, next) => next('/') }
];

const router = new VueRouter({
  mode: 'hash',
  routes
});

export default router;
