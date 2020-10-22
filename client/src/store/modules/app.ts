import Vue from 'vue';
import { getSnapshot } from '@/helpers/utils';
import ipfs from '@/helpers/ipfs';
import reports from '@/../reports';

const state = {
  init: false,
  loading: false,
  snapshot: {},
  reports,
  latestReport: {}
};

const mutations = {
  SET(_state, payload) {
    Object.keys(payload).forEach(key => {
      Vue.set(_state, key, payload[key]);
    });
  }
};

const actions = {
  init: async ({ commit, dispatch }) => {
    commit('SET', { loading: true });
    const connector = await Vue.prototype.$auth.getConnector();
    if (connector) await dispatch('login', connector);
    const snapshot = await getSnapshot();
    const latestWeek: any = Object.values(snapshot).slice(-1);
    const latestReport = await ipfs.get(latestWeek);
    commit('SET', {
      loading: false,
      init: true,
      snapshot,
      latestWeek,
      latestReport
    });
  },
  loading: ({ commit }, payload) => {
    commit('SET', { loading: payload });
  }
};

export default {
  state,
  mutations,
  actions
};
