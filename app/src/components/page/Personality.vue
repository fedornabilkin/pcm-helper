<script setup>
import PCM from "@/pcm/service";
import {ref} from "vue";
import {pcmPersonality} from "@/pcm/entity/personality";
import PersonalityCard from "@/pcm/components/PersonalityCard.vue";

const service = new PCM()

const items = ref([])

service.getPersonality()
    .then((result) => {
      for(const node of result) {
        items.value.push(new pcmPersonality(node))
      }
    })
</script>

<template lang="pug">
.container.mb-4
  .columns.is-multiline
    .column.is-half-tablet.is-one-third-fullhd(v-for="item in items")
      PersonalityCard(:item="item")
</template>

<style>

</style>