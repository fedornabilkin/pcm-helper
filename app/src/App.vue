<script setup lang="ts">
import {computed} from 'vue';
import {useRoute} from 'vue-router';
import Header from './components/template/Header.vue';
import Footer from './components/template/Footer.vue';
import ServiceShortcuts from './components/template/ServiceShortcuts.vue';

const route = useRoute()
const showFooter = computed(() => route.meta.hideFooter !== true)
const showServices = computed(() => [
  'main', 'personality', 'interaction', 'channel', 'conversation', 'stress', 'needs', 'practice', 'dictionary',
].includes(String(route.name)))
</script>

<template lang="pug">
.app-shell
  Header
  ServiceShortcuts(v-if="showServices")
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
