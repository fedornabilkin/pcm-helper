<script setup>
import InteractionCard from "@/pcm/components/InteractionCard.vue";
import PCM from "@/pcm/service";
import {ref} from "vue";
import {pcmInteraction} from "@/pcm/entity/interaction";

const service = new PCM()

const items = ref([])

service.getInteraction()
    .then((result) => {
      for(const node of result) {
        items.value.push(new pcmInteraction(node))
      }
    })
</script>

<template lang="pug">
.container.mb-4
  .columns.is-multiline
    .column.is-half-tablet.is-one-third-fullhd(v-for="item in items")
      InteractionCard(:item="item")
</template>

<style>

</style>