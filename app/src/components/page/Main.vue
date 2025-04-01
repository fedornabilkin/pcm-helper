<script setup>

import PCM from "@/pcm/service";
import {pcmFilter} from "@/pcm/entity/filter";
import {ref} from "vue";
import FilterCard from "@/pcm/components/FilterCard.vue";
import WordModal from "@/pcm/components/WordModal.vue";
import NeedsModal from "@/pcm/components/NeedsModal.vue";
import StressModal from "@/pcm/components/StressModal.vue";

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
const needsModalActive = ref(false)
const stressModalActive = ref(false)

const openModal = (item, type) => {
  currentItem.value = item
  if (type === 'word') {
    wordModalActive.value = true
  }
  if (type === 'needs') {
    needsModalActive.value = true
  }
  if (type === 'stress') {
    stressModalActive.value = true
  }
}

</script>
<template lang="pug">
.container.mb-4
  .columns.is-multiline
    .column.is-half-tablet.is-one-third-fullhd(v-for="item in items")
      filter-card(:item="item" @open-modal="openModal")

WordModal(
  v-if="wordModalActive"
  :is-active="wordModalActive"
  :item="currentItem"
  @close="wordModalActive=false"
)

NeedsModal(
  v-if="needsModalActive"
  :is-active="needsModalActive"
  :item="currentItem"
  @close="needsModalActive=false"
)

StressModal(
  v-if="stressModalActive"
  :is-active="stressModalActive"
  :item="currentItem"
  @close="stressModalActive=false"
)
</template>

<style>

</style>
