import { toWei, soliditySha3 } from 'web3-utils';
import { parseEther } from '@ethersproject/units';
import config from '@/config';
import { isTxReverted } from '@/helpers/utils';
import { loadTree } from '@/helpers/merkle';
import totalWeek10 from '@/../reports/10/_totals.json';

const mutations = {
  VERIFY_CLAIM_REQUEST() {
    console.debug('VERIFY_CLAIM_REQUEST');
  },
  VERIFY_CLAIM_SUCCESS() {
    console.debug('VERIFY_CLAIM_SUCCESS');
  },
  VERIFY_CLAIM_FAILURE(_state, payload) {
    console.debug('VERIFY_CLAIM_FAILURE', payload);
  },
  CLAIM_WEEKS_REQUEST() {
    console.debug('CLAIM_WEEKS_REQUEST');
  },
  CLAIM_WEEKS_SUCCESS() {
    console.debug('CLAIM_WEEKS_SUCCESS');
  },
  CLAIM_WEEKS_FAILURE(_state, payload) {
    console.debug('CLAIM_WEEKS_FAILURE', payload);
  },
  TEST_REQUEST() {
    console.debug('TEST_REQUEST');
  },
  TEST_SUCCESS() {
    console.debug('TEST_SUCCESS');
  },
  TEST_FAILURE(_state, payload) {
    console.debug('TEST_FAILURE', payload);
  },
  GET_UNCLAIMED_WEEKS_REQUEST() {
    console.debug('GET_UNCLAIMED_WEEKS_REQUEST');
  },
  GET_UNCLAIMED_WEEKS_SUCCESS() {
    console.debug('GET_UNCLAIMED_WEEKS_SUCCESS');
  },
  GET_UNCLAIMED_WEEKS_FAILURE(_state, payload) {
    console.debug('GET_UNCLAIMED_WEEKS_FAILURE', payload);
  }
};

const actions = {
  verifyClaim: async ({ commit, dispatch }, address) => {
    commit('VERIFY_CLAIM_REQUEST');
    const weekNum = 2;
    const claimBalance = totalWeek10[address.toLowerCase()];
    const merkleTree = loadTree(totalWeek10);
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
  claimWeeks: async ({ commit, dispatch }, address) => {
    commit('CLAIM_WEEKS_REQUEST');
    const weekNum = 2;
    const claimBalance = totalWeek10[address.toLowerCase()];
    const merkleTree = loadTree(totalWeek10);
    const proof = merkleTree.getHexProof(
      soliditySha3(address, toWei(claimBalance))
    );
    console.log('Claim payload', {
      weekNum,
      claimBalance: toWei(claimBalance),
      proof
    });
    try {
      const params = [
        'MerkleRedeem',
        config.addresses.merkleRedeem,
        'claimWeeks',
        [address, [[weekNum, toWei(claimBalance), proof]]]
      ];
      const tx = await dispatch('sendTransaction', params);
      const amountStr = parseFloat(parseFloat(claimBalance).toFixed(6));
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
  test: async ({ commit, dispatch }, amount) => {
    commit('TEST_REQUEST');
    try {
      const params = [
        'Weth',
        config.addresses.weth,
        'deposit',
        [],
        { value: parseEther(amount) }
      ];
      const tx = await dispatch('sendTransaction', params);
      dispatch('notify', [
        'green',
        `You've successfully wrapped ${amount} ether`
      ]);
      commit('TEST_SUCCESS');
      return tx;
    } catch (e) {
      if (!e || isTxReverted(e)) return e;
      dispatch('notify', ['red', 'Ooops, something went wrong']);
      commit('TEST_FAILURE', e);
    }
  },
  getUnclaimedWeeks: async ({ commit, dispatch }, address) => {
    const calls: any = [];
    for (let i = 0; i < 10; i++) {
      calls.push([
        'MerkleRedeem',
        config.addresses.merkleRedeem,
        'claimed',
        [i.toString(), address.toLowerCase()]
      ]);
    }
    try {
      const res = await dispatch('multicall', calls);
      commit('GET_UNCLAIMED_WEEKS_SUCCESS');
      return res;
    } catch (e) {
      commit('GET_UNCLAIMED_WEEKS_FAILURE', e);
    }
  }
};

export default {
  mutations,
  actions
};
