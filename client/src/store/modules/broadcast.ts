import { toWei, soliditySha3 } from 'web3-utils';
import config from '@/config';
import { isTxReverted } from '@/helpers/utils';
import { loadTree } from '@/helpers/merkle';
import reports from '@/../reports';
import Vue from 'vue';

const state = {
  latestWeek: Object.keys(reports).length
};

const mutations = {
  VERIFY_CLAIM_REQUEST: () => console.debug('VERIFY_CLAIM_REQUEST'),
  VERIFY_CLAIM_SUCCESS: () => console.debug('VERIFY_CLAIM_SUCCESS'),
  VERIFY_CLAIM_FAILURE: (_state, payload) =>
    console.debug('VERIFY_CLAIM_FAILURE', payload),
  GET_CLAIM_STATUS_REQUEST: () => console.debug('GET_CLAIM_STATUS_REQUEST'),
  GET_CLAIM_STATUS_SUCCESS: () => console.debug('GET_CLAIM_STATUS_SUCCESS'),
  GET_CLAIM_STATUS_FAILURE: (_state, payload) =>
    console.debug('GET_CLAIM_STATUS_FAILURE', payload),
  GET_MERKLE_ROOTS_REQUEST: () => console.debug('GET_MERKLE_ROOTS_REQUEST'),
  GET_MERKLE_ROOTS_SUCCESS: (_state, payload) => {
    Vue.set(_state, 'latestWeek', payload);
    console.debug('GET_MERKLE_ROOTS_SUCCESS');
  },
  GET_MERKLE_ROOTS_FAILURE: (_state, payload) =>
    console.debug('GET_MERKLE_ROOTS_FAILURE', payload),
  CLAIM_WEEKS_REQUEST: () => console.debug('CLAIM_WEEKS_REQUEST'),
  CLAIM_WEEKS_SUCCESS: () => console.debug('CLAIM_WEEKS_SUCCESS'),
  CLAIM_WEEKS_FAILURE: (_state, payload) =>
    console.debug('CLAIM_WEEKS_FAILURE', payload)
};

const actions = {
  verifyClaim: async ({ commit, dispatch }, address) => {
    commit('VERIFY_CLAIM_REQUEST');
    const weekNum = 1;
    const claimBalance = reports[weekNum][address.toLowerCase()];
    const merkleTree = loadTree(reports[weekNum]);
    const proof = merkleTree.getHexProof(
      soliditySha3(address, toWei(claimBalance))
    );
    try {
      const params = [
        'MerkleRedeem',
        config.addresses.merkleRedeem,
        'verifyClaim',
        [address, weekNum, toWei(claimBalance), proof]
      ];
      const res = await dispatch('call', params);
      commit('VERIFY_CLAIM_SUCCESS');
      return res;
    } catch (e) {
      commit('VERIFY_CLAIM_FAILURE', e);
    }
  },
  claimWeeks: async ({ commit, dispatch }, { address, weeks }) => {
    commit('CLAIM_WEEKS_REQUEST');
    let totalClaim = 0;
    const claims = weeks.map(week => {
      const claimBalance = reports[week][address.toLowerCase()];
      const merkleTree = loadTree(reports[week]);
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
      const amountStr = parseFloat(totalClaim.toFixed(6));
      dispatch('notify', [
        'green',
        `You've successfully claimed ${amountStr} BAL`
      ]);
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
  offsetRequirementMet: async ({ dispatch }, { address, week }) => {
    try {
      return await dispatch('call', [
        'MerkleRedeem',
        config.addresses.merkleRedeem,
        'offsetRequirementMet',
        [address.toLowerCase(), week]
      ]);
    } catch (e) {
      console.error(e);
      return;
    }
  },
  getMerkleRoots: async ({ commit, dispatch }) => {
    commit('GET_MERKLE_ROOTS_REQUEST');
    try {
      const latestWeek = await dispatch('call', [
        'MerkleRedeem',
        config.addresses.merkleRedeem,
        'merkleRoots',
        [1, state.latestWeek]
      ]);
      commit('GET_MERKLE_ROOTS_SUCCESS', latestWeek);
      return latestWeek;
    } catch (e) {
      commit('GET_MERKLE_ROOTS_FAILURE', e);
    }
  }
};

export default {
  state,
  mutations,
  actions
};
