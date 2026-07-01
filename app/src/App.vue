<script setup>
import {computed} from 'vue';
import {useRoute} from 'vue-router';
import Header from './components/template/Header.vue';
import Main from './components/page/Main.vue';
import Footer from './components/template/Footer.vue';

const route = useRoute()
const showFooter = computed(() => route.meta.hideFooter !== true)
</script>

<template lang="pug">
Header
router-view
Footer(v-if="showFooter")
</template>

<style></style>
