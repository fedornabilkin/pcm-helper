<script setup>
import PCM from "@/pcm/service";
import {ref} from "vue";
import {pcmFilter} from "@/pcm/entity/filter";

const props = defineProps(['item'])
const emit = defineEmits(['openModal'])
const item = props.item

const useFilter = ref([])
const ignoreFilter = ref([])

const service = new PCM()

const getFilter = (name, use = true) => {
  service.getFilterByName(name)
      .then((result) => {
        if (use) {
          useFilter.value.push(new pcmFilter(result))
        } else {
          ignoreFilter.value.push(new pcmFilter(result))
        }
      })
}

for (const useNode of item.filter.use) {
  getFilter(useNode)
}

for (const useNode of item.filter.ignore) {
  getFilter(useNode, false)
}

const openModal = (item, type) => {
  emit('openModal', item, type)
}

</script>

<template lang="pug">
  .card
    header.card-header
      p.card-header-title {{ item.title }}
    .card-content

      .tags.has-addons.are-large
        span.icon.tag
          i.fa.fa-people-arrows
        span.tag {{ item.initiator }}
        span.tag {{ item.recipient }}
      article.content
        .message
          .message-body {{ item.description }}

        .mt-1.tags.has-addons
          span.tag.is-light
            span.icon
              i.fa.fa-thumbs-up
          span.tag(v-for="tag in useFilter" :class="tag.backgroundColor()")
            | {{ tag.personalityType }}

        .mt-1.tags.has-addons
          span.tag.is-light
            span.icon
              i.fa.fa-thumbs-down
          span.tag(v-for="tag in ignoreFilter" :class="tag.backgroundColor()")
            | {{ tag.personalityType }}
    footer.card-footer
      a.card-footer-item.has-text-black(@click="openModal(item, 'examples')") Примеры
</template>

<style>

</style>