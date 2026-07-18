<script setup lang="ts">
import {useRoute} from 'vue-router'

const route = useRoute()

const services = [
  {
    routeName: 'conversation',
    title: 'Навигатор разговора',
    description: 'Подготовить следующий шаг',
    icon: 'fa-comments',
  },
  {
    routeName: 'stress',
    title: 'Стресс-радар',
    description: 'Выбрать бережную реакцию',
    icon: 'fa-life-ring',
  },
  {
    routeName: 'needs',
    title: 'Потребности и ресурс',
    description: 'Провести личный чек-ин',
    icon: 'fa-seedling',
  },
  {
    routeName: 'practice',
    title: 'Практикум PCM',
    description: 'Потренировать навыки',
    icon: 'fa-graduation-cap',
  },
  {
    routeName: 'dictionary',
    title: 'Словарь фраз',
    description: 'Подобрать и сохранить формулировку',
    icon: 'fa-book-open',
  },
]
</script>

<template lang="pug">
  section.service-shortcuts(aria-label="Сервисы PCM Helper")
    .container.service-shortcuts__inner
      .service-shortcuts__links
        router-link.service-shortcut(
          v-for="service in services"
          :key="service.routeName"
          :to="{name: service.routeName}"
          :class="{'is-active': route.name === service.routeName}"
        )
          span.icon.service-shortcut__icon
            i.fa(:class="service.icon" aria-hidden="true")
          span.service-shortcut__copy
            strong {{ service.title }}
            small {{ service.description }}
</template>

<style scoped>
.service-shortcuts {
  margin: 0.1rem 0 1rem;
}

.service-shortcuts__inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.service-shortcuts__links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
  width: 100%;
  gap: 0.5rem;
}

.service-shortcut {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.55rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--app-border);
  border-radius: 0.55rem;
  background: var(--app-surface-soft);
  box-shadow: var(--app-shadow);
  color: var(--app-text);
  text-decoration: none;
}

.service-shortcut:hover {
  background: var(--app-surface-muted);
  color: var(--app-text);
}

.service-shortcut.is-active {
  border-color: var(--app-accent);
  background: color-mix(in srgb, var(--app-accent) 13%, var(--app-surface));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 36%, transparent), var(--app-shadow);
}

.service-shortcut__icon {
  color: var(--app-accent);
  font-size: 1.1rem;
}

.service-shortcut__copy {
  display: grid;
  line-height: 1.08;
}

.service-shortcut__copy strong { font-size: 0.82rem; }
.service-shortcut__copy small { margin-top: 0.15rem; color: var(--app-text-muted); font-size: 0.7rem; }

@media screen and (max-width: 767px) {
  .service-shortcuts__inner { align-items: flex-start; flex-direction: column; gap: 0.4rem; }
  .service-shortcuts__links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .service-shortcut { min-width: 0; }
  .service-shortcut__copy small { display: none; }
  .service-shortcut__copy strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

@media screen and (max-width: 480px) {
  .service-shortcuts__links { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0.35rem; }
  .service-shortcut { justify-content: center; min-height: 2.35rem; padding: 0.35rem; }
  .service-shortcut__copy { display: none; }
}
</style>
