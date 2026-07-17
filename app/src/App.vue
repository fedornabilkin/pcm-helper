<script setup lang="ts">
import {computed} from 'vue';
import {useRoute} from 'vue-router';
import Header from './components/template/Header.vue';
import Footer from './components/template/Footer.vue';

const route = useRoute()
const showFooter = computed(() => route.meta.hideFooter !== true)
</script>

<template lang="pug">
.app-shell
  Header
  main.app-main
    router-view
  Footer(v-if="showFooter")
</template>

<style>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1 0 auto;
}
</style>
