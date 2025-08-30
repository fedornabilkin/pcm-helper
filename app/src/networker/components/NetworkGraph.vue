<script setup lang="ts">
import {DrawNetwork} from "@/networker/graph/draw.ts";
import {onMounted} from "vue";

const props = defineProps(['dto'])
const graphId = 'nw-graph'

const draw = new DrawNetwork({
  dto: props.dto,
  box: {w:400,h:400}
})

onMounted(() => {
  draw.render(document.getElementById(graphId) as HTMLElement)
})
</script>

<template lang="pug">
  .network-graph(:id="graphId")
</template>

<style>
</style>