import Vue from 'vue';
import App from './App.vue';

import './assets/bingo.css';
import router from './router';

Vue.config.productionTip = false;
Object.defineProperty(Vue.prototype, '$API_HOST', { value: process.env.VUE_APP_API_HOST }); // TODO: naming
Object.defineProperty(
  Vue.prototype,
  '$WS_ORIGIN', {
    value: `${process.env.VUE_APP_WS_PROTOCOL}://${process.env.VUE_APP_WS_HOST}`,
  },
);

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
