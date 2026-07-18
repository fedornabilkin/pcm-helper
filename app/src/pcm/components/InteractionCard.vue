<script setup>
import PCM from "@/pcm/service";
import {ref} from "vue";
import {pcmFilter} from "@/pcm/entity/filter";

const props = defineProps(['item'])
const item = props.item
const service = new PCM()
const useFilter = ref([])
const ignoreFilter = ref([])

const getFilter = (name, use = true) => {
  service.getFilterByName(name)
      .then((result) => {
        const collection = use ? useFilter : ignoreFilter
        collection.value.push(new pcmFilter(result))
      })
}

for (const name of item.filter?.use ?? []) getFilter(name)
for (const name of item.filter?.ignore ?? []) getFilter(name, false)
</script>

<template lang="pug">
.card.interaction-card
  header.card-header
    p.card-header-title {{ item.title }}
  .card-content
    .notification.is-light.interaction-card__description
      span.icon.mr-1
        i.fa.fa-compass(aria-hidden="true")
      span {{ item.description }}
    .columns.is-variable.is-2
      .column
        section.interaction-card__section.interaction-card__section--use
          h3
            span.icon
              i.fa.fa-circle-check(aria-hidden="true")
            span Когда уместен
          ul.interaction-card__list
            li(v-for="point in item.efficient" :key="point") {{ point }}
      .column
        section.interaction-card__section.interaction-card__section--risk
          h3
            span.icon
              i.fa.fa-triangle-exclamation(aria-hidden="true")
            span Риск применения
          ul.interaction-card__list
            li(v-for="point in item.disadvantages" :key="point") {{ point }}
    .interaction-card__types
      .mt-1.tags.has-addons(v-if="useFilter.length")
        span.tag.is-light
          span.icon
            i.fa.fa-thumbs-up(aria-label="Рекомендуется")
        span.tag(v-for="type in useFilter" :key="type.name" :class="type.backgroundColor()") {{ type.personalityType }}
      .mt-1.tags.has-addons(v-if="ignoreFilter.length")
        span.tag.is-light
          span.icon
            i.fa.fa-thumbs-down(aria-label="Не рекомендуется")
        span.tag(v-for="type in ignoreFilter" :key="type.name" :class="type.backgroundColor()") {{ type.personalityType }}
</template>

<style scoped>
.interaction-card { height: 100%; }
.interaction-card__description { margin-bottom: 1rem; color: var(--app-text-muted); line-height: 1.4; }
.interaction-card__types { margin-top: 1rem; }
.interaction-card__section { height: 100%; padding: 0.75rem; border: 1px solid var(--app-border); border-radius: 6px; }
.interaction-card__section--use { background: color-mix(in srgb, #23d160 9%, var(--app-surface)); }
.interaction-card__section--risk { background: color-mix(in srgb, #ff6685 9%, var(--app-surface)); }
.interaction-card__section h3 { display: flex; align-items: center; gap: 0.35rem; margin: 0 0 0.55rem; font-size: 0.95rem; }
.interaction-card__section--use h3 { color: #167a3e; }
.interaction-card__section--risk h3 { color: #b4233d; }
.interaction-card__list { margin: 0; padding-left: 1.1rem; font-size: 0.9rem; line-height: 1.35; }
.interaction-card__list li + li { margin-top: 0.5rem; }

@media screen and (max-width: 768px) {
  .interaction-card__section { margin-bottom: 0.25rem; }
}
</style>
