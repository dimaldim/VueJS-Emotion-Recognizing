import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    isLoading: false,
    gamePoints: 0
  },
  mutations: {
    changeIsLoading(state) {
      state.isLoading = !state.isLoading;
    },
    addPoints(state, pts) {
      state.gamePoints += Number(pts);
    }
  },
  actions: {
    changeIsLoading({ commit }) {
      commit("changeIsLoading");
    },
    addPoints({ commit }, points) {
      commit("addPoints", points);
    }
  },
  getters: {
    isLoading: state => state.isLoading,
    gamePoints: state => state.gamePoints
  }
});
