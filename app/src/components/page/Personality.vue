<script setup>
import PCM from "@/pcm/service";
import {ref} from "vue";
import {pcmPersonality} from "@/pcm/entity/personality";
import PersonalityCard from "@/pcm/components/PersonalityCard.vue";
import PcmLearningNav from "@/pcm/components/PcmLearningNav.vue";
import PersonalityStructureGuide from "@/pcm/components/PersonalityStructureGuide.vue";
import {pcmFilter} from "@/pcm/entity/filter";

const service = new PCM()

const items = ref([])
const filters = ref([])

service.getPersonality()
    .then((result) => {
      for(const node of result) {
        items.value.push(new pcmPersonality(node))
      }
    })

service.getFilter()
    .then((result) => {
      for(const node of result) {
        filters.value.push(new pcmFilter(node))
      }
    })
</script>

<template lang="pug">
.container.mb-4
  PcmLearningNav
  PersonalityStructureGuide(:filters="filters")
  .columns.is-multiline
    .column.is-half-tablet.is-one-third-fullhd(v-for="item in items")
      PersonalityCard(:item="item")
</template>

<style>

</style>
