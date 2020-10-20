<template>
  <Container :slim="true">
    <UiLoading v-if="loading" class="overlay big" />
    <div v-else>
      <div class="px-4 px-md-0 mb-3">
        <router-link :to="{ name: 'home' }" class="text-gray">
          <Icon name="back" size="22" class="v-align-middle" />
          Home
        </router-link>
      </div>
      <div>
        <div class="col-12 col-lg-8 float-left pr-0 pr-lg-5">
          <div class="px-4 px-md-0">
            <h1 class="mb-3">{{ _shorten(address) }}</h1>
          </div>
          <a
            target="_blank"
            :href="_etherscanLink(txHash, 'tx')"
            v-if="txHash"
            class="p-4 bg-green text-white d-block rounded-0 rounded-md-2 mb-4 overflow-hidden"
          >
            <p class="mb-0">
              See transaction on Etherscan {{ _shorten(txHash) }}
              <Icon name="external-link" class="ml-1" />
            </p>
          </a>
          <Block :slim="true" title="Pending BAL">
            <div class="overflow-hidden">
              <div
                v-for="(dist, week, i) in unclaimed"
                :key="i"
                class="px-4 py-3 border-top d-flex text-white"
                :style="i === 0 && 'border: 0 !important;'"
              >
                <div class="flex-auto">
                  <a
                    :href="
                      `https://github.com/balancer-labs/bal-mining-scripts/blob/master/reports/${week}/_totals.json`
                    "
                    target="_blank"
                  >
                    Week {{ $n(week) }}
                    <Icon name="external-link" class="ml-1" />
                  </a>
                </div>
                <div>{{ $n(dist) }} BAL</div>
              </div>
              <p
                v-if="Object.keys(unclaimed).length === 0"
                class="p-4 m-0 d-block"
              >
                There isn't any pending BAL here.
              </p>
            </div>
          </Block>
          <Block
            v-if="Object.keys(claimed).length > 0"
            :slim="true"
            title="Claimed BAL"
          >
            <div class="overflow-hidden">
              <div
                v-for="(dist, week, i) in claimed"
                :key="i"
                class="px-4 py-3 border-top d-flex text-white"
                :style="i === 0 && 'border: 0 !important;'"
              >
                <div class="flex-auto">
                  <a
                    :href="
                      `https://github.com/balancer-labs/bal-mining-scripts/blob/master/reports/${week}/_totals.json`
                    "
                    target="_blank"
                  >
                    Week {{ $n(week) }}
                    <Icon name="external-link" class="ml-1" />
                  </a>
                </div>
                <div>{{ $n(dist) }} BAL</div>
              </div>
            </div>
          </Block>
        </div>
        <div class="col-12 col-lg-4 float-left">
          <Block title="Total pending BAL">
            <div class="mb-2">
              <UiButton class="width-full mb-2">
                {{ $n(totalUnclaimed) }} BAL
              </UiButton>
            </div>
            <UiButton
              @click="handleSubmit"
              :disabled="!web3.account || totalUnclaimed === 0"
              :loading="submitLoading"
              class="d-block width-full button--submit"
            >
              Claim
            </UiButton>
          </Block>
        </div>
      </div>
    </div>
  </Container>
</template>

<script>
import { mapActions } from 'vuex';
import reports from '@/../reports';

export default {
  data() {
    return {
      address: this.$router.currentRoute.params.address,
      loading: false,
      loaded: false,
      submitLoading: false,
      unclaimedWeeks: [],
      txHash: false
    };
  },
  computed: {
    unclaimed() {
      return Object.fromEntries(
        Object.entries(reports)
          .map(report => [
            report[0],
            report[1][this.address.toLowerCase()] || 0
          ])
          .filter(
            report => this.unclaimedWeeks.includes(report[0]) && report[1] > 0
          )
      );
    },
    claimed() {
      return Object.fromEntries(
        Object.entries(reports)
          .map(report => [
            report[0],
            report[1][this.address.toLowerCase()] || 0
          ])
          .filter(
            report => !this.unclaimedWeeks.includes(report[0]) && report[1] > 0
          )
      );
    },
    totalUnclaimed() {
      return Object.values(this.unclaimed).reduce(
        (a, b) => a + parseFloat(b),
        0
      );
    }
  },
  async created() {
    this.loading = true;
    await this.getUnclaimedWeeks();
    this.loading = false;
  },
  methods: {
    ...mapActions(['claimWeeks', 'claimStatus']),
    async getUnclaimedWeeks() {
      const claimStatus = await this.claimStatus(this.address);
      this.unclaimedWeeks = Object.entries(claimStatus)
        .filter(status => !status[1])
        .map(status => status[0]);
    },
    async handleSubmit() {
      this.submitLoading = true;
      const weeks = Object.keys(this.unclaimed);
      setTimeout(() => {
        this.claimWeeks({ address: this.address, weeks }).then(tx => {
          console.log('Claim weeks', tx);
          this.submitLoading = false;
          this.txHash = tx.hash;
          this.getUnclaimedWeeks();
        });
      }, 10);
    }
  }
};
</script>
