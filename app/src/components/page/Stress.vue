<script setup lang="ts">
import {computed, ref} from 'vue'
import {
  PCM_HINT_FILTERS,
  type PcmHintFilter,
} from '@/networker/entity/graph/pcmHint'

type StressStage = 'early' | 'escalated'

const stageOptions: Array<{value: StressStage; label: string; icon: string; description: string}> = [
  {value: 'early', label: 'Первые сигналы', icon: 'fa-wave-square', description: 'Напряжение заметно, но контакт ещё можно мягко восстановить.'},
  {value: 'escalated', label: 'Напряжение растёт', icon: 'fa-triangle-exclamation', description: 'Разговору нужна пауза, замедление и более простая форма.'},
]

const observations: Record<StressStage, Array<{value: string; label: string}>> = {
  early: [
    {value: 'withdraw', label: 'Уходит в себя или отвечает односложно'},
    {value: 'details', label: 'Застревает в деталях или контроле'},
    {value: 'avoid', label: 'Не отвечает прямо, откладывает решение'},
    {value: 'tense', label: 'Появляется заметное напряжение в тоне'},
  ],
  escalated: [
    {value: 'attack', label: 'Резкость, обвинения или обесценивание'},
    {value: 'confusion', label: 'Путается, не слышит вопрос или повторяется'},
    {value: 'shutdown', label: 'Полностью закрывается или выходит из разговора'},
    {value: 'pressure', label: 'Давит, торопит или требует немедленного ответа'},
  ],
}

const observationAdvice: Record<string, {step: string; phrase: string}> = {
  withdraw: {
    step: 'Оставьте паузу и уменьшите количество вопросов.',
    phrase: 'Я вижу, что сейчас может быть непросто отвечать. Можем немного помолчать или вернуться позже?',
  },
  details: {
    step: 'Сведите разговор к одному факту или одному решению.',
    phrase: 'Давай пока не будем разбирать всё сразу и выберем один важный пункт.',
  },
  avoid: {
    step: 'Уберите давление и предложите простой выбор времени или формата.',
    phrase: 'Тебе удобнее ответить сейчас коротко или вернуться к этому позже?',
  },
  tense: {
    step: 'Назовите напряжение нейтрально и замедлите темп.',
    phrase: 'Кажется, разговор стал напряжённее. Давай сделаем его спокойнее.',
  },
  attack: {
    step: 'Не отвечайте атакой на атаку: поставьте паузу и обозначьте границу.',
    phrase: 'Я готов(а) обсуждать суть, но давай без взаимных обвинений. Сделаем паузу?',
  },
  confusion: {
    step: 'Говорите одной короткой мыслью и проверяйте понимание.',
    phrase: 'Сейчас важен только один вопрос: что поможет продолжить спокойнее?',
  },
  shutdown: {
    step: 'Не преследуйте человека вопросами — дайте пространство и договоритесь о возврате.',
    phrase: 'Я вижу, что продолжать сейчас трудно. Давай вернёмся к теме в удобное время.',
  },
  pressure: {
    step: 'Снимите требование немедленного ответа и верните право на паузу.',
    phrase: 'Решение не нужно принимать прямо сейчас. Сколько времени тебе потребуется?',
  },
}

const restoreByFilter: Record<PcmHintFilter, {step: string; phrase: string; avoid: string}> = {
  logic: {step: 'Вернитесь к одному факту, критерию и времени на обдумывание.', phrase: 'Давай зафиксируем, что мы точно знаем, и спокойно выберем следующий шаг.', avoid: 'Не спорьте о компетентности и не требуйте решения немедленно.'},
  persistent: {step: 'Признайте значимость позиции и спросите мнение без давления.', phrase: 'Твоя точка зрения важна. Что для тебя здесь принципиально?', avoid: 'Не обесценивайте убеждения и не продавливайте решение.'},
  soulful: {step: 'Сначала восстановите тёплый контакт, потом обсуждайте суть.', phrase: 'Мне важно, как ты сейчас. Можем на минуту замедлиться?', avoid: 'Не переходите к сухой критике и не игнорируйте чувства.'},
  dreamer: {step: 'Уберите лишние стимулы и дайте одну ясную, небольшую задачу.', phrase: 'Сейчас достаточно одного шага: давай уточним его и сделаем паузу.', avoid: 'Не перегружайте выбором и длинными объяснениями.'},
  rebel: {step: 'Снизьте формальность и верните простой живой контакт.', phrase: 'Похоже, разговор стал тяжёлым. Давай переформулирую проще.', avoid: 'Не читайте нотаций и не отвечайте раздражением на раздражение.'},
  activist: {step: 'Верните выбор и короткое действие с понятным результатом.', phrase: 'Давай выберем один удобный вариант и двинемся дальше.', avoid: 'Не затягивайте обсуждение и не лишайте человека возможности выбора.'},
}

const stage = ref<StressStage>('early')
const selectedObservations = ref<string[]>([])
const selectedFilter = ref<PcmHintFilter | ''>('')
const isEmergency = ref(false)

const currentStage = computed(() => stageOptions.find(item => item.value === stage.value) ?? stageOptions[0])
const activeFilter = computed(() => PCM_HINT_FILTERS.find(item => item.value === selectedFilter.value))
const restore = computed(() => selectedFilter.value ? restoreByFilter[selectedFilter.value] : null)
const selectedObservationAdvice = computed(() => selectedObservations.value.map(value => {
  const observation = observations[stage.value].find(item => item.value === value)
  return {
    label: observation?.label ?? value,
    ...observationAdvice[value],
  }
}))

const toggleObservation = (value: string): void => {
  selectedObservations.value = selectedObservations.value.includes(value)
    ? selectedObservations.value.filter(item => item !== value)
    : [...selectedObservations.value, value]
}

const setStage = (value: StressStage): void => {
  stage.value = value
  selectedObservations.value = []
}

const setFilter = (value: PcmHintFilter): void => {
  selectedFilter.value = selectedFilter.value === value ? '' : value
}
</script>

<template lang="pug">
  .container.stress-page.mb-5
    section.stress-hero
      .stress-hero__copy
        h1.title.is-3 Стресс-радар
        p.subtitle.is-6 Отмечайте наблюдаемое в разговоре и выбирайте бережный следующий шаг — без ярлыков и диагнозов.
      span.tag.is-light Наблюдение, не оценка

    .stress-layout
      section.stress-controls
        article.stress-step
          .stress-step__heading
            span.icon
              i.fa.fa-eye
            h2.title.is-6 Что замечаете?
          .stress-stage-options
            button.stress-stage(
              v-for="item in stageOptions"
              :key="item.value"
              type="button"
              :class="{'is-selected': stage === item.value}"
              @click="setStage(item.value)"
            )
              span.icon
                i.fa(:class="item.icon")
              span {{ item.label }}
          p.help {{ currentStage.description }}
          .stress-observations
            button.stress-observation(
              v-for="item in observations[stage]"
              :key="item.value"
              type="button"
              :class="{'is-selected': selectedObservations.includes(item.value)}"
              @click="toggleObservation(item.value)"
            )
              span.icon
                i.fa(:class="selectedObservations.includes(item.value) ? 'fa-check' : 'fa-plus'")
              span {{ item.label }}

        article.stress-step
          .stress-step__heading
            span.icon
              i.fa.fa-compass
            h2.title.is-6 Гипотеза о типе
            span.tag.is-light необязательно
          .tags.stress-type-tags
            button.tag.stress-type(
              v-for="item in PCM_HINT_FILTERS"
              :key="item.value"
              type="button"
              :style="{'--type-color': item.color}"
              :class="{'is-selected': selectedFilter === item.value}"
              :title="item.label"
              :aria-label="item.label"
              @click="setFilter(item.value)"
            )
              span.icon
                i.fa(:class="item.icon")
          p.help(v-if="!activeFilter") Если гипотезы нет, радар предложит нейтральный способ восстановить контакт.
          p.help(v-else) Подсказка использует выбранный фильтр как рабочую гипотезу.

        article.stress-step.stress-emergency-control
          .stress-step__heading
            span.icon
              i.fa.fa-life-ring
            h2.title.is-6 Экстренная ситуация
          button.stress-emergency-toggle(
            type="button"
            role="switch"
            :aria-checked="isEmergency"
            :class="{'is-active': isEmergency}"
            @click="isEmergency = !isEmergency"
          )
            span.stress-emergency-toggle__track
              span.stress-emergency-toggle__thumb
            span Нужна немедленная стабилизация, а не обсуждение

      section.stress-result(:style="activeFilter ? {'--type-color': activeFilter.color} : undefined")
        header.stress-result__header
          div
            p.heading Безопасный следующий шаг
            h2.title.is-4 {{ isEmergency ? 'Сначала безопасность' : currentStage.label }}
          span.icon.stress-result__icon
            i.fa(:class="isEmergency ? 'fa-life-ring' : activeFilter?.icon ?? 'fa-handshake'")
        .stress-result__content
          .notification.is-light.stress-disclaimer
            span.icon
              i.fa.fa-heart
            span Радар описывает ситуацию, а не человека. Вы можете остановить разговор в любой момент.
          template(v-if="isEmergency")
            .stress-result-card.is-emergency
              h3 Действуйте коротко и конкретно
              ol
                li Проверьте непосредственную безопасность и позовите подходящую помощь.
                li Говорите спокойно: «Посмотри на меня. Дыши со мной. Сейчас сделаем один шаг».
                li Уберите спор, детали и требования. Вернитесь к разговору только после стабилизации.
              p.help Если есть риск причинения вреда себе или другим — обратитесь в экстренные службы вашего региона.
          template(v-else)
            .stress-result-card
              .stress-result-card__heading
                span.icon
                  i.fa.fa-pause
                h3 Начните с паузы
              p(v-if="stage === 'early'") Замедлите темп: назовите то, что видите, без интерпретации, и задайте один простой вопрос.
              p(v-else) Не пытайтесь договориться прямо сейчас. Предложите паузу и согласуйте, когда можно вернуться к теме.
            .stress-observation-advice(v-if="selectedObservationAdvice.length")
              .stress-observation-advice__heading
                span.icon
                  i.fa.fa-list-check
                h3 По выбранным наблюдениям
              .stress-observation-advice__grid
                article.stress-result-card(v-for="item in selectedObservationAdvice" :key="item.label")
                  h4 {{ item.label }}
                  p {{ item.step }}
                  blockquote {{ item.phrase }}
            .stress-result-pair
              .stress-result-card
                .stress-result-card__heading
                  span.icon
                    i.fa.fa-comment-dots
                  h3 Фраза
                blockquote(v-if="restore") {{ restore.phrase }}
                blockquote(v-else) «Похоже, сейчас непросто. Давай сделаем паузу и поймём, что поможет продолжить спокойнее».
              .stress-result-card
                .stress-result-card__heading
                  span.icon
                    i.fa.fa-compass
                  h3 Опора
                p(v-if="restore") {{ restore.step }}
                p(v-else) Вернитесь к нейтральному вопросу, одному факту и праву человека взять паузу.
            .stress-result-card.is-caution
              .stress-result-card__heading
                span.icon
                  i.fa.fa-shield-halved
                h3 Чего избегать
              p(v-if="restore") {{ restore.avoid }}
              p(v-else) Не приписывайте мотивы, не повышайте голос и не используйте состояние человека как аргумент.
            p.stress-observation-summary(v-if="selectedObservations.length")
              strong Отмечено: 
              | {{ selectedObservations.length }} наблюд. Это помогает выбрать темп разговора, но не определяет причину состояния.
</template>

<style scoped>
.stress-page { max-width: 1120px; }
.stress-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.stress-hero .title { margin-bottom: 0.35rem; }
.stress-hero .subtitle { max-width: 44rem; color: var(--app-text-muted); }
.stress-layout { display: grid; grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr); gap: 1rem; align-items: start; }
.stress-controls { display: grid; gap: 0.75rem; }
.stress-step, .stress-result { border: 1px solid var(--app-border); border-radius: 0.7rem; background: var(--app-surface); box-shadow: var(--app-shadow); }
.stress-step { padding: 1rem; }
.stress-step__heading, .stress-result-card__heading { display: flex; align-items: center; gap: 0.45rem; }
.stress-step__heading { margin-bottom: 0.65rem; }
.stress-step__heading .title { margin: 0; }
.stress-step__heading .tag { margin-left: auto; }
.stress-stage-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem; }
.stress-stage, .stress-observation { border: 1px solid var(--app-border); border-radius: 0.45rem; background: var(--app-surface-muted); color: var(--app-text); cursor: pointer; text-align: left; }
.stress-stage { display: flex; align-items: center; gap: 0.4rem; min-height: 2.45rem; padding: 0.45rem 0.55rem; font-size: 0.8rem; }
.stress-stage.is-selected { border-color: var(--app-accent); background: color-mix(in srgb, var(--app-accent) 15%, var(--app-surface)); font-weight: 700; }
.stress-observations { display: grid; gap: 0.4rem; margin-top: 0.7rem; }
.stress-observation { display: flex; align-items: center; gap: 0.4rem; min-height: 2.45rem; padding: 0.45rem 0.55rem; font-size: 0.82rem; }
.stress-observation.is-selected { border-color: var(--app-accent); background: color-mix(in srgb, var(--app-accent) 12%, var(--app-surface)); }
.stress-type-tags { margin-bottom: 0; }
.stress-type { min-width: 2.6rem; border: 1px solid var(--type-color); background: var(--app-surface-muted); color: var(--type-color); cursor: pointer; }
.stress-type .icon { margin: 0; font-size: 1.3rem; }
.stress-type.is-selected { background: color-mix(in srgb, var(--type-color) 18%, var(--app-surface)); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--type-color) 42%, transparent), 0 0.2rem 0.55rem color-mix(in srgb, var(--type-color) 22%, transparent); transform: translateY(-1px) scale(1.06); }
.stress-emergency-toggle { display: flex; align-items: center; gap: 0.65rem; width: 100%; padding: 0.25rem 0; border: 0; background: transparent; color: var(--app-text); cursor: pointer; text-align: left; }
.stress-emergency-toggle__track { display: inline-flex; flex: 0 0 auto; align-items: center; width: 2.5rem; height: 1.4rem; padding: 0.15rem; border-radius: 999px; background: var(--app-border); transition: background-color 160ms ease; }
.stress-emergency-toggle__thumb { width: 1.1rem; height: 1.1rem; border-radius: 50%; background: var(--app-surface); box-shadow: 0 0.1rem 0.25rem rgb(0 0 0 / 20%); transition: transform 160ms ease; }
.stress-emergency-toggle.is-active { color: #b42318; font-weight: 700; }
.stress-emergency-toggle.is-active .stress-emergency-toggle__track { background: #ef4444; }
.stress-emergency-toggle.is-active .stress-emergency-toggle__thumb { transform: translateX(1.1rem); }
.stress-result { overflow: hidden; border-color: var(--type-color, var(--app-border)); }
.stress-result__header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.1rem; background: color-mix(in srgb, var(--type-color, var(--app-accent)) 10%, var(--app-surface)); }
.stress-result__header .heading { margin-bottom: 0.2rem; color: var(--app-text-muted); }
.stress-result__header .title { margin: 0; }
.stress-result__icon { color: var(--type-color, var(--app-accent)); font-size: 2rem; }
.stress-result__content { padding: 1.1rem; }
.stress-disclaimer { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.85rem; padding: 0.7rem; border: 1px solid var(--app-border); background: var(--app-surface-muted); color: var(--app-text-muted); font-size: 0.84rem; }
.stress-disclaimer .icon { color: var(--app-accent); }
.stress-result-card { margin-top: 0.7rem; padding: 0.8rem; border: 1px solid var(--app-border); border-radius: 0.55rem; background: var(--app-surface-muted); }
.stress-result-card__heading { margin-bottom: 0.45rem; }
.stress-result-card__heading h3 { margin: 0; font-size: 0.88rem; }
.stress-result-card__heading .icon { color: var(--type-color, var(--app-accent)); }
.stress-result-card p, .stress-result-card li { color: var(--app-text-muted); line-height: 1.45; }
.stress-result-card p { margin: 0; }
.stress-result-card ol { margin: 0.35rem 0 0 1.15rem; }
.stress-result-card blockquote { margin: 0; padding: 0.7rem 0.8rem; border-left: 3px solid var(--type-color, var(--app-accent)); border-radius: 0 0.4rem 0.4rem 0; background: var(--app-surface); color: var(--app-text); font-weight: 600; line-height: 1.45; }
.stress-result-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
.stress-result-pair .stress-result-card { height: calc(100% - 0.7rem); }
.stress-result-card.is-caution { background: color-mix(in srgb, #f6b73c 14%, var(--app-surface)); }
.stress-result-card.is-caution .stress-result-card__heading .icon, .stress-result-card.is-caution h3 { color: #a96600; }
.stress-result-card.is-emergency { border-color: #ef4444; background: color-mix(in srgb, #ef4444 9%, var(--app-surface)); }
.stress-result-card.is-emergency .help { margin: 0.7rem 0 0; }
.stress-observation-advice { margin-top: 0.9rem; }
.stress-observation-advice__heading { display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.45rem; }
.stress-observation-advice__heading .icon { color: var(--type-color, var(--app-accent)); }
.stress-observation-advice__heading h3 { margin: 0; font-size: 0.88rem; }
.stress-observation-advice__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
.stress-observation-advice__grid .stress-result-card { height: calc(100% - 0.7rem); }
.stress-observation-advice__grid .stress-result-card h4 { margin: 0 0 0.35rem; color: var(--app-text); font-size: 0.82rem; }
.stress-observation-advice__grid .stress-result-card blockquote { margin-top: 0.65rem; font-size: 0.84rem; }
.stress-observation-summary { margin: 0.85rem 0 0; color: var(--app-text-muted); font-size: 0.8rem; }

@media screen and (max-width: 768px) {
  .stress-hero { flex-direction: column; gap: 0.5rem; }
  .stress-layout, .stress-result-pair, .stress-observation-advice__grid { grid-template-columns: 1fr; }
}

@media screen and (max-width: 400px) {
  .stress-stage-options { grid-template-columns: 1fr; }
}
</style>
