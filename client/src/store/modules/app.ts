import Vue from 'vue';
import { toWei, soliditySha3 } from 'web3-utils';
import numeral from 'numeral';
import { getReports, getSnapshot } from '@/helpers/utils';
import ipfs from '@/helpers/ipfs';
import config from '@/config';
import { isTxReverted } from '@/helpers/utils';
import { loadTree } from '@/helpers/merkle';

const state = {
  init: false,
  loading: false,
  snapshot: {},
  reports: {},
  latestWeek: 0,
  latestReport: {}
};

const mutations = {
  SET(_state, payload) {
    Object.keys(payload).forEach(key => {
      Vue.set(_state, key, payload[key]);
    });
  },
  LOAD_REPORTS_SUCCESS(_state, reports) {
    Object.keys(reports).forEach(key => {
      Vue.set(_state.reports, key, reports[key]);
    });
  },
  GET_CLAIM_STATUS_REQUEST: () => console.debug('GET_CLAIM_STATUS_REQUEST'),
  GET_CLAIM_STATUS_SUCCESS: () => console.debug('GET_CLAIM_STATUS_SUCCESS'),
  GET_CLAIM_STATUS_FAILURE: (_state, payload) =>
    console.debug('GET_CLAIM_STATUS_FAILURE', payload),
  CLAIM_WEEKS_REQUEST: () => console.debug('CLAIM_WEEKS_REQUEST'),
  CLAIM_WEEKS_SUCCESS: () => console.debug('CLAIM_WEEKS_SUCCESS'),
  CLAIM_WEEKS_FAILURE: (_state, payload) =>
    console.debug('CLAIM_WEEKS_FAILURE', payload)
};

const actions = {
  init: async ({ commit, dispatch }) => {
    commit('SET', { loading: true });
    const connector = await Vue.prototype.$auth.getConnector();
    if (connector) await dispatch('login', connector);
    const snapshot = await getSnapshot();
    let latestWeek = 0;
    let latestReport = {};
    const reports = {};
    if (Object.keys(snapshot).length > 0) {
      const result: any = Object.entries(snapshot).slice(-1);
      latestWeek = result[0][0];
      const latestWeekIpfsHash = result[0][1];
      latestReport = await ipfs.get(latestWeekIpfsHash);
      reports[latestWeek] = latestReport;
    }
    commit('SET', {
      loading: false,
      init: true,
      snapshot,
      latestWeek,
      latestReport,
      reports
    });
  },
  loading: ({ commit }, payload) => {
    commit('SET', { loading: payload });
  },
  claimWeeks: async ({ commit, dispatch }, { address, weeks }) => {
    commit('CLAIM_WEEKS_REQUEST');
    let totalClaim = 0;
    const claims = weeks.map(week => {
      const claimBalance = state.reports[week][address];
      const merkleTree = loadTree(state.reports[week]);

      // Get merkle root
      console.log(week, merkleTree.getHexRoot());

      const proof = merkleTree.getHexProof(
        soliditySha3(address, toWei(claimBalance))
      );

      totalClaim += parseFloat(claimBalance);
      return [parseInt(week), toWei(claimBalance), proof];
    });

    try {
      const params = [
        'MerkleRedeem',
        config.addresses.merkleRedeem,
        'claimWeeks',
        [address, claims]
      ];
      console.log('Claim payload', claims);

      const tx = await dispatch('sendTransaction', params);
      const amountStr = numeral(totalClaim).format('(0.[00]a)');
      dispatch('notify', ['green', `You've just claimed ${amountStr} SEED!`]);
      commit('CLAIM_WEEKS_SUCCESS');
      return tx;
    } catch (e) {
      if (!e || isTxReverted(e)) return e;
      console.error(e);
      dispatch('notify', ['red', 'Ooops, something went wrong']);
      commit('CLAIM_WEEKS_FAILURE', e);
    }
  },
  claimStatus: async ({ commit, dispatch }, address) => {
    commit('GET_CLAIM_STATUS_SUCCESS');
    try {
      let res = await dispatch('call', [
        'MerkleRedeem',
        config.addresses.merkleRedeem,
        'claimStatus',
        [address.toLowerCase(), 1, state.latestWeek]
      ]);
      res = Object.fromEntries(res.map((status, i) => [i + 1, status]));
      commit('GET_CLAIM_STATUS_SUCCESS');
      return res;
    } catch (e) {
      commit('GET_CLAIM_STATUS_FAILURE', e);
    }
  },
  loadReports: async ({ commit }, weeks) => {
    const reports = await getReports(state.snapshot, weeks);
    commit('LOAD_REPORTS_SUCCESS', reports);
  }
};

export default {
  state,
  mutations,
  actions
};
