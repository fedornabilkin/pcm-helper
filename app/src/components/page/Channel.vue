<script setup>
import ChannelCard from "@/pcm/components/ChannelCard.vue";
import PCM from "@/pcm/service";
import {ref} from "vue";
import {pcmChannel} from "@/pcm/entity/channel";
import ExampleChannelModal from "@/pcm/components/ExampleChannelModal.vue";

const service = new PCM()

const items = ref([])

service.getChannel()
    .then((result) => {
      for(const node of result) {
        items.value.push(new pcmChannel(node))
      }
    })

const currentItem = ref(undefined)
const exampleModalActive = ref(false)

const openModal = (item) => {
  currentItem.value = item
  exampleModalActive.value = true
}
</script>

<template lang="pug">
.container.mb-4
  .columns.is-multiline
    .column.is-half-tablet.is-one-third-fullhd(v-for="item in items")
      ChannelCard(:item="item" @open-modal="openModal")

ExampleChannelModal(
  v-if="exampleModalActive"
  :is-active="exampleModalActive"
  :item="currentItem"
  @close="exampleModalActive=false"
)
</template>

<style>

</style>