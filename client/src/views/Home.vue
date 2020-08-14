<template>
  <div class="pt-2">
    <Container :slim="true">
      <Block class="text-center py-4">
        <h1 class="mb-2">Claim BAL</h1>
        <form
          @submit.prevent="handleSubmit"
          style="max-width: 460px;"
          class="width-full text-center mx-auto"
        >
          <UiButton :class="!isValid && 'border-red'" class="mb-3 width-full">
            <input
              v-model.trim="input"
              type="text"
              class="input width-full text-center"
              placeholder="Your wallet address"
            />
          </UiButton>
          <UiButton
            :disabled="!input || !isValid"
            type="submit"
            class="px-6 button--submit"
          >
            Next
          </UiButton>
        </form>
      </Block>
    </Container>
    <Container>
      <h2 class="mb-3">Top 10 this week</h2>
    </Container>
    <Container :slim="true">
      <Block :slim="true">
        <div class="d-flex px-4 py-3 bg-gray-dark">
          <div v-text="'Address'" class="flex-auto" />
          <div v-text="'Amount'" />
        </div>
        <div>
          <div
            v-for="(dist, address) in lastDist"
            :key="address"
            class="d-flex px-4 py-3 border-top text-white"
          >
            <div class="flex-auto">
              <User :address="address" />
            </div>
            <div>{{ $n(dist) }} BAL</div>
          </div>
        </div>
      </Block>
    </Container>
  </div>
</template>

<script>
import { isAddress } from '@ethersproject/address';
import reports from '@/../reports';

export default {
  data() {
    return {
      input: '',
      lastDist: {}
    };
  },
  created() {
    this.input = this.web3.account;
    const lastDist = Object.entries(reports).slice(-1)[0][1];
    this.lastDist = Object.fromEntries(
      Object.entries(lastDist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    );
  },
  computed: {
    isValid() {
      if (!this.input) return true;
      return isAddress(this.input);
    }
  },
  methods: {
    async handleSubmit() {
      this.$router.push({ name: 'user', params: { address: this.input } });
    }
  }
};
</script>
