<script setup lang="ts">
import {computed, ref} from 'vue'
import type {Node} from '@/networker/entity/graph/node'
import {
  PCM_HINT_CHANNELS,
  PCM_HINT_CONFIDENCE,
  PCM_HINT_FILTERS,
  PCM_HINT_INVOLVEMENT,
  PCM_HINT_STIMULUS,
  type PcmHintFilter,
} from '@/networker/entity/graph/pcmHint'

const props = defineProps<{
  node: Node;
}>()

const emit = defineEmits<{
  change: [];
}>()

const goal = ref('discuss')

const selectedFilter = computed(() => PCM_HINT_FILTERS.find(
  item => item.value === props.node.pcmHint.filter,
))

const hintColorStyle = computed(() => selectedFilter.value
  ? {'--pcm-hint-color': selectedFilter.value.color}
  : {},
)

const needsByFilter: Record<PcmHintFilter, string[]> = {
  logic: ['признание работы', 'время на планирование'],
  persistent: ['признание убеждений', 'структура'],
  soulful: ['признание личности', 'тёплая атмосфера'],
  dreamer: ['время в одиночестве', 'ясные инструкции'],
  rebel: ['игра и контакт', 'лёгкость'],
  activist: ['динамика', 'свобода выбора'],
}

const adviceByFilter: Record<PcmHintFilter, {opening: string; focus: string; avoid: string}> = {
  logic: {
    opening: 'Начните с цели и фактов.',
    focus: 'Дайте структуру, варианты и время подумать.',
    avoid: 'Не торопите с решением и не уходите в общие слова.',
  },
  persistent: {
    opening: 'Спросите мнение и покажите, что его позиция услышана.',
    focus: 'Обсудите ценности, принципы и понятные критерии.',
    avoid: 'Не обесценивайте убеждения и не давите авторитетом.',
  },
  soulful: {
    opening: 'Установите тёплый личный контакт.',
    focus: 'Назовите вклад человека и проявите искреннее внимание.',
    avoid: 'Не начинайте с холодной критики или резких формулировок.',
  },
  dreamer: {
    opening: 'Коротко и спокойно обозначьте, что нужно сделать.',
    focus: 'Дайте одну ясную задачу, контекст и пространство для самостоятельной работы.',
    avoid: 'Не перегружайте обсуждением и множеством вариантов.',
  },
  rebel: {
    opening: 'Начните живо и по-человечески.',
    focus: 'Используйте простой язык, выбор и возможность откликнуться сразу.',
    avoid: 'Не читайте длинную лекцию и не говорите канцеляритом.',
  },
  activist: {
    opening: 'Предложите короткий и энергичный формат.',
    focus: 'Дайте выбор, действие и ощутимый результат.',
    avoid: 'Не затягивайте детали и не ограничивайте без необходимости.',
  },
}

const channelAdvice: Record<string, string> = {
  question: 'Формат: задавайте конкретные вопросы и оставляйте место для ответа.',
  caring: 'Формат: добавьте поддержку и признание человека.',
  directive: 'Формат: сформулируйте ясную, короткую просьбу или следующий шаг.',
  emotional: 'Формат: допустимы эмоции, энергия и непосредственная реакция.',
  interrupt: 'Формат: используйте только для быстрой помощи в стрессовой ситуации.',
}

const goalLabel = computed(() => ({
  discuss: 'обсудить задачу',
  request: 'о чём-то попросить',
  feedback: 'дать обратную связь',
  tension: 'снизить напряжение',
}[goal.value] ?? 'провести разговор'))

const selectedAdvice = computed(() => {
  const filter = props.node.pcmHint.filter
  return filter ? adviceByFilter[filter] : null
})

const suggestedNeeds = computed(() => {
  const filter = props.node.pcmHint.filter
  return filter ? needsByFilter[filter] : []
})

const toggleNeed = (need: string): void => {
  const current = props.node.pcmHint.needs
  props.node.pcmHint.needs = current.includes(need)
    ? current.filter(item => item !== need)
    : [...current, need]
  emit('change')
}

const setFilter = (filter: PcmHintFilter): void => {
  props.node.pcmHint.filter = props.node.pcmHint.filter === filter ? '' : filter
  props.node.pcmHint.needs = []
  change()
}

const setConfidence = (confidence: typeof PCM_HINT_CONFIDENCE[number]['value']): void => {
  props.node.pcmHint.confidence = confidence
  change()
}

const setEnvironment = (
  axis: 'involvement' | 'stimulus',
  value: string,
): void => {
  const currentValue = props.node.pcmHint[axis]
  ;(props.node.pcmHint as Record<string, unknown>)[axis] = currentValue === value ? '' : value
  change()
}

const change = (): void => emit('change')
</script>

<template lang="pug">
  .pcm-hint(:style="hintColorStyle")
    .notification.is-light.pcm-hint-notice
      span.icon
        i.fa.fa-compass
      span Это рабочая гипотеза, а не диагноз. Обновляйте её по наблюдениям.

    .field
      label.label Наблюдаемый тип
      .tags.pcm-choice-tags
        button.tag.pcm-choice(
          v-for="item in PCM_HINT_FILTERS"
          :key="item.value"
          type="button"
          :class="['pcm-type-choice', {'is-selected': props.node.pcmHint.filter === item.value}]"
          :style="{'--pcm-hint-color': item.color}"
          :title="item.label"
          :aria-label="item.label"
          @click="setFilter(item.value)"
        )
          span.icon
            i.fa(:class="item.icon" aria-hidden="true")

    .pcm-hint-grid
      .field
        label.label Уверенность
        .buttons.has-addons.pcm-confidence-buttons
          button.button.is-small(
            v-for="item in PCM_HINT_CONFIDENCE"
            :key="item.value"
            type="button"
            :class="{'is-info': props.node.pcmHint.confidence === item.value}"
            @click="setConfidence(item.value)"
          ) {{ item.label }}
      .field
        label.label Канал
        .control.select.is-fullwidth
          select(v-model="props.node.pcmHint.channel" @change="change")
            option(value="") Не выбран
            option(v-for="item in PCM_HINT_CHANNELS" :key="item.value" :value="item.value") {{ item.label }}

    .field
      label.label Предпочтительная среда
      .pcm-environment-choices
        .tags.pcm-choice-tags
          button.tag.pcm-choice(
            v-for="item in PCM_HINT_INVOLVEMENT"
            :key="item.value"
            type="button"
            :class="{'is-selected': props.node.pcmHint.involvement === item.value}"
            @click="setEnvironment('involvement', item.value)"
          ) {{ item.label }}
        .tags.pcm-choice-tags
          button.tag.pcm-choice(
            v-for="item in PCM_HINT_STIMULUS"
            :key="item.value"
            type="button"
            :class="{'is-selected': props.node.pcmHint.stimulus === item.value}"
            @click="setEnvironment('stimulus', item.value)"
          ) {{ item.label }}

    .field(v-if="suggestedNeeds.length")
      label.label Предполагаемые потребности
      .tags
        button.tag.pcm-need(
          v-for="need in suggestedNeeds"
          :key="need"
          type="button"
          :class="{'is-selected': props.node.pcmHint.needs.includes(need)}"
          @click="toggleNeed(need)"
        ) {{ need }}

    .field
      label.label Что помогает
      .control
        textarea.textarea(v-model="props.node.pcmHint.helps" rows="2" placeholder="Например: лучше заранее прислать повестку" @input="change")
    .field
      label.label Чего избегать
      .control
        textarea.textarea(v-model="props.node.pcmHint.avoid" rows="2" placeholder="Например: не обсуждать в спешке при других" @input="change")

    .pcm-prep
      .pcm-prep-heading
        span.icon
          i.fa.fa-comments
        strong Подготовить разговор
      .field
        .control.select.is-fullwidth
          select(v-model="goal")
            option(value="discuss") Обсудить задачу
            option(value="request") О чём-то попросить
            option(value="feedback") Дать обратную связь
            option(value="tension") Снизить напряжение
      .content.pcm-prep-result(v-if="selectedAdvice")
        p
          strong Цель: 
          | {{ goalLabel }}.
        p {{ selectedAdvice.opening }}
        p {{ selectedAdvice.focus }}
        p(v-if="props.node.pcmHint.channel") {{ channelAdvice[props.node.pcmHint.channel] }}
        p.has-text-danger-dark
          strong Осторожно: 
          | {{ selectedAdvice.avoid }}
      p.help(v-else) Выберите наблюдаемый тип — здесь появится короткий план разговора.
</template>

<style scoped>
.pcm-hint {
  width: 100%;
}

.pcm-hint-notice {
  display: flex;
  gap: 0.45rem;
  align-items: flex-start;
  margin-bottom: 0.9rem;
  padding: 0.65rem 0.75rem;
  font-size: 0.82rem;
}

.pcm-hint-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.pcm-need {
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text);
  cursor: pointer;
}

.pcm-choice-tags {
  margin-bottom: 0;
}

.pcm-choice {
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text);
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
}

.pcm-type-choice {
  border-color: var(--pcm-hint-color);
  color: var(--pcm-hint-color);
}

.pcm-type-choice:hover {
  background: color-mix(in srgb, var(--pcm-hint-color) 12%, var(--app-surface));
}

.pcm-choice.is-selected {
  border-color: var(--pcm-hint-color, var(--app-accent));
  background: color-mix(in srgb, var(--pcm-hint-color, var(--app-accent)) 18%, var(--app-surface));
  color: var(--pcm-hint-color, var(--app-text));
  font-weight: 700;
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--pcm-hint-color, var(--app-accent)) 44%, transparent), 0 0.25rem 0.65rem color-mix(in srgb, var(--pcm-hint-color, var(--app-accent)) 24%, transparent);
  transform: translateY(-1px) scale(1.07);
  z-index: 1;
}

.pcm-choice .icon {
  margin: 0;
  min-width: 2.35rem;
  min-height: 2.2rem;
  font-size: 1.5rem;
}

.pcm-confidence-buttons {
  display: flex;
  width: 100%;
}

.pcm-confidence-buttons .button {
  flex: 1 1 0;
  min-width: 0;
  padding-left: 0.35rem;
  padding-right: 0.35rem;
}

.pcm-confidence-buttons .button.is-info {
  border-color: var(--pcm-hint-color, var(--app-accent));
  background: var(--pcm-hint-color, var(--app-accent));
  box-shadow: 0 0.2rem 0.55rem color-mix(in srgb, var(--pcm-hint-color, var(--app-accent)) 28%, transparent);
}

.pcm-environment-choices {
  display: grid;
  gap: 0.45rem;
}

.pcm-need.is-selected {
  border-color: var(--pcm-hint-color, var(--app-accent));
  background: color-mix(in srgb, var(--pcm-hint-color, var(--app-accent)) 16%, var(--app-surface));
  color: var(--pcm-hint-color, var(--app-text));
  font-weight: 700;
}

.pcm-prep {
  border-top: 1px solid var(--app-border);
  margin-top: 1rem;
  padding-top: 0.9rem;
}

.pcm-prep-heading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
}

.pcm-prep-result {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.55rem;
  background: var(--app-surface-muted);
  font-size: 0.86rem;
}

.pcm-prep-result p {
  margin-bottom: 0.45rem;
}

.pcm-prep-result p:last-child {
  margin-bottom: 0;
}

@media screen and (max-width: 380px) {
  .pcm-hint-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
