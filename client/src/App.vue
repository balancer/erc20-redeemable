<template>
  <div id="app" class="overflow-hidden">
    <UiLoading v-if="app.loading || !app.init" class="overlay big" />
    <div v-else>
      <Topnav />
      <div class="pb-6 overflow-hidden">
        <Container :slim="true" v-if="app.migratedToOrchard">
          <div class="d-flex flex-items-center text-white bg-blue" style="height: 100px;">
            <div class="alert alert-primary p-5" role="alert">
              <h2> Liquidity Mining Update</h2>
              This distribution contract has been deprecated. Previous distributions will be claimable here forever. You might have additional distributions available to claim on the&nbsp;
              <a href="https://app.balancer.fi" target="_blank">
                main app
                <Icon name="external-link" class="ml-1" />
              </a>
              </div>
          </div>
        </Container>
        <router-view :key="$route.path" class="flex-auto" />
      </div>
    </div>
    <Notifications />
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  methods: {
    ...mapActions(['init'])
  },
  created() {
    this.init();
  }
};
</script>
