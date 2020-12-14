import Vue from 'vue';
import VueRouter from 'vue-router';
import Bingo from '../views/Bingo.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Bingo',
    component: Bingo,
  },
  {
    path: '/admin',
    name: 'Admin',
    // route level code-splitting
    // this generates a separate chunk (admin.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "admin" */ '../views/Admin.vue'),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
