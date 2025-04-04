<script setup>
import ChannelCard from "@/pcm/components/ChannelCard.vue";
import PCM from "@/pcm/service";
import {ref} from "vue";
import {pcmChannel} from "@/pcm/entity/channel";

const service = new PCM()

const items = ref([])

service.getChannel()
    .then((result) => {
      for(const node of result) {
        items.value.push(new pcmChannel(node))
      }
    })
</script>

<template lang="pug">
.container.mb-4
  .columns.is-multiline
    .column.is-half-tablet.is-one-third-fullhd(v-for="item in items")
      ChannelCard(:item="item")
</template>

<style>

</style>