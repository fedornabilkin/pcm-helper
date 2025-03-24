<template lang="pug">
Header
router-view
Footer
</template>

<script>
import Header from './components/template/Header.vue';
import Main from './components/page/Main.vue';
import Footer from './components/template/Footer.vue';

export default {
  name: 'app',
  components: {
    Header,
    Main,
    Footer,
  },
};
</script>

<style></style>
