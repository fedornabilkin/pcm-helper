<script setup lang="ts">
import {onMounted} from "vue";

const props = defineProps(['draw', 'graphId', 'graphService'])
const graphId = 'nw-graph'

onMounted(() => {
  props.draw.render(document.getElementById(props.graphId) as HTMLElement)
})
</script>

<template lang="pug">
  .network-graph(:id="props.graphId")
</template>

<style>
</style>