<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {GraphService} from '@/networker/service/graphService'
import {NetworkService} from '@/networker/service/networkService'
import type {Node} from '@/networker/entity/graph/node'
import {
  PCM_HINT_FILTERS,
  createPcmHint,
  type PcmHintFilter,
} from '@/networker/entity/graph/pcmHint'
import {
  CONVERSATION_GOALS,
  getConversationRecommendation,
  type ConversationGoal,
} from '@/pcm/conversation/recommendation'

type ConversationContext = 'work' | 'personal' | 'difficult'

interface ContactOption {
  key: string;
  networkName: string;
  node: Node;
}

const contexts: Array<{value: ConversationContext; label: string; icon: string; note: string}> = [
  {value: 'work', label: 'Рабочий вопрос', icon: 'fa-briefcase', note: 'Держите фокус на задаче, роли и следующем шаге.'},
  {value: 'personal', label: 'Личный разговор', icon: 'fa-user-group', note: 'Дайте контакту и эмоциям больше места, чем скорости решения.'},
  {value: 'difficult', label: 'Непростая ситуация', icon: 'fa-triangle-exclamation', note: 'Сначала снизьте напряжение, затем переходите к содержанию.'},
]

const contextModifiers: Record<ConversationContext, {
  opening: string;
  focus: string;
  question: string;
  avoid: string;
  fallback: string;
}> = {
  work: {
    opening: 'Сразу обозначьте рабочую цель и рамки разговора.',
    focus: 'Договоритесь о владельце следующего шага и сроке.',
    question: 'Какой результат нам важно получить после этого разговора?',
    avoid: 'Не смешивайте рабочую задачу с личными оценками.',
    fallback: 'Зафиксируйте промежуточный итог письменно и назначьте короткое продолжение.',
  },
  personal: {
    opening: 'Сначала спросите, есть ли у человека ресурс для этого разговора.',
    focus: 'Слушайте до попытки что-либо исправить или объяснить.',
    question: 'Тебе сейчас важнее, чтобы тебя выслушали или чтобы вместе поискать решение?',
    avoid: 'Не требуйте немедленной реакции и не подменяйте чувства советом.',
    fallback: 'Предложите паузу и бережно договоритесь, когда вернуться к теме.',
  },
  difficult: {
    opening: 'Начните с спокойного намерения: прояснить ситуацию без поиска виноватого.',
    focus: 'Замедлите темп и обсуждайте один наблюдаемый факт за раз.',
    question: 'Что нам поможет провести этот разговор безопасно и по существу?',
    avoid: 'Не обобщайте, не приписывайте мотивы и не повышайте давление.',
    fallback: 'Сделайте паузу, подтвердите готовность продолжить и выберите более спокойный момент.',
  },
}

const context = ref<ConversationContext>('work')
const goal = ref<ConversationGoal>('discuss')
const contacts = ref<ContactOption[]>([])
const selectedContactKey = ref('')
const manualFilter = ref<PcmHintFilter | ''>('')
const contactSearch = ref('')
const isContactSearchOpen = ref(false)

const selectedContact = computed(() => contacts.value.find(item => item.key === selectedContactKey.value))
const showContactSearch = computed(() => contacts.value.length > 20)
const filteredContacts = computed(() => {
  const query = contactSearch.value.trim().toLocaleLowerCase('ru-RU')
  if (!query) {
    return contacts.value
  }

  return contacts.value.filter(item => `${item.node.name} ${item.networkName}`
    .toLocaleLowerCase('ru-RU')
    .includes(query))
})
const filteredNetworkNames = computed(() => [...new Set(filteredContacts.value.map(item => item.networkName))])
const visibleContacts = computed(() => filteredContacts.value.slice(0, 8))
const activeHint = computed(() => {
  const contactHint = selectedContact.value?.node.pcmHint
  return contactHint?.filter ? contactHint : createPcmHint({filter: manualFilter.value})
})
const activeFilter = computed(() => PCM_HINT_FILTERS.find(item => item.value === activeHint.value.filter))
const currentContext = computed(() => contexts.find(item => item.value === context.value) ?? contexts[0])
const hasPcmHypothesis = computed(() => Boolean(activeHint.value.filter))
const emptyHypothesisTitle = computed(() => selectedContact.value
  ? `У контакта «${selectedContact.value.node.name || 'без имени'}» пока нет PCM-гипотезы`
  : 'Навигатор пока не знает особенностей собеседника',
)
const recommendation = computed(() => {
  const base = getConversationRecommendation(activeHint.value, goal.value)
  const modifier = contextModifiers[context.value]

  return {
    ...base,
    opening: `${modifier.opening} ${base.opening}`,
    focus: `${modifier.focus} ${base.focus}`,
    questions: [modifier.question, ...base.questions],
    avoid: `${base.avoid} ${modifier.avoid}`,
    fallback: `${base.fallback} ${modifier.fallback}`,
  }
})
const dictionaryQuery = computed(() => ({
  filter: activeHint.value.filter || undefined,
  channel: activeHint.value.channel || 'question',
  goal: ({discuss: 'task', request: 'help', feedback: 'feedback', tension: 'tension'} as Record<ConversationGoal, string>)[goal.value],
}))

const setManualFilter = (filter: PcmHintFilter): void => {
  manualFilter.value = manualFilter.value === filter ? '' : filter
}

const selectContact = (contact: ContactOption): void => {
  selectedContactKey.value = contact.key
  contactSearch.value = contact.node.name || 'Без имени'
  manualFilter.value = ''
  isContactSearchOpen.value = false
}

const handleContactSearchInput = (): void => {
  selectedContactKey.value = ''
  isContactSearchOpen.value = true
}

const selectFirstContact = (): void => {
  const firstContact = visibleContacts.value[0]
  if (firstContact) {
    selectContact(firstContact)
  }
}

const clearContactSearch = (): void => {
  selectedContactKey.value = ''
  contactSearch.value = ''
  isContactSearchOpen.value = false
}

const closeContactSearch = (): void => {
  window.setTimeout(() => {
    isContactSearchOpen.value = false
  }, 100)
}

const loadContacts = (): void => {
  const networkService = new NetworkService()
  const networks = [
    {id: 0, name: 'Основная сеть'},
    ...networkService.networks.map(network => ({id: network.id ?? 0, name: network.name})),
  ]

  contacts.value = networks.flatMap(network => {
    const graphService = new GraphService({storeId: network.id})
    return graphService.nodes.map(node => ({
      key: `${network.id}:${node.uid ?? node.id}`,
      networkName: network.name,
      node,
    }))
  })
}

onMounted(loadContacts)
</script>

<template lang="pug">
  .container.conversation-page.mb-5
    section.conversation-hero
      .conversation-hero__copy
        h1.title.is-3 Навигатор разговора
        p.subtitle.is-6 Соберите спокойный первый шаг: цель, контекст и особенности контакта.
      span.tag.is-light Локально · без AI

    .conversation-layout
      section.conversation-controls
        article.conversation-step
          .conversation-step__heading
            span.icon
              i.fa.fa-location-dot
            h2.title.is-6 Контекст
          .tags.conversation-choice-tags
            button.tag.conversation-choice(
              v-for="item in contexts"
              :key="item.value"
              type="button"
              :class="{'is-selected': context === item.value}"
              @click="context = item.value"
            )
              span.icon
                i.fa(:class="item.icon")
              span {{ item.label }}
          p.help {{ currentContext.note }}

        article.conversation-step
          .conversation-step__heading
            span.icon
              i.fa.fa-address-book
            h2.title.is-6 Контакт
          .conversation-search-row(v-if="showContactSearch")
            form.conversation-contact-search(@submit.prevent="selectFirstContact")
              .field.has-addons
                .control.is-expanded.has-icons-left
                  input.input(
                    v-model="contactSearch"
                    type="search"
                    placeholder="Найти контакт или сеть"
                    autocomplete="off"
                    aria-label="Найти контакт или сеть"
                    aria-autocomplete="list"
                    :aria-expanded="isContactSearchOpen"
                    @focus="isContactSearchOpen = true"
                    @input="handleContactSearchInput"
                    @blur="closeContactSearch"
                    @keydown.esc="isContactSearchOpen = false"
                  )
                  span.icon.is-small.is-left
                    i.fa.fa-magnifying-glass
                .control(v-if="contactSearch")
                  button.button(type="button" title="Очистить поиск" aria-label="Очистить поиск" @mousedown.prevent @click="clearContactSearch")
                    span.icon.is-small
                      i.fa.fa-xmark
              .conversation-search-dropdown(v-if="isContactSearchOpen")
                button.conversation-search-option(
                  v-for="item in visibleContacts"
                  :key="item.key"
                  type="button"
                  @mousedown.prevent="selectContact(item)"
                )
                  span.conversation-search-option__name {{ item.node.name || 'Без имени' }}
                  span.conversation-search-option__meta
                    | {{ item.networkName }}
                    template(v-if="item.node.pcmHint.filter")  · PCM-гипотеза
                .conversation-search-empty(v-if="!visibleContacts.length") Ничего не найдено
                .conversation-search-more(v-else-if="filteredContacts.length > visibleContacts.length") Ещё {{ filteredContacts.length - visibleContacts.length }}
            .conversation-contact-note(v-if="selectedContact")
              span.icon
                i.fa(:class="selectedContact.node.pcmHint.filter ? 'fa-compass' : 'fa-circle-question'")
              span(v-if="selectedContact.node.pcmHint.filter") Используется PCM-гипотеза
              span(v-else) Гипотеза не заполнена
          .conversation-contact-row(v-else)
            .control.select.is-fullwidth
              select(v-model="selectedContactKey")
                option(value="") Выбрать из мымры
                optgroup(v-for="networkName in filteredNetworkNames" :key="networkName" :label="networkName")
                  option(v-for="item in filteredContacts.filter(contact => contact.networkName === networkName)" :key="item.key" :value="item.key") {{ item.node.name || 'Без имени' }}
            .conversation-contact-note(v-if="selectedContact")
              span.icon
                i.fa(:class="selectedContact.node.pcmHint.filter ? 'fa-compass' : 'fa-circle-question'")
              span(v-if="selectedContact.node.pcmHint.filter") Используется PCM-гипотеза
              span(v-else) Гипотеза не заполнена
          .field(v-if="!selectedContact?.node.pcmHint.filter")
            label.label Наблюдаемый тип
            .tags.conversation-type-tags
              button.tag.conversation-type(
                v-for="item in PCM_HINT_FILTERS"
                :key="item.value"
                type="button"
                :style="{'--type-color': item.color}"
                :class="{'is-selected': manualFilter === item.value}"
                :title="item.label"
                :aria-label="item.label"
                @click="setManualFilter(item.value)"
              )
                span.icon
                  i.fa(:class="item.icon" aria-hidden="true")
          p.help(v-else) Для этой сессии используется профиль контакта; изменить его можно в мымре.

        article.conversation-step
          .conversation-step__heading
            span.icon
              i.fa.fa-bullseye
            h2.title.is-6 Цель
          .conversation-goals
            button.conversation-goal(
              v-for="item in CONVERSATION_GOALS"
              :key="item.value"
              type="button"
              :class="{'is-selected': goal === item.value}"
              @click="goal = item.value"
            )
              span.icon
                i.fa(:class="item.icon")
              span {{ item.label }}

      section.conversation-result(:style="activeFilter ? {'--type-color': activeFilter.color} : undefined")
        header.conversation-result__header
          div
            p.heading Ваш первый шаг
            h2.title.is-4 {{ currentContext.label }}
          span.icon.conversation-result__type(v-if="activeFilter" :title="activeFilter.label")
            i.fa(:class="activeFilter.icon")
        .conversation-result__content
          .notification.is-light.conversation-empty-hypothesis(v-if="!hasPcmHypothesis")
            span.icon
              i.fa.fa-compass
            div
              strong {{ emptyHypothesisTitle }}
              p(v-if="selectedContact") Выберите цветную иконку типа в блоке «Контакт» — это применится только к этому разговору и не изменит карточку контакта.
              p(v-else) Выберите контакт из мымры или цветную иконку типа — тогда рекомендации станут более адресными.
          .conversation-result__section
            .conversation-result__section-heading
              span.icon
                i.fa.fa-play
              h3 Начните так
            blockquote.conversation-opening {{ recommendation.opening }}
          .conversation-result__pair
            .conversation-result__section
              .conversation-result__section-heading
                span.icon
                  i.fa.fa-eye
                h3 Держите в фокусе
              p {{ recommendation.focus }}
            .conversation-result__section
              .conversation-result__section-heading
                span.icon
                  i.fa.fa-comments
                h3 Формат
              p {{ recommendation.channel }}
          .conversation-result__section
            .conversation-result__section-heading
              span.icon
                i.fa.fa-circle-question
              h3 Вопросы, которые помогут
            ol.conversation-questions
              li(v-for="question in recommendation.questions" :key="question") {{ question }}
          .conversation-result__section.is-caution
            .conversation-result__section-heading
              span.icon
                i.fa.fa-shield-halved
              h3 Чего лучше не делать
            p {{ recommendation.avoid }}
          .conversation-result__section.is-fallback
            .conversation-result__section-heading
              span.icon
                i.fa.fa-rotate-left
              h3 Если не подошло
            p {{ recommendation.fallback }}
          router-link.button.is-light.conversation-dictionary(
            :to="{name: 'dictionary', query: dictionaryQuery}"
          )
            span.icon
              i.fa.fa-pen-to-square
            span Открыть в конструкторе фраз
          p.conversation-disclaimer Это не оценка человека, а редактируемая опора для конкретного разговора.
</template>

<style scoped>
.conversation-page { max-width: 1120px; }
.conversation-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.conversation-hero .title { margin-bottom: 0.35rem; }
.conversation-hero .subtitle { max-width: 42rem; color: var(--app-text-muted); }
.conversation-layout { display: grid; grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr); gap: 1rem; align-items: start; }
.conversation-controls { display: grid; gap: 0.75rem; }
.conversation-step, .conversation-result { border: 1px solid var(--app-border); border-radius: 0.7rem; background: var(--app-surface); box-shadow: var(--app-shadow); }
.conversation-step { padding: 1rem; }
.conversation-step__heading { display: flex; gap: 0.45rem; align-items: center; margin-bottom: 0.65rem; }
.conversation-step__heading .title { margin: 0; }
.conversation-choice-tags, .conversation-type-tags { margin-bottom: 0; }
.conversation-choice, .conversation-type { min-height: 2.25rem; border: 1px solid var(--app-border); background: var(--app-surface-muted); color: var(--app-text); cursor: pointer; }
.conversation-choice.is-selected { border-color: var(--app-accent); background: color-mix(in srgb, var(--app-accent) 16%, var(--app-surface)); font-weight: 700; }
.conversation-contact-row { display: flex; align-items: stretch; gap: 0.5rem; }
.conversation-contact-row .select { flex: 1 1 auto; min-width: 0; }
.conversation-search-row { display: flex; align-items: stretch; gap: 0.5rem; }
.conversation-search-row .conversation-contact-search { flex: 1 1 auto; min-width: 0; }
.conversation-contact-search { position: relative; z-index: 2; margin-bottom: 0.5rem; }
.conversation-contact-search .field { margin-bottom: 0; filter: drop-shadow(0 0.2rem 0.45rem rgb(0 0 0 / 10%)); }
.conversation-contact-search .control.is-expanded, .conversation-contact-search .input { min-width: 0; }
.conversation-search-dropdown { position: absolute; top: calc(100% + 0.25rem); left: 0; width: 100%; max-height: min(50vh, 300px); overflow-y: auto; border: 1px solid var(--app-border); border-radius: 0.45rem; background: var(--app-surface); box-shadow: var(--app-shadow); }
.conversation-search-option { display: flex; flex-direction: column; width: 100%; gap: 0.1rem; padding: 0.55rem 0.7rem; border: 0; border-bottom: 1px solid var(--app-border); background: transparent; color: var(--app-text); cursor: pointer; text-align: left; }
.conversation-search-option:hover, .conversation-search-option:focus { background: var(--app-surface-muted); outline: none; }
.conversation-search-option__name { font-weight: 600; }
.conversation-search-option__meta { overflow: hidden; color: var(--app-text-muted); font-size: 0.75rem; text-overflow: ellipsis; white-space: nowrap; }
.conversation-search-empty, .conversation-search-more { padding: 0.6rem 0.7rem; color: var(--app-text-muted); font-size: 0.8rem; }
.conversation-contact-note { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 0.35rem; max-width: 13.5rem; padding: 0.45rem 0.6rem; border: 1px solid var(--app-border); border-radius: 0.45rem; background: var(--app-surface-muted); color: var(--app-text-muted); font-size: 0.78rem; line-height: 1.25; }
.conversation-type { min-width: 2.7rem; color: var(--type-color); border-color: var(--type-color); transition: transform 150ms ease, box-shadow 150ms ease; }
.conversation-type .icon { margin: 0; font-size: 1.35rem; }
.conversation-type.is-selected { background: color-mix(in srgb, var(--type-color) 18%, var(--app-surface)); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--type-color) 42%, transparent), 0 0.2rem 0.55rem color-mix(in srgb, var(--type-color) 22%, transparent); transform: translateY(-1px) scale(1.06); }
.conversation-goals { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem; }
.conversation-goal { display: flex; align-items: center; gap: 0.4rem; min-height: 2.5rem; padding: 0.45rem 0.55rem; border: 1px solid var(--app-border); border-radius: 0.45rem; background: var(--app-surface-muted); color: var(--app-text); cursor: pointer; font-size: 0.82rem; text-align: left; }
.conversation-goal.is-selected { border-color: var(--app-accent); background: color-mix(in srgb, var(--app-accent) 16%, var(--app-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 38%, transparent); font-weight: 700; }
.conversation-result { overflow: hidden; border-color: var(--type-color, var(--app-border)); }
.conversation-result__header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.1rem; border-bottom: 1px solid var(--app-border); background: color-mix(in srgb, var(--type-color, var(--app-accent)) 10%, var(--app-surface)); }
.conversation-result__header .heading { margin-bottom: 0.2rem; color: var(--app-text-muted); }
.conversation-result__header .title { margin: 0; }
.conversation-result__type { color: var(--type-color, var(--app-accent)); font-size: 2rem; }
.conversation-result__content { padding: 1.1rem; }
.conversation-result__content .notification { margin-bottom: 0.85rem; }
.conversation-empty-hypothesis { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.75rem; border: 1px solid var(--app-border); background: var(--app-surface-muted); color: var(--app-text); }
.conversation-empty-hypothesis > .icon { color: var(--app-accent); }
.conversation-empty-hypothesis strong { display: block; margin-bottom: 0.2rem; }
.conversation-empty-hypothesis p { margin: 0; color: var(--app-text-muted); font-size: 0.84rem; line-height: 1.4; }
.conversation-result__section { padding: 0.8rem 0; }
.conversation-result__section-heading { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.45rem; }
.conversation-result__section-heading .icon { color: var(--type-color, var(--app-accent)); }
.conversation-result__section h3 { margin: 0; font-size: 0.86rem; }
.conversation-result__section p, .conversation-result__section li { color: var(--app-text-muted); line-height: 1.45; }
.conversation-opening { margin: 0; padding: 0.8rem 0.9rem; border-left: 3px solid var(--type-color, var(--app-accent)); border-radius: 0 0.45rem 0.45rem 0; background: color-mix(in srgb, var(--type-color, var(--app-accent)) 10%, var(--app-surface-muted)); color: var(--app-text); font-size: 1rem; font-weight: 600; line-height: 1.45; }
.conversation-result__pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; padding: 0.8rem 0; }
.conversation-result__pair .conversation-result__section { min-height: 100%; padding: 0.75rem; border: 1px solid var(--app-border); border-radius: 0.5rem; background: var(--app-surface-muted); }
.conversation-questions { display: grid; gap: 0.45rem; margin: 0; padding: 0; list-style: none; counter-reset: question; }
.conversation-questions li { position: relative; min-height: 2.15rem; padding: 0.45rem 0.6rem 0.45rem 2.35rem; border: 1px solid var(--app-border); border-radius: 0.45rem; background: var(--app-surface-muted); counter-increment: question; }
.conversation-questions li::before { position: absolute; top: 0.43rem; left: 0.55rem; display: grid; width: 1.25rem; height: 1.25rem; place-items: center; border-radius: 50%; background: var(--type-color, var(--app-accent)); color: #fff; content: counter(question); font-size: 0.72rem; font-weight: 700; }
.conversation-result__section.is-caution, .conversation-result__section.is-fallback { margin-top: 0.75rem; padding: 0.8rem; border: 0; border-radius: 0.5rem; }
.conversation-result__section.is-caution { background: color-mix(in srgb, #f6b73c 15%, var(--app-surface)); }
.conversation-result__section.is-caution .conversation-result__section-heading .icon, .conversation-result__section.is-caution h3 { color: #a96600; }
.conversation-result__section.is-fallback { background: color-mix(in srgb, var(--app-accent) 10%, var(--app-surface)); }
.conversation-result__section.is-fallback h3 { color: var(--app-accent); }
.conversation-disclaimer { margin: 0.85rem 0 0; color: var(--app-text-muted); font-size: 0.78rem; line-height: 1.4; }
.conversation-dictionary { margin-top: 0.85rem; }

@media screen and (max-width: 768px) {
  .conversation-hero { flex-direction: column; gap: 0.5rem; }
  .conversation-layout { grid-template-columns: 1fr; }
  .conversation-result__pair { grid-template-columns: 1fr; }
  .conversation-contact-row { align-items: stretch; }
  .conversation-search-row { align-items: stretch; }
}

@media screen and (max-width: 420px) {
  .conversation-goals { grid-template-columns: 1fr; }
  .conversation-contact-row { flex-direction: column; }
  .conversation-search-row { flex-direction: column; }
  .conversation-contact-note { max-width: none; }
}
</style>
