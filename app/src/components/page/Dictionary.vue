<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import {useLocalStore} from '@/core/composable/store/localStore'
import {
  PCM_HINT_CHANNELS,
  PCM_HINT_FILTERS,
  type PcmHintChannel,
  type PcmHintFilter,
} from '@/networker/entity/graph/pcmHint'
import activist from '@/pcm/data/filter/activist.json'
import dreamer from '@/pcm/data/filter/dreamer.json'
import logic from '@/pcm/data/filter/logic.json'
import persistent from '@/pcm/data/filter/persistent.json'
import rebel from '@/pcm/data/filter/rebel.json'
import soulful from '@/pcm/data/filter/soulful.json'

type WordKind = 'keyword' | 'verb' | 'noun' | 'adjective'

interface FilterLexicon {
  name: PcmHintFilter;
  personalityType: string;
  title: string;
  keywords: string[];
  verb: string[];
  noun: string[];
  adjective: string[];
}

interface DictionaryTerm {
  word: string;
  kind: WordKind;
  filter: PcmHintFilter;
}

interface SavedPhrase {
  id: string;
  text: string;
  filter: PcmHintFilter;
  channel: PcmHintChannel;
  goal: string;
  createdAt: string;
}

const lexicons = [logic, persistent, soulful, dreamer, rebel, activist] as FilterLexicon[]
const route = useRoute()
const wordKinds: Array<{value: WordKind; label: string}> = [
  {value: 'keyword', label: 'Ключевые слова'},
  {value: 'verb', label: 'Глаголы'},
  {value: 'noun', label: 'Существительные'},
  {value: 'adjective', label: 'Прилагательные'},
]
const lexiconFieldByKind: Record<WordKind, 'keywords' | 'verb' | 'noun' | 'adjective'> = {
  keyword: 'keywords',
  verb: 'verb',
  noun: 'noun',
  adjective: 'adjective',
}
const goals = [
  {value: 'task', label: 'Обсудить задачу', intent: 'Хочу коротко сверить следующий шаг', close: 'Что будет удобнее сделать первым? '},
  {value: 'feedback', label: 'Дать обратную связь', intent: 'Хочу поделиться наблюдением бережно и по существу', close: 'Как ты это видишь?'},
  {value: 'help', label: 'Попросить помощь', intent: 'Мне нужна твоя поддержка в одном конкретном вопросе', close: 'Сможешь помочь или подсказать, к кому лучше обратиться?'},
  {value: 'tension', label: 'Снять напряжение', intent: 'Мне важно вернуть спокойный и ясный контакт', close: 'Давай выберем удобный способ продолжить разговор.'},
  {value: 'decision', label: 'Принять решение', intent: 'Предлагаю вместе выбрать понятный вариант', close: 'Какие критерии или следующий шаг для тебя сейчас важнее?'},
]
const filterTone: Record<PcmHintFilter, {detail: string; invitation: string; alternative: string}> = {
  logic: {detail: 'Давай опираться на факты, варианты и понятные критерии.', invitation: 'Можем спокойно разложить это по шагам.', alternative: 'Если деталей сейчас много, начнём с одного проверяемого факта.'},
  persistent: {detail: 'Мне важно учесть твою позицию и то, что для тебя здесь принципиально.', invitation: 'Хочу услышать твоё мнение до того, как мы решим.', alternative: 'Давай сначала назовём, что для каждого из нас важно сохранить.'},
  soulful: {detail: 'Мне важен сам контакт и то, как ты сейчас в этом разговоре.', invitation: 'Можем на минуту замедлиться и поговорить по-человечески.', alternative: 'Спасибо, что включаешься — для меня это ценно.'},
  dreamer: {detail: 'Давай оставим только одну ясную задачу и уберём лишнее.', invitation: 'Можно спокойно подумать и вернуться с ответом позже.', alternative: 'Сейчас достаточно понять один первый шаг.'},
  rebel: {detail: 'Давай скажем проще и оставим место для живой реакции.', invitation: 'Можем выбрать самый лёгкий из рабочих вариантов.', alternative: 'Если формат надоел, попробуем по-другому.'},
  activist: {detail: 'Предлагаю быстро выбрать действие и увидеть результат.', invitation: 'Давай возьмём вариант, который можно проверить сразу.', alternative: 'Можем выбрать один ход и двигаться дальше.'},
}
const channelOpenings: Record<PcmHintChannel, string> = {
  question: 'Можно уточнить?',
  caring: 'Мне важно начать бережно.',
  directive: 'Предлагаю такой следующий шаг.',
  emotional: 'О, кажется, здесь правда есть о чём поговорить!',
  interrupt: 'Стоп на секунду: давай сначала вернём ясность и безопасность.',
}

const search = ref('')
const selectedFilter = ref<PcmHintFilter>('logic')
const selectedKind = ref<WordKind | ''>('')
const selectedGoal = ref('task')
const selectedChannel = ref<PcmHintChannel>('question')
const editablePhrase = ref('')
const {state: storedPhrases, save: savePhrases} = useLocalStore('pcm-dictionary-phrases', [] as SavedPhrase[])
const savedPhrases = ref<SavedPhrase[]>(Array.isArray(storedPhrases.value) ? storedPhrases.value.filter((item: SavedPhrase) => typeof item?.text === 'string').slice(0, 30) : [])

const selectedLexicon = computed(() => lexicons.find(item => item.name === selectedFilter.value) ?? lexicons[0])
const selectedFilterMeta = computed(() => PCM_HINT_FILTERS.find(item => item.value === selectedFilter.value) ?? PCM_HINT_FILTERS[0])
const currentGoal = computed(() => goals.find(item => item.value === selectedGoal.value) ?? goals[0])
const terms = computed<DictionaryTerm[]>(() => lexicons.flatMap(lexicon => wordKinds.flatMap(kind => lexicon[lexiconFieldByKind[kind.value]].map(word => ({word, kind: kind.value, filter: lexicon.name})))))
const visibleTerms = computed(() => {
  const needle = search.value.trim().toLocaleLowerCase('ru-RU')
  return terms.value.filter(term => {
    const matchesSearch = !needle || term.word.toLocaleLowerCase('ru-RU').includes(needle)
    return matchesSearch && (!selectedKind.value || term.kind === selectedKind.value) && term.filter === selectedFilter.value
  })
})
const generatedPhrases = computed(() => {
  const tone = filterTone[selectedFilter.value]
  const opening = channelOpenings[selectedChannel.value]
  const goal = currentGoal.value
  return [
    `«${opening} ${goal.intent}. ${tone.detail} ${goal.close}»`,
    `«${opening} ${tone.invitation} ${goal.close}»`,
    `«${goal.intent}. ${tone.alternative} ${goal.close}»`,
  ]
})
const savedForContext = computed(() => savedPhrases.value.filter(item => item.filter === selectedFilter.value && item.channel === selectedChannel.value))
const normalizePhrase = (phrase: string): string => phrase.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU')
const isDuplicatePhrase = computed(() => {
  const normalized = normalizePhrase(editablePhrase.value)
  return Boolean(normalized) && savedPhrases.value.some(item => normalizePhrase(item.text) === normalized)
})

watch(generatedPhrases, (phrases) => {
  editablePhrase.value = phrases[0]
}, {immediate: true})

const selectFilter = (filter: PcmHintFilter): void => {
  selectedFilter.value = filter
}

const selectGeneratedPhrase = (phrase: string): void => {
  editablePhrase.value = phrase
}

const savePhrase = (): void => {
  const text = editablePhrase.value.trim()
  if (!text || isDuplicatePhrase.value) {
    return
  }
  const entry: SavedPhrase = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    filter: selectedFilter.value,
    channel: selectedChannel.value,
    goal: selectedGoal.value,
    createdAt: new Date().toISOString(),
  }
  savedPhrases.value = [entry, ...savedPhrases.value].slice(0, 30)
  storedPhrases.value = savedPhrases.value
  savePhrases()
}

const removePhrase = (id: string): void => {
  savedPhrases.value = savedPhrases.value.filter(item => item.id !== id)
  storedPhrases.value = savedPhrases.value
  savePhrases()
}

const formatDate = (date: string): string => new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'short'}).format(new Date(date))

const applyNavigatorQuery = (): void => {
  const queryFilter = Array.isArray(route.query.filter) ? route.query.filter[0] : route.query.filter
  const queryChannel = Array.isArray(route.query.channel) ? route.query.channel[0] : route.query.channel
  const queryGoal = Array.isArray(route.query.goal) ? route.query.goal[0] : route.query.goal

  if (PCM_HINT_FILTERS.some(item => item.value === queryFilter)) {
    selectedFilter.value = queryFilter as PcmHintFilter
  }
  if (PCM_HINT_CHANNELS.some(item => item.value === queryChannel)) {
    selectedChannel.value = queryChannel as PcmHintChannel
  }
  if (goals.some(item => item.value === queryGoal)) {
    selectedGoal.value = queryGoal as string
  }
}

watch(() => route.query, applyNavigatorQuery, {immediate: true})
</script>

<template lang="pug">
  .container.dictionary-page.mb-5
    section.dictionary-hero
      div
        h1.title.is-3 Словарь и конструктор фраз
        p.subtitle.is-6 Подбирайте слова и редактируйте заготовки. Это рабочие подсказки, а не диагнозы людей.
      span.tag.is-light Локальные данные

    section.dictionary-filter-picker
      button.dictionary-filter(
        v-for="item in PCM_HINT_FILTERS"
        :key="item.value"
        type="button"
        :class="{'is-active': selectedFilter === item.value}"
        :style="{'--filter-color': item.color}"
        :title="item.label"
        @click="selectFilter(item.value)"
      )
        span.icon
          i.fa(:class="item.icon")
        span {{ item.label }}

    .dictionary-layout
      section.dictionary-lexicon
        header.dictionary-section-heading
          div
            p.heading Слова фильтра
            h2.title.is-5 {{ selectedLexicon.personalityType }} · {{ selectedLexicon.title }}
          span.dictionary-type-icon(:style="{'--filter-color': selectedFilterMeta.color}")
            i.fa(:class="selectedFilterMeta.icon")
        .dictionary-search
          span.icon
            i.fa.fa-magnifying-glass
          input.input(v-model="search" type="search" placeholder="Найти слово")
        .tags.dictionary-kind-tags
          button.tag(
            type="button"
            :class="{'is-selected': !selectedKind}"
            @click="selectedKind = ''"
          ) Все слова
          button.tag(
            v-for="kind in wordKinds"
            :key="kind.value"
            type="button"
            :class="{'is-selected': selectedKind === kind.value}"
            @click="selectedKind = selectedKind === kind.value ? '' : kind.value"
          ) {{ kind.label }}
        p.dictionary-empty(v-if="!visibleTerms.length") По этому запросу слов не найдено.
        .dictionary-terms(v-else)
          span.dictionary-term(v-for="term in visibleTerms" :key="`${term.kind}-${term.word}`" :class="`is-${term.kind}`") {{ term.word }}

      section.dictionary-builder
        header.dictionary-section-heading
          div
            p.heading Конструктор
            h2.title.is-5 Подготовить фразу
          span.icon.dictionary-builder__icon
            i.fa.fa-pen-to-square
        .dictionary-field
          label Цель
          .tags
            button.tag(v-for="goal in goals" :key="goal.value" type="button" :class="{'is-selected': selectedGoal === goal.value}" @click="selectedGoal = goal.value") {{ goal.label }}
        .dictionary-field
          label Канал начала разговора
          .tags
            button.tag(v-for="channel in PCM_HINT_CHANNELS" :key="channel.value" type="button" :class="{'is-selected': selectedChannel === channel.value}" @click="selectedChannel = channel.value") {{ channel.label }}
        .dictionary-templates
          button.dictionary-template(v-for="phrase in generatedPhrases" :key="phrase" type="button" :class="{'is-selected': editablePhrase === phrase}" @click="selectGeneratedPhrase(phrase)")
            span.icon
              i.fa.fa-quote-left
            span {{ phrase }}
        label.dictionary-edit-label(for="dictionary-phrase") Своя формулировка
        textarea#dictionary-phrase.textarea(v-model="editablePhrase" rows="4")
        .dictionary-builder__footer
          p {{ isDuplicatePhrase ? 'Такая формулировка уже сохранена.' : 'Фраза сохранится только в этом браузере.' }}
          button.button.is-primary(type="button" @click="savePhrase" :disabled="!editablePhrase.trim() || isDuplicatePhrase")
            span.icon
              i.fa.fa-bookmark
            span Сохранить

    section.dictionary-saved
      header.dictionary-section-heading
        div
          p.heading Мои фразы
          h2.title.is-5 {{ savedPhrases.length ? 'Сохранённые формулировки' : 'Пока пусто' }}
        span.tag.is-light {{ savedPhrases.length }}
      p.dictionary-empty(v-if="!savedPhrases.length") Выберите заготовку, отредактируйте её под свой контекст и сохраните.
      .dictionary-saved__list(v-else)
        article.dictionary-saved__item(v-for="phrase in savedPhrases" :key="phrase.id")
          p {{ phrase.text }}
          footer
            span {{ PCM_HINT_FILTERS.find(item => item.value === phrase.filter)?.label }} · {{ formatDate(phrase.createdAt) }}
            button.button.is-white.is-small(type="button" title="Удалить фразу" @click="removePhrase(phrase.id)")
              span.icon
                i.fa.fa-trash-can
</template>

<style scoped>
.dictionary-page { max-width: 1120px; }
.dictionary-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.dictionary-hero .title { margin-bottom: 0.35rem; }
.dictionary-hero .subtitle { max-width: 44rem; color: var(--app-text-muted); }
.dictionary-filter-picker { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 1rem; }
.dictionary-filter { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 2.45rem; padding: 0.4rem 0.6rem; border: 1px solid color-mix(in srgb, var(--filter-color) 42%, var(--app-border)); border-radius: 0.5rem; background: var(--app-surface); color: var(--filter-color); cursor: pointer; font-size: 0.82rem; }
.dictionary-filter .icon { font-size: 1.1rem; }
.dictionary-filter.is-active { background: color-mix(in srgb, var(--filter-color) 16%, var(--app-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--filter-color) 40%, transparent), 0 0.2rem 0.55rem color-mix(in srgb, var(--filter-color) 20%, transparent); font-weight: 700; transform: translateY(-1px); }
.dictionary-layout { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 1rem; align-items: start; }
.dictionary-lexicon, .dictionary-builder, .dictionary-saved { padding: 1rem; border: 1px solid var(--app-border); border-radius: 0.7rem; background: var(--app-surface); box-shadow: var(--app-shadow); }
.dictionary-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 0.7rem; margin-bottom: 0.85rem; }
.dictionary-section-heading .heading { margin-bottom: 0.15rem; color: var(--app-text-muted); }
.dictionary-section-heading .title { margin: 0; }
.dictionary-type-icon, .dictionary-builder__icon { display: inline-grid; width: 2.6rem; height: 2.6rem; place-items: center; border-radius: 50%; background: color-mix(in srgb, var(--filter-color, var(--app-accent)) 13%, var(--app-surface-muted)); color: var(--filter-color, var(--app-accent)); font-size: 1.35rem; }
.dictionary-search { position: relative; margin-bottom: 0.7rem; }
.dictionary-search .icon { position: absolute; top: 50%; left: 0.7rem; color: var(--app-text-muted); transform: translateY(-50%); }
.dictionary-search .input { padding-left: 2.25rem; }
.dictionary-kind-tags { margin-bottom: 0.75rem; }
.dictionary-kind-tags .tag, .dictionary-field .tag { min-height: 2rem; border: 1px solid var(--app-border); background: var(--app-surface-muted); color: var(--app-text); cursor: pointer; }
.dictionary-kind-tags .tag.is-selected, .dictionary-field .tag.is-selected { border-color: var(--app-accent); background: color-mix(in srgb, var(--app-accent) 14%, var(--app-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 34%, transparent); font-weight: 700; }
.dictionary-terms { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.dictionary-term { display: inline-flex; align-items: center; min-height: 1.9rem; padding: 0.25rem 0.55rem; border: 1px solid var(--app-border); border-radius: 999px; background: var(--app-surface-muted); color: var(--app-text); font-size: 0.8rem; }
.dictionary-term.is-keyword { border-color: color-mix(in srgb, var(--app-accent) 45%, var(--app-border)); color: var(--app-accent); font-weight: 700; }
.dictionary-term.is-verb { background: color-mix(in srgb, #479df8 10%, var(--app-surface)); }
.dictionary-term.is-noun { background: color-mix(in srgb, #9d3cf1 9%, var(--app-surface)); }
.dictionary-term.is-adjective { background: color-mix(in srgb, #ef8f37 11%, var(--app-surface)); }
.dictionary-empty { margin: 0; padding: 0.75rem; border-radius: 0.5rem; background: var(--app-surface-muted); color: var(--app-text-muted); font-size: 0.84rem; }
.dictionary-field { margin-top: 0.85rem; }
.dictionary-field label, .dictionary-edit-label { display: block; margin-bottom: 0.4rem; color: var(--app-text-muted); font-size: 0.78rem; font-weight: 700; }
.dictionary-templates { display: grid; gap: 0.45rem; margin: 0.85rem 0; }
.dictionary-template { display: flex; gap: 0.5rem; width: 100%; padding: 0.65rem; border: 1px solid var(--app-border); border-radius: 0.5rem; background: var(--app-surface-muted); color: var(--app-text); cursor: pointer; font-size: 0.84rem; line-height: 1.4; text-align: left; }
.dictionary-template .icon { color: var(--app-accent); }
.dictionary-template.is-selected { border-color: var(--app-accent); background: color-mix(in srgb, var(--app-accent) 11%, var(--app-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 35%, transparent); }
.dictionary-builder__footer { display: flex; align-items: center; justify-content: space-between; gap: 0.7rem; margin-top: 0.7rem; }
.dictionary-builder__footer p { margin: 0; color: var(--app-text-muted); font-size: 0.75rem; }
.dictionary-saved { margin-top: 1rem; }
.dictionary-saved__list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
.dictionary-saved__item { padding: 0.7rem; border: 1px solid var(--app-border); border-radius: 0.55rem; background: var(--app-surface-muted); }
.dictionary-saved__item p { margin: 0; color: var(--app-text); font-size: 0.84rem; line-height: 1.4; }
.dictionary-saved__item footer { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.5rem; color: var(--app-text-muted); font-size: 0.73rem; }

@media screen and (max-width: 768px) {
  .dictionary-hero, .dictionary-builder__footer { align-items: flex-start; flex-direction: column; }
  .dictionary-layout { grid-template-columns: 1fr; }
  .dictionary-saved__list { grid-template-columns: 1fr; }
}

@media screen and (max-width: 520px) {
  .dictionary-filter { flex: 1 1 calc(50% - 0.45rem); justify-content: center; }
  .dictionary-filter-picker { gap: 0.35rem; }
}
</style>
