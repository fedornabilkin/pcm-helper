<script setup>

import PCM from "@/pcm/service";
import {pcmFilter} from "@/pcm/entity/filter";
import {ref} from "vue";
import FilterCard from "@/pcm/components/FilterCard.vue";
import WordModal from "@/pcm/components/WordModal.vue";

const service = new PCM()

const items = ref([])

service.getFilters()
    .then((result) => {
      for(const node of result) {
        items.value.push(new pcmFilter(node))
      }
    })

const currentItem = ref(undefined)

const wordModalActive = ref(false)
const openWordModal = (item) => {
  console.log(item)
  currentItem.value = item
  wordModalActive.value = true
}

</script>
<template lang="pug">
.container.mb-4
  .columns.is-multiline
    .column.is-half-tablet.is-one-third-fullhd(v-for="item in items")
      filter-card(:item="item" @open-modal="openWordModal")

WordModal(
  v-if="wordModalActive"
  :is-active="wordModalActive"
  :item="currentItem"
  @close="wordModalActive=false"
)
</template>

<style>

</style>
