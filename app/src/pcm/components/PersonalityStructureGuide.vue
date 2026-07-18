<script setup lang="ts">
import {computed, ref} from "vue";

const props = defineProps<{filters: any[]}>()

const selectedTypes = ref<string[]>([])

const findType = (name: string) => props.filters.find((item) => item.name === name)
const selectedItems = computed(() => selectedTypes.value.map(findType).filter(Boolean))

const needs = (item: any): string[] => item?.needs?.map((need: {title: string}) => need.title) ?? []
const typeColor = (item: any): string => ({
  info: '#479df8',
  link: '#9d3cf1',
  primary: '#ef8f37',
  success: '#9d6436',
  warning: '#edda52',
  danger: '#e69492',
}[item?.color?.bulmaName] ?? '#7a8795')

const typeIcon = (name: string): string => ({
  logic: 'fa-face-meh',
  persistent: 'fa-face-grimace',
  soulful: 'fa-face-kiss-wink-heart',
  dreamer: 'fa-face-grin-stars',
  rebel: 'fa-face-grin-tongue-wink',
  activist: 'fa-face-grin-wide',
}[name] ?? 'fa-user')

const toggleType = (name: string): void => {
  const index = selectedTypes.value.indexOf(name)
  if (index !== -1) {
    selectedTypes.value.splice(index, 1)
    return
  }

  if (selectedTypes.value.length === 2) selectedTypes.value.shift()
  selectedTypes.value.push(name)
}

const isSelected = (name: string): boolean => selectedTypes.value.includes(name)
</script>

<template lang="pug">
section.personality-structure
  .personality-structure__intro
    .personality-structure__copy
      h2.title.is-5 Структура личности: «лифт» PCM
      p В каждом человеке есть все шесть типов в разной последовательности. База помогает выбрать понятный язык контакта, а фаза указывает на актуальные потребности и возможные реакции на стресс.
    span.tag.is-light Учебная схема, не профиль

  .personality-structure__legend
    span
      strong База
      |  — привычный способ воспринимать и начинать контакт.
    span
      strong Фаза
      |  — текущие мотиваторы; она может меняться в течение жизни.

  p.personality-elevator__hint Выберите до двух этажей для сравнения. Повторный клик снимает выбор.
  .personality-elevator(aria-label="Шесть этажей структуры личности")
    button.personality-elevator__floor(
      v-for="item in filters"
      :key="item.name"
      type="button"
      :class="{'is-selected': isSelected(item.name)}"
      :style="{'--type-color': typeColor(item)}"
      :aria-pressed="isSelected(item.name)"
      @click="toggleType(item.name)"
    )
      strong {{ item.personalityType }}
      span.personality-elevator__icon.icon
        i.fa(:class="typeIcon(item.name)" aria-hidden="true")
      span {{ item.getPerception?.() || item.perception?.short }}

  .personality-comparison(v-if="filters.length")
    h3.title.is-6(v-if="selectedItems.length") Сравнить два типа
    .columns.is-variable.is-3(v-if="selectedItems.length")
      .column.is-half-tablet(v-for="item in selectedItems" :key="item.name")
        article.card.personality-comparison__card
          header.card-header(:style="{backgroundColor: typeColor(item)}")
            p.card-header-title.has-text-white
              span {{ item.personalityType }}
              span.icon.personality-comparison__header-icon
                i.fa(:class="typeIcon(item.name)" aria-hidden="true")
          .card-content
            p
              strong Фильтр: 
              | {{ item.getPerception?.() || item.perception?.short }}
            p
              strong Сильная сторона: 
              | {{ item.getCharacter?.() || item.character?.strong }}
            .tags
              span.tag(v-for="need in needs(item)" :key="need") {{ need }}
</template>

<style scoped>
.personality-structure {
  margin-bottom: 1.25rem;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.personality-structure__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.personality-structure__copy .title {
  margin-bottom: 0.35rem;
}

.personality-structure__copy p,
.personality-structure__legend {
  color: var(--app-text-muted);
  line-height: 1.45;
}

.personality-structure__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin: 0.75rem 0;
  font-size: 0.88rem;
}

.personality-elevator {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 6px;
}

.personality-elevator__floor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1.5rem;
  gap: 0.25rem 0.4rem;
  min-height: 5.25rem;
  padding: 0.55rem;
  border: 0;
  border-right: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  cursor: pointer;
  font-size: 0.78rem;
  text-align: left;
}

.personality-elevator__floor:last-child { border-right: 0; }
.personality-elevator__floor > span:last-child { grid-column: 1 / -1; }
.personality-elevator__icon { align-self: start; justify-self: end; color: var(--type-color); font-size: 1.4rem; }
.personality-elevator__floor > span:last-child { color: var(--app-text-muted); }
.personality-elevator__floor:hover { background: var(--app-surface-muted); }
.personality-elevator__floor.is-selected { box-shadow: inset 0 0 0 3px var(--type-color), 0 0.25rem 0.75rem color-mix(in srgb, var(--type-color) 30%, transparent); font-weight: 700; }
.personality-elevator__hint { margin: 0.75rem 0 0.45rem; color: var(--app-text-muted); font-size: 0.85rem; }

.personality-comparison { margin-top: 1rem; }
.personality-comparison .title { margin-bottom: 0.75rem; }
.personality-comparison__card { height: 100%; }
.personality-comparison__card .card-header-title { align-items: center; }
.personality-comparison__header-icon { width: 1.6rem; height: 1.6rem; margin-left: auto; font-size: 1.4rem; }
.personality-comparison__card p { margin: 0.4rem 0; font-size: 0.9rem; }
.personality-comparison__card .tags { margin-top: 0.65rem; }

@media screen and (max-width: 768px) {
  .personality-structure__intro { flex-direction: column; }
  .personality-elevator { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .personality-elevator__floor:nth-child(2n) { border-right: 0; }
  .personality-elevator__floor:nth-child(n + 3) { border-top: 1px solid var(--app-border); }
}
</style>
