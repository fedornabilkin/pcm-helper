<script setup lang="ts">
import {useRoute} from "vue-router";

const route = useRoute()

const sections = [
  {
    routeName: 'main',
    label: 'Наблюдать',
    description: 'Фильтры восприятия',
    icon: 'fa-filter',
  },
  {
    routeName: 'personality',
    label: 'Понять',
    description: 'Части и структура личности',
    icon: 'fa-person-rays',
  },
  {
    routeName: 'interaction',
    label: 'Выбрать формат',
    description: 'Стили взаимодействия',
    icon: 'fa-people-arrows',
  },
  {
    routeName: 'channel',
    label: 'Начать разговор',
    description: 'Каналы коммуникации',
    icon: 'fa-tower-cell',
  },
]

const isActive = (routeName: string): boolean => route.name === routeName
</script>

<template lang="pug">
section.pcm-learning-nav(aria-label="Навигатор по PCM")
  .pcm-learning-nav__heading
    h2.title.is-5 Практика PCM
    p Начните с наблюдения за словами и реакциями, затем выберите подходящий способ начать разговор.
  .pcm-learning-nav__steps
    .tabs.is-toggle.is-toggle-rounded.is-small
      ul
        li(v-for="section in sections" :key="section.routeName" :class="{'is-active': isActive(section.routeName)}")
          router-link(:to="{name: section.routeName}" :title="section.description")
            span.icon.is-small
              i.fa(:class="section.icon" aria-hidden="true")
            span {{ section.label }}
</template>

<style scoped>
.pcm-learning-nav {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
  box-shadow: var(--app-shadow);
}

.pcm-learning-nav__heading .title {
  margin-bottom: 0.25rem;
}

.pcm-learning-nav__heading p {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.pcm-learning-nav__steps .tabs {
  margin-bottom: 0;
  overflow-x: auto;
}

.pcm-learning-nav__steps .tabs ul {
  flex-wrap: nowrap;
}

.pcm-learning-nav__steps .tabs a {
  min-height: 2.2rem;
  gap: 0.35rem;
  padding: 0.4rem 0.6rem;
}

.pcm-learning-nav__steps .tabs li.is-active a {
  border-color: var(--app-text);
  background: var(--app-surface);
  box-shadow: 0 0.2rem 0.6rem rgb(0 0 0 / 16%);
  color: var(--app-text);
  font-weight: 700;
}

.pcm-learning-nav__steps .tabs li.is-active a:hover {
  background: var(--app-surface-muted);
  color: var(--app-text);
}

@media screen and (max-width: 768px) {
  .pcm-learning-nav {
    grid-template-columns: 1fr;
    margin-right: 0;
    margin-left: 0;
    padding: 0.75rem;
  }

  .pcm-learning-nav__steps .tabs ul { justify-content: flex-start; }
}
</style>
