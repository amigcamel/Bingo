import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    countdownDuration: 10000,
  },
  mutations: {
  },
});

export default store;
