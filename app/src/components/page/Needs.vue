<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {useLocalStore} from '@/core/composable/store/localStore'
import {
  PCM_HINT_CHANNELS,
  PCM_HINT_FILTERS,
  PCM_HINT_INVOLVEMENT,
  PCM_HINT_STIMULUS,
  type PcmHintChannel,
  type PcmHintFilter,
  type PcmHintInvolvement,
  type PcmHintStimulus,
} from '@/networker/entity/graph/pcmHint'

interface NeedItem {
  id: string;
  title: string;
  short: string;
  icon: string;
  color: string;
  action: string;
}

interface NeedsCheckin {
  date: string;
  needs: string[];
  note: string;
  stress?: StressLevel;
}

type StressLevel = 'none' | 'early' | 'escalated' | 'acute'

interface PersonalContext {
  baseFilter: PcmHintFilter | '';
  phaseFilter: PcmHintFilter | '';
  personalities: string[];
  channel: PcmHintChannel | '';
  involvement: PcmHintInvolvement | '';
  stimulus: PcmHintStimulus | '';
  stress: StressLevel;
}

const needs: NeedItem[] = [
  {id: 'personality', title: 'Признание личности', short: 'Тёплое внимание к человеку', icon: 'fa-heart', color: '#ef8f37', action: 'Напишите или скажите человеку, что цените в нём — без привязки к результату.'},
  {id: 'sensory', title: 'Сенсорика', short: 'Комфорт и приятные ощущения', icon: 'fa-mug-hot', color: '#e69492', action: 'Добавьте один простой источник комфорта: прогулку, музыку, вкусную еду или уютное место.'},
  {id: 'structure', title: 'Структура времени', short: 'Понятный ритм и план', icon: 'fa-calendar-check', color: '#479df8', action: 'Освободите 10 минут: запишите следующий шаг и время, когда к нему вернётесь.'},
  {id: 'work', title: 'Признание вклада', short: 'Видимый результат работы', icon: 'fa-award', color: '#5b8fd9', action: 'Зафиксируйте один завершённый результат и отметьте, что именно вы в него вложили.'},
  {id: 'convictions', title: 'Признание убеждений', short: 'Уважение к позиции', icon: 'fa-scale-balanced', color: '#9d3cf1', action: 'Сформулируйте свою позицию в одном предложении и найдите человека, с которым можно обсудить её без спора.'},
  {id: 'solitude', title: 'Уединение', short: 'Пространство побыть одному', icon: 'fa-person-walking', color: '#9d6436', action: 'Забронируйте короткое время без сообщений и требований, хотя бы на 15 минут.'},
  {id: 'contact', title: 'Контакт', short: 'Живой обмен и отклик', icon: 'fa-people-group', color: '#edda52', action: 'Свяжитесь с человеком, рядом с которым можно быть собой: короткое сообщение уже достаточно.'},
  {id: 'excitement', title: 'Возбуждение и результат', short: 'Динамика, выбор, действие', icon: 'fa-bolt', color: '#e55c5c', action: 'Выберите маленькое действие с быстрым видимым результатом и сделайте его сейчас.'},
]

const personalities = [
  {id: 'computer', label: 'Компьютер', icon: 'fa-laptop-code'},
  {id: 'director', label: 'Директор', icon: 'fa-compass'},
  {id: 'protector', label: 'Протектор', icon: 'fa-shield-heart'},
  {id: 'emoter', label: 'Эмотер', icon: 'fa-face-smile'},
  {id: 'comforter', label: 'Комфортёр', icon: 'fa-hand-holding-heart'},
]

const stressLevels: Array<{value: StressLevel; label: string; icon: string; color: string; action: string}> = [
  {value: 'none', label: 'Без стресса', icon: 'fa-face-smile', color: '#23a66a', action: 'Ресурс устойчив: выберите одну потребность, которую хочется поддержать профилактически.'},
  {value: 'early', label: 'Первые сигналы', icon: 'fa-wave-square', color: '#e7a621', action: 'Снизьте темп и выберите только одно небольшое действие на сегодня.'},
  {value: 'escalated', label: 'Напряжение растёт', icon: 'fa-triangle-exclamation', color: '#e87932', action: 'Отложите лишние решения, восстановите базовый ресурс и дайте себе паузу.'},
  {value: 'acute', label: 'Острая ситуация', icon: 'fa-life-ring', color: '#df4e4e', action: 'Сначала безопасность и поддержка. Не требуйте от себя продуктивности; при необходимости используйте стресс-радар.'},
]

const filterGuidance: Record<PcmHintFilter, string> = {
  logic: 'Добавьте ясность: факты, структуру и возможность спокойно подумать.',
  persistent: 'Оставьте место для своей позиции и назовите важный для вас принцип.',
  soulful: 'Начните с тёплого, личного способа поддержки, а не с задачи.',
  dreamer: 'Уберите лишние стимулы и выберите одну понятную, спокойную опору.',
  rebel: 'Добавьте живости и лёгкости: короткий контакт или приятную смену ритма.',
  activist: 'Выберите действие с быстрым результатом и возможностью самому решать, как его сделать.',
}

const personalityGuidance: Record<string, string> = {
  computer: 'Компьютер: поможет короткое время на размышление и ясный план.',
  director: 'Директор: поддержит право на выбор и конкретный следующий шаг.',
  protector: 'Протектор: добавьте комфорт, пространство и заботу о базовых условиях.',
  emoter: 'Эмотер: дайте эмоциям безопасный выход через контакт, игру или движение.',
  comforter: 'Комфортёр: восстановитесь через тепло, близость и приятную атмосферу.',
}

const channelGuidance: Record<PcmHintChannel, string> = {
  question: 'Вопросительный канал: задайте себе один конкретный вопрос и дайте время на ответ.',
  caring: 'Заботливый канал: выберите способ сказать себе или близкому что-то поддерживающее.',
  directive: 'Директивный канал: сформулируйте для себя один короткий и выполнимый шаг.',
  emotional: 'Эмоциональный канал: разрешите себе живую реакцию в безопасном формате.',
  interrupt: 'Прерывающий канал: используйте только для быстрого возвращения к безопасности и телесной опоре.',
}

const defaultPersonalContext = (): PersonalContext => ({
  baseFilter: '',
  phaseFilter: '',
  personalities: [],
  channel: '',
  involvement: '',
  stimulus: '',
  stress: 'none',
})

const {state: history, save: saveHistory} = useLocalStore('pcm-needs-checkins', [])
const {state: storedPersonalContext, save: savePersonalContext} = useLocalStore('pcm-personal-context', defaultPersonalContext())
const selectedNeedIds = ref<string[]>([])
const note = ref('')
const savedAt = ref('')
const storedContext = storedPersonalContext.value && typeof storedPersonalContext.value === 'object'
  ? storedPersonalContext.value as Partial<PersonalContext>
  : {}
const personalContext = ref<PersonalContext>({
  ...defaultPersonalContext(),
  ...storedContext,
  baseFilter: storedContext.baseFilter ?? (storedContext as {filter?: PcmHintFilter | ''}).filter ?? '',
  phaseFilter: storedContext.phaseFilter ?? '',
  personalities: Array.isArray(storedContext.personalities) ? storedContext.personalities.slice(0, 2) : [],
})

const selectedNeeds = computed(() => needs.filter(item => selectedNeedIds.value.includes(item.id)))
const latestHistory = computed<NeedsCheckin[]>(() => Array.isArray(history.value) ? history.value.slice(0, 4) : [])
const currentStress = computed(() => stressLevels.find(item => item.value === personalContext.value.stress) ?? stressLevels[0])
const selectedBaseFilter = computed(() => PCM_HINT_FILTERS.find(item => item.value === personalContext.value.baseFilter))
const selectedPhaseFilter = computed(() => PCM_HINT_FILTERS.find(item => item.value === personalContext.value.phaseFilter))
const personalContextGuidance = computed(() => {
  const context = personalContext.value
  const guidance: Array<{icon: string; label: string; text: string}> = []
  if (context.baseFilter) {
    guidance.push({icon: selectedBaseFilter.value?.icon ?? 'fa-compass', label: `База · ${selectedBaseFilter.value?.label ?? 'фильтр'}`, text: filterGuidance[context.baseFilter]})
  }
  if (context.phaseFilter) {
    guidance.push({icon: selectedPhaseFilter.value?.icon ?? 'fa-compass', label: `Фаза · ${selectedPhaseFilter.value?.label ?? 'фильтр'}`, text: `Сейчас особенно полезно: ${filterGuidance[context.phaseFilter]}`})
  }
  context.personalities.forEach(id => {
    const personality = personalities.find(item => item.id === id)
    if (personality) {
      guidance.push({icon: personality.icon, label: personality.label, text: personalityGuidance[id]})
    }
  })
  if (context.channel) {
    guidance.push({icon: 'fa-comments', label: 'Канал', text: channelGuidance[context.channel]})
  }
  if (context.involvement || context.stimulus) {
    const environment = [
      context.involvement === 'involved' ? 'вовлечённость' : context.involvement === 'distant' ? 'дистанция' : '',
      context.stimulus === 'inner' ? 'внутренний стимул' : context.stimulus === 'outer' ? 'внешний стимул' : '',
    ].filter(Boolean).join(' · ')
    guidance.push({icon: 'fa-leaf', label: 'Среда', text: `Учитывайте текущую опору: ${environment}. Выберите формат восстановления, который ей соответствует.`})
  }
  return guidance
})

watch(personalContext, (value): void => {
  storedPersonalContext.value = value
  savePersonalContext()
}, {deep: true})

const toggleNeed = (id: string): void => {
  selectedNeedIds.value = selectedNeedIds.value.includes(id)
    ? selectedNeedIds.value.filter(item => item !== id)
    : [...selectedNeedIds.value, id]
}

const setFilter = (kind: 'baseFilter' | 'phaseFilter', filter: PcmHintFilter): void => {
  personalContext.value[kind] = personalContext.value[kind] === filter ? '' : filter
}

const togglePersonality = (id: string): void => {
  const current = personalContext.value.personalities
  if (current.includes(id)) {
    personalContext.value.personalities = current.filter(item => item !== id)
    return
  }
  personalContext.value.personalities = [...current.slice(-1), id]
}

const setChannel = (channel: PcmHintChannel): void => {
  personalContext.value.channel = personalContext.value.channel === channel ? '' : channel
}

const setEnvironment = (axis: 'involvement' | 'stimulus', value: string): void => {
  const context = personalContext.value
  ;(context as Record<string, unknown>)[axis] = context[axis] === value ? '' : value
}

const formatDate = (value: string): string => new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(value))

const saveCheckin = (): void => {
  const item: NeedsCheckin = {
    date: new Date().toISOString(),
    needs: selectedNeedIds.value,
    note: note.value.trim(),
    stress: personalContext.value.stress,
  }
  const currentHistory = Array.isArray(history.value) ? history.value : []
  history.value = [item, ...currentHistory].slice(0, 16)
  saveHistory()
  savedAt.value = formatDate(item.date)
}

const historyNeedNames = (item: NeedsCheckin): string => item.needs
  .map(id => needs.find(need => need.id === id)?.title)
  .filter(Boolean)
  .join(' · ')

const historyStressLabel = (item: NeedsCheckin): string => stressLevels.find(level => level.value === item.stress)?.label ?? 'Уровень не указан'
</script>

<template lang="pug">
  .container.needs-page.mb-5
    section.needs-hero
      .needs-hero__copy
        h1.title.is-3 Потребности и ресурс
        p.subtitle.is-6 Небольшой личный чек-ин: отметьте то, чему сейчас хочется дать больше внимания.
      span.tag.is-light Локально · для себя

    .needs-layout
      section.needs-main
        article.needs-intro
          span.icon
            i.fa.fa-seedling
          div
            strong Это не тест и не оценка
            p Выбирайте только то, что откликается сегодня. Одной потребности уже достаточно для небольшого шага.

        article.needs-context
          .needs-context__heading
            span.icon
              i.fa.fa-fingerprint
            div
              h2.title.is-6 Мой PCM-контекст
              p Необязательно. Эти настройки уточняют личный чек-ин и сохраняются в этом браузере.
          .needs-context__group
            label.label Фильтр восприятия
            .needs-filter-columns
              .needs-filter-choice
                span.needs-filter-choice__label База
                .tags.needs-filter-tags
                  button.tag.needs-filter(
                    v-for="item in PCM_HINT_FILTERS"
                    :key="item.value"
                    type="button"
                    :style="{'--filter-color': item.color}"
                    :class="{'is-selected': personalContext.baseFilter === item.value}"
                    :title="item.label"
                    :aria-label="`База: ${item.label}`"
                    @click="setFilter('baseFilter', item.value)"
                  )
                    span.icon
                      i.fa(:class="item.icon")
              .needs-filter-choice
                span.needs-filter-choice__label Фаза
                .tags.needs-filter-tags
                  button.tag.needs-filter(
                    v-for="item in PCM_HINT_FILTERS"
                    :key="item.value"
                    type="button"
                    :style="{'--filter-color': item.color}"
                    :class="{'is-selected': personalContext.phaseFilter === item.value}"
                    :title="item.label"
                    :aria-label="`Фаза: ${item.label}`"
                    @click="setFilter('phaseFilter', item.value)"
                  )
                    span.icon
                      i.fa(:class="item.icon")
          .needs-context__paired
            .needs-context__group
              label.label Части личности
              .tags.needs-choice-tags
                button.tag.needs-choice(
                  v-for="item in personalities"
                  :key="item.id"
                  type="button"
                  :class="{'is-selected': personalContext.personalities.includes(item.id)}"
                  @click="togglePersonality(item.id)"
                )
                  span.icon
                    i.fa(:class="item.icon")
                  span {{ item.label }}
              p.help Можно выбрать до двух частей; повторный клик снимает выбор.
            .needs-context__group
              label.label Предпочтительный канал
              .tags.needs-choice-tags
                button.tag.needs-choice(
                  v-for="item in PCM_HINT_CHANNELS"
                  :key="item.value"
                  type="button"
                  :class="{'is-selected': personalContext.channel === item.value}"
                  @click="setChannel(item.value)"
                ) {{ item.label }}
          .needs-context__group
            label.label Предпочтительная среда
            .needs-environment
              .tags.needs-choice-tags
                button.tag.needs-choice(
                  v-for="item in PCM_HINT_INVOLVEMENT"
                  :key="item.value"
                  type="button"
                  :class="{'is-selected': personalContext.involvement === item.value}"
                  @click="setEnvironment('involvement', item.value)"
                ) {{ item.label }}
              .tags.needs-choice-tags
                button.tag.needs-choice(
                  v-for="item in PCM_HINT_STIMULUS"
                  :key="item.value"
                  type="button"
                  :class="{'is-selected': personalContext.stimulus === item.value}"
                  @click="setEnvironment('stimulus', item.value)"
                ) {{ item.label }}

        article.needs-stress
          .needs-context__heading
            span.icon
              i.fa.fa-gauge-high
            div
              h2.title.is-6 Уровень стресса
              p Отметьте текущее состояние, включая вариант «без стресса».
          .needs-stress-options
            button.needs-stress-option(
              v-for="item in stressLevels"
              :key="item.value"
              type="button"
              :style="{'--stress-color': item.color}"
              :class="{'is-selected': personalContext.stress === item.value}"
              @click="personalContext.stress = item.value"
            )
              span.icon
                i.fa(:class="item.icon")
              span {{ item.label }}

        .needs-grid
          button.need-card(
            v-for="item in needs"
            :key="item.id"
            type="button"
            :style="{'--need-color': item.color}"
            :class="{'is-selected': selectedNeedIds.includes(item.id)}"
            @click="toggleNeed(item.id)"
          )
            span.need-card__icon.icon
              i.fa(:class="item.icon")
            span.need-card__copy
              strong {{ item.title }}
              small {{ item.short }}
            span.need-card__check.icon
              i.fa(:class="selectedNeedIds.includes(item.id) ? 'fa-check-circle' : 'fa-circle'")

        .field.needs-note
          label.label Короткая заметка — по желанию
          .control
            textarea.textarea(v-model="note" rows="3" placeholder="Что хочется поддержать в себе на этой неделе?")
        .needs-save-row
          button.button.is-info(type="button" :disabled="!selectedNeedIds.length" @click="saveCheckin")
            span.icon
              i.fa.fa-floppy-disk
            span Сохранить чек-ин
          span.help(v-if="savedAt") Сохранено {{ savedAt }} в этом браузере.

      aside.needs-result
        header.needs-result__header
          div
            p.heading Маленькие действия
            h2.title.is-5(v-if="selectedNeeds.length") На сегодня
            h2.title.is-5(v-else) Выберите потребность
          span.icon
            i.fa.fa-sparkles
        .needs-result__content
          .needs-stress-guidance(:style="{'--stress-color': currentStress.color}")
            span.icon
              i.fa(:class="currentStress.icon")
            div
              strong {{ currentStress.label }}
              p {{ currentStress.action }}
              router-link(v-if="personalContext.stress === 'acute'" :to="{name: 'stress'}") Открыть стресс-радар
          .needs-context-guidance(v-if="personalContextGuidance.length")
            .needs-context-guidance__heading
              span.icon
                i.fa.fa-fingerprint
              h3 Учитываем PCM-контекст
            article.needs-context-guidance__item(v-for="item in personalContextGuidance" :key="`${item.label}-${item.text}`")
              span.icon
                i.fa(:class="item.icon")
              div
                strong {{ item.label }}
                p {{ item.text }}
          p.needs-empty(v-if="!selectedNeeds.length") Отметьте одну или несколько карточек слева — здесь появятся спокойные, выполнимые идеи.
          article.need-action(v-for="item in selectedNeeds" :key="item.id" :style="{'--need-color': item.color}")
            span.icon.need-action__icon
              i.fa(:class="item.icon")
            div
              h3 {{ item.title }}
              p {{ item.action }}

    section.needs-history(v-if="latestHistory.length")
      .needs-history__heading
        h2.title.is-5 Последние отметки
        span.tag.is-light Хранятся в браузере
      .needs-history__list
        article.needs-history-item(v-for="item in latestHistory" :key="item.date")
          time {{ formatDate(item.date) }}
          span.needs-history-item__stress {{ historyStressLabel(item) }}
          p {{ historyNeedNames(item) }}
          small(v-if="item.note") {{ item.note }}
</template>

<style scoped>
.needs-page { max-width: 1120px; }
.needs-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.needs-hero .title { margin-bottom: 0.35rem; }
.needs-hero .subtitle { max-width: 43rem; color: var(--app-text-muted); }
.needs-layout { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr); gap: 1rem; align-items: start; }
.needs-main, .needs-result, .needs-history { border: 1px solid var(--app-border); border-radius: 0.7rem; background: var(--app-surface); box-shadow: var(--app-shadow); }
.needs-main { padding: 1rem; }
.needs-intro { display: flex; gap: 0.55rem; align-items: flex-start; margin-bottom: 1rem; padding: 0.7rem; border-radius: 0.5rem; background: var(--app-surface-muted); color: var(--app-text-muted); font-size: 0.86rem; }
.needs-intro > .icon { color: var(--app-accent); }
.needs-intro strong { color: var(--app-text); }
.needs-intro p { margin: 0.15rem 0 0; }
.needs-context, .needs-stress { margin-bottom: 1rem; padding: 0.85rem; border: 1px solid var(--app-border); border-radius: 0.6rem; background: var(--app-surface-muted); }
.needs-context__heading { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem; }
.needs-context__heading > .icon { color: var(--app-accent); }
.needs-context__heading .title { margin: 0 0 0.15rem; }
.needs-context__heading p { margin: 0; color: var(--app-text-muted); font-size: 0.8rem; line-height: 1.35; }
.needs-context__group + .needs-context__group { margin-top: 0.65rem; }
.needs-context__paired { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-top: 0.65rem; }
.needs-context__paired .needs-context__group + .needs-context__group { margin-top: 0; }
.needs-context__group .label { margin-bottom: 0.35rem; font-size: 0.78rem; }
.needs-context__group .help { margin: 0.3rem 0 0; }
.needs-filter-tags, .needs-choice-tags { margin-bottom: 0; }
.needs-filter-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
.needs-filter-choice { min-width: 0; }
.needs-filter-choice__label { display: block; margin-bottom: 0.3rem; color: var(--app-text-muted); font-size: 0.74rem; font-weight: 700; }
.needs-filter, .needs-choice { min-height: 2rem; border: 1px solid var(--app-border); background: var(--app-surface); color: var(--app-text); cursor: pointer; }
.needs-filter { min-width: 2.45rem; border-color: var(--filter-color); color: var(--filter-color); }
.needs-filter .icon { margin: 0; font-size: 1.2rem; }
.needs-filter.is-selected { background: color-mix(in srgb, var(--filter-color) 17%, var(--app-surface)); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--filter-color) 40%, transparent), 0 0.2rem 0.5rem color-mix(in srgb, var(--filter-color) 18%, transparent); transform: translateY(-1px) scale(1.06); }
.needs-choice.is-selected { border-color: var(--app-accent); background: color-mix(in srgb, var(--app-accent) 14%, var(--app-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 36%, transparent); color: var(--app-text); font-weight: 700; }
.needs-environment { display: grid; grid-template-columns: max-content max-content; justify-content: start; gap: 0.5rem; overflow-x: auto; }
.needs-environment .tags { margin-bottom: 0; }
.needs-stress-options { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.35rem; }
.needs-stress-option { display: flex; align-items: center; justify-content: center; gap: 0.3rem; min-width: 0; min-height: 2.25rem; padding: 0.3rem; border: 1px solid var(--app-border); border-radius: 0.45rem; background: var(--app-surface); color: var(--app-text); cursor: pointer; font-size: 0.72rem; line-height: 1.1; text-align: center; }
.needs-stress-option .icon { color: var(--stress-color); }
.needs-stress-option.is-selected { border-color: var(--stress-color); background: color-mix(in srgb, var(--stress-color) 14%, var(--app-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--stress-color) 40%, transparent); font-weight: 700; }
.needs-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem; }
.need-card { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 0.5rem; align-items: center; min-height: 4.1rem; padding: 0.65rem; border: 1px solid var(--app-border); border-radius: 0.55rem; background: var(--app-surface-muted); color: var(--app-text); cursor: pointer; text-align: left; transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease; }
.need-card:hover { background: color-mix(in srgb, var(--need-color) 9%, var(--app-surface)); }
.need-card.is-selected { border-color: var(--need-color); background: color-mix(in srgb, var(--need-color) 15%, var(--app-surface)); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--need-color) 34%, transparent), 0 0.25rem 0.65rem color-mix(in srgb, var(--need-color) 18%, transparent); transform: translateY(-1px); }
.need-card__icon { color: var(--need-color); font-size: 1.3rem; }
.need-card__copy { display: grid; min-width: 0; gap: 0.18rem; }
.need-card__copy strong { font-size: 0.84rem; }
.need-card__copy small { color: var(--app-text-muted); font-size: 0.72rem; line-height: 1.2; }
.need-card__check { color: var(--need-color); }
.needs-note { margin: 1rem 0 0; }
.needs-note .label { margin-bottom: 0.4rem; }
.needs-save-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.75rem; }
.needs-save-row .help { margin: 0; }
.needs-result { overflow: hidden; }
.needs-result__header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; background: color-mix(in srgb, var(--app-accent) 9%, var(--app-surface)); }
.needs-result__header .heading { margin-bottom: 0.2rem; color: var(--app-text-muted); }
.needs-result__header .title { margin: 0; }
.needs-result__header > .icon { color: var(--app-accent); font-size: 1.7rem; }
.needs-result__content { display: grid; gap: 0.6rem; padding: 1rem; }
.needs-stress-guidance { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.5rem; padding: 0.7rem; border: 1px solid var(--stress-color); border-radius: 0.5rem; background: color-mix(in srgb, var(--stress-color) 10%, var(--app-surface)); }
.needs-stress-guidance > .icon { color: var(--stress-color); font-size: 1.1rem; }
.needs-stress-guidance strong { font-size: 0.84rem; }
.needs-stress-guidance p { margin: 0.15rem 0 0; color: var(--app-text-muted); font-size: 0.8rem; line-height: 1.35; }
.needs-stress-guidance a { display: inline-block; margin-top: 0.35rem; color: var(--stress-color); font-size: 0.8rem; font-weight: 700; }
.needs-context-guidance { display: grid; gap: 0.45rem; }
.needs-context-guidance__heading { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.25rem; }
.needs-context-guidance__heading .icon { color: var(--app-accent); }
.needs-context-guidance__heading h3 { margin: 0; font-size: 0.86rem; }
.needs-context-guidance__item { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.45rem; padding: 0.65rem; border: 1px solid var(--app-border); border-radius: 0.5rem; background: var(--app-surface-muted); }
.needs-context-guidance__item > .icon { color: var(--app-accent); }
.needs-context-guidance__item strong { font-size: 0.82rem; }
.needs-context-guidance__item p { margin: 0.15rem 0 0; color: var(--app-text-muted); font-size: 0.8rem; line-height: 1.35; }
.needs-empty { margin: 0; color: var(--app-text-muted); line-height: 1.45; }
.need-action { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.55rem; padding: 0.75rem; border: 1px solid var(--need-color); border-radius: 0.55rem; background: color-mix(in srgb, var(--need-color) 10%, var(--app-surface)); }
.need-action__icon { color: var(--need-color); font-size: 1.2rem; }
.need-action h3 { margin: 0 0 0.25rem; font-size: 0.86rem; }
.need-action p { margin: 0; color: var(--app-text-muted); font-size: 0.84rem; line-height: 1.4; }
.needs-history { margin-top: 1rem; padding: 1rem; }
.needs-history__heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.65rem; }
.needs-history__heading .title { margin: 0; }
.needs-history__list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.55rem; }
.needs-history-item { padding: 0.7rem; border: 1px solid var(--app-border); border-radius: 0.5rem; background: var(--app-surface-muted); }
.needs-history-item time { color: var(--app-text-muted); font-size: 0.75rem; }
.needs-history-item__stress { display: block; margin-top: 0.25rem; color: var(--app-text-muted); font-size: 0.72rem; }
.needs-history-item p { margin: 0.3rem 0; color: var(--app-text); font-size: 0.8rem; line-height: 1.35; }
.needs-history-item small { color: var(--app-text-muted); font-size: 0.75rem; line-height: 1.3; }

@media screen and (max-width: 768px) {
  .needs-hero { flex-direction: column; gap: 0.5rem; }
  .needs-layout { grid-template-columns: 1fr; }
  .needs-history__list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .needs-context__paired { grid-template-columns: 1fr; }
  .needs-filter-columns { grid-template-columns: 1fr; }
}

@media screen and (max-width: 460px) {
  .needs-grid, .needs-history__list { grid-template-columns: 1fr; }
}
</style>
