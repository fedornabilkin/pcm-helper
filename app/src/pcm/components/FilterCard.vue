<script setup>
import TagList from "@/pcm/components/TagList.vue";

const props = defineProps(['item'])
const emit = defineEmits(['openModal'])
const item = props.item

const bgCard = (item) => {
  const bg = 'has-background-' + item.color.bulmaName
  return bg
  const bg2 = 'has-background-' + item.color.bulmaName + '-50'
  const text = 'has-text-' + item.color.bulmaName + '-50-invert'
  return `${bg2} ${text}`
  // has-background-primary-50 has-text-primary-50-invert
}

const bgTag = (item) => {
  return item.tagBackground()
}

const headerIcon = (item) => {
  const icons = {
    logic: 'fa-solid fa-face-meh',
    persistent: 'fa-solid fa-face-grimace',
    soulful: 'fa-solid fa-face-kiss-wink-heart',
    dreamer: 'fa-solid fa-face-grin-stars',
    rebel: 'fa-solid fa-face-grin-tongue-wink',
    activist: 'fa-solid fa-face-grin-wide',
  }
  return icons[item.name]
}

const openModal = (item) => {
  emit('openModal', item)
}
</script>

<template lang="pug">
  .card
    header.card-header(:class="bgCard(item)")
      p.card-header-title {{ item.personalityType }}
      .card-header-icon
        span.icon
          i.fa-xl(:class="headerIcon(item)" style="color:white" aria-hidden='true')
    .card-content
      .media
        .media-left
          figure.image.is-128x128.is-skeleton
            img(:src="item.img.src" :alt="item.img.alt")
        .media-content
          .content
            p.title.is-5 {{ item.title }}
            p.subtitle.is-6 {{ item.getCharacter() }}

      article.content
        .message(:class="bgTag(item)")
          .message-body
            | {{ item.description }}

        p {{ item.getFace() }}
        hr

        tag-list(:tagclass="bgTag(item)" :tags="item.keywords")
        button.button.is-small.mb-2(@click="openModal(item)") Еще слова

        p
          span.icon(title="Витальный вопрос")
            i.fa.fa-person-circle-question(:class="item.textColor(item)" aria-hidden='true')
          | {{ item.question }}
        p
          span.icon(title="Способности")
            i.fa.fa-wand-magic-sparkles(:class="item.textColor(item)" aria-hidden='true')
          | {{ item.skill }}
        p
          span.icon(title="Восприятие")
            i.fa.fa-eye(:class="item.textColor(item)" aria-hidden='true')
          | {{ item.getPerception() }}
        p
          span.icon(title="Использовать")
            i.fa.fa-user-check(:class="item.textColor(item)" aria-hidden='true')
          | {{ item.getUse() }}
</template>

<style scoped>

</style>