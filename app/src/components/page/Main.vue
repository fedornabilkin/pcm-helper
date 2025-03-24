<script setup>

import PCM from "@/pcm/service";
import {pcmFilter} from "@/pcm/entity/filter";
import {ref} from "vue";

const service = new PCM()

const items = ref([])

service.getFilters()
    .then((result) => {
      for(const node of result) {
        items.value.push(new pcmFilter(node))
      }
    })

const bgCard = (item) => {
  const bg = 'has-background-' + item.color.bulmaName + '-50'
  return bg
  const bg2 = 'has-background-' + item.color.bulmaName + '-50'
  const text = 'has-text-' + item.color.bulmaName + '-50-invert'
  return `${bg2} ${text}`
  // has-background-primary-50 has-text-primary-50-invert
}

const bgTag = (item) => {
  return 'is-' + item.color.bulmaName
}

</script>
<template lang="pug">
.container.mb-4
  .columns.is-multiline.is-desktop
    .column(v-for="item in items")
      .card
        header.card-header(:class="bgCard(item)")
          p.card-header-title {{ item.personalityType }}
          .card-header-icon
            span.icon
              i.fas.fa-user(aria-hidden='true')
        .card-content
          .media
            .media-left
              figure.image.is-128x128.is-skeleton
                img(:src="item.img.src" :alt="item.img.alt")
            .media-content
              .content
                p.title.is-5 {{ item.title }}
                p.subtitle.is-6 {{ item.getCharacter() }}

          article.content {{ item.description }}

        .card-content
          .content
            //.mb-2 Характер: {{ item.character.strong }}
            .mb-2
              span.icon(title="Способности")
                i.fa.fa-user-gear
              | {{ item.skill }}

            .tags
              span.tag(v-for="keyword in item.keywords" :class="bgTag(item)")
                | {{ keyword }}

        .card-content
          .content
            span.icon(title="Восприятие")
              i.fa.fa-stethoscope
            | {{ item.getPerception() }}
          .content
            span.icon(title="Использовать")
              i.fa.fa-comments
            | {{ item.getUse() }}
</template>

<style>

</style>
