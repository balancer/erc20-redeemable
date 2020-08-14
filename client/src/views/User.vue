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
                There isn't any pending BAL here yet!
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
              :disabled="!web3.account"
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
import { sleep } from '@/helpers/utils';

export default {
  data() {
    return {
      address: this.$router.currentRoute.params.address,
      loading: false,
      loaded: false,
      submitLoading: false,
      unclaimedWeeks: []
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
    await sleep(500);
    this.unclaimedWeeks = ['10'];
    this.loading = false;
    this.input = this.web3.name || this.web3.account;
  },
  methods: {
    ...mapActions(['resolveName', 'verifyClaim', 'claimWeeks']),
    async handleSubmit() {
      this.submitLoading = true;
      let address = this.address;
      if (address.includes('.eth')) address = await this.resolveName(address);

      const isValid = await this.verifyClaim(address);
      console.log('Verify claim is valid', isValid);

      if (isValid) {
        const tx = await this.claimWeeks(address);
        console.log('Claim', tx);
      }
      this.submitLoading = false;
    }
  }
};
</script>
