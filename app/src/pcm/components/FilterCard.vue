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
  return item.backgroundColor()
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

const openModal = (item, type) => {
  emit('openModal', item, type)
}
</script>

<template lang="pug">
  .card(:class="item.name")
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

        p
          span.icon(title="Витальный вопрос")
            i.fa.fa-question-circle(:class="item.textColor()" aria-hidden='true')
          | {{ item.question }}
        p
          span.icon(title="Способности")
            i.fa.fa-wand-magic-sparkles(:class="item.textColor()" aria-hidden='true')
          | {{ item.skill }}
        p
          span.icon(title="Восприятие")
            i.fa.fa-eye(:class="item.textColor()" aria-hidden='true')
          | {{ item.getPerception() }}
        p
          span.icon(title="Использовать")
            i.fa.fa-user-check(:class="item.textColor()" aria-hidden='true')
          | {{ item.getUse() }}
    footer.card-footer
      a.card-footer-item(:class="item.textColor()" @click="openModal(item, 'word')") Слова
      a.card-footer-item(:class="item.textColor()" @click="openModal(item, 'needs')") Потребности
      a.card-footer-item(:class="item.textColor()" @click="openModal(item, 'stress')") Стресс
</template>

<style scoped>
/* ----------------------------------------------
  URL: https://xsgames.co/animatiss
---------------------------------------------- */

.card.dreamer .card-header-title {
  animation: blur-out-contract 12s linear both;
  animation-iteration-count: infinite;
}

@keyframes blur-out-contract {
  0% {transform: scale(1); filter: blur(.01px);}
  20% {transform: scale(0); filter: blur(12px); opacity: 0}
  25% {transform: scale(1); filter: blur(.01px); opacity: 1}
}

.card.rebel .card-header-title{
  transform: rotate(-4deg);
}

.card.rebel .card-header-icon span.icon{
  animation:jello-horizontal 7s linear both;
  animation-iteration-count: infinite;
  animation-delay: .3s;
}

@keyframes jello-horizontal {
  0% {transform: scaleZ(1);}
  3% {transform: scale3d(1.25, .75, 1);}
  4% {transform: scale3d(.75, 1.25, 1);}
  5% {transform: scale3d(1.15, .85, 1);}
  6% {transform: scale3d(.95, 1.05, 1);}
  7% {transform: scale3d(1.05, .95, 1);}
  100% {transform: scaleZ(1);}
}

.card.activist .card-header-title {
  animation: move-right-left 15s linear both;
  animation-iteration-count: infinite;
  animation-delay: .3s;
}

@keyframes move-right-left {
  0% {transform: translateX(0)}
  50% {transform: translateX(50px)}
  100% {transform: translateX(0)}
}
</style>