import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export const store = new Vuex.Store({
    state: {
        isLoading: false
    },
    mutations: {
        changeIsLoading(state) {
            state.isLoading = !state.isLoading
        }
    },
    actions: {
        changeIsLoading({ commit }) {
            commit('changeIsLoading')
        }
    },
    getters: {
        isLoading: state => state.isLoading
    }
})