<script setup>
import {useRouter} from "vue-router";

const router = useRouter()
const goBack = () => {
  router.go(-1)
}
</script>

<template lang="pug">
.panel
  p.panel-heading Page not found
  .panel-block
    button.button.is-primary(@click="goBack") Back
</template>

<style scoped>

</style>
