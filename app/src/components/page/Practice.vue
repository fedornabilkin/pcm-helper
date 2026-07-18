<script setup lang="ts">
import {computed, ref} from 'vue'
import {useLocalStore} from '@/core/composable/store/localStore'
import {filterTaskBank} from '@/pcm/practice/filterTaskBank'
import {PCM_HINT_FILTERS} from '@/networker/entity/graph/pcmHint'

interface PracticeOption {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
}

interface PracticeTask {
  id: string;
  skill: string;
  icon: string;
  title: string;
  prompt: string;
  situation?: string;
  options: PracticeOption[];
  principle: string;
}

interface PracticeAttempt {
  completedAt: string;
  durationSeconds: number;
  mistakes: number;
  total: number;
}

interface PracticeHistoryDay {
  date: string;
  attempts: PracticeAttempt[];
}

interface PracticeHistory {
  days: PracticeHistoryDay[];
}

const coreTasks: PracticeTask[] = [
  {
    id: 'filter', skill: 'Наблюдение', icon: 'fa-filter', title: 'Уловить фильтр',
    prompt: '«Давайте сначала сверим факты, варианты и сроки. Тогда будет проще решить».',
    situation: 'Какая часть сообщения здесь наиболее заметна?',
    options: [
      {id: 'logic', label: 'Логик: факты и структура', correct: true, explanation: 'Верно: внимание направлено на данные, варианты и ясный план.'},
      {id: 'soulful', label: 'Душевный: контакт и тепло', correct: false, explanation: 'В этой фразе почти нет обращения к отношениям или чувствам.'},
      {id: 'rebel', label: 'Бунтарь: игра и реакция', correct: false, explanation: 'Здесь нет спонтанного, игрового или эмоционального отклика.'},
    ],
    principle: 'Один фрагмент речи — это наблюдение, а не вывод о личности человека.',
  },
  {
    id: 'channel', skill: 'Канал', icon: 'fa-tower-cell', title: 'Начать разговор',
    prompt: 'Коллега расстроен после сложной встречи и отвечает очень коротко.',
    situation: 'Как безопаснее начать разговор?',
    options: [
      {id: 'caring', label: '«Похоже, встреча была непростой. Хочешь немного рассказать?»', correct: true, explanation: 'Верно: сначала создаётся контакт и право не торопиться с решением.'},
      {id: 'directive', label: '«Соберись и пришли мне план до конца дня».', correct: false, explanation: 'Просьба может быть уместна позже, но сейчас она усиливает давление.'},
      {id: 'question', label: '«Назови три причины, почему встреча не удалась».', correct: false, explanation: 'Конкретный вопрос полезен, но на старте он может прозвучать как разбор ошибки.'},
    ],
    principle: 'Выбирайте канал по ситуации, а не по предполагаемому «типу» человека.',
  },
  {
    id: 'repair', skill: 'Восстановление', icon: 'fa-wrench', title: 'Исправить реплику',
    prompt: 'В ответ на длинное объяснение собеседник сказал: «Я вообще не понимаю, чего ты от меня хочешь».',
    situation: 'Как лучше переформулировать следующий шаг?',
    options: [
      {id: 'simple', label: '«Сейчас нужен только один ответ: сможешь взять эту задачу до пятницы?»', correct: true, explanation: 'Верно: одна понятная просьба снижает перегрузку и помогает вернуть контакт.'},
      {id: 'more', label: '«Тогда я ещё раз объясню все детали с самого начала».', correct: false, explanation: 'Дополнительные детали часто усиливают перегрузку, если смысл уже потерян.'},
      {id: 'blame', label: '«Ты просто не слушал(а), я всё уже сказал(а)».', correct: false, explanation: 'Оценка собеседника переводит разговор в защиту, а не к прояснению.'},
    ],
    principle: 'При сбое полезно сократить сообщение, назвать один шаг и проверить понимание.',
  },
  {
    id: 'style', skill: 'Формат', icon: 'fa-people-arrows', title: 'Выбрать стиль',
    prompt: 'Команде нужно выбрать способ распределить новую задачу, а у участников есть разный опыт и идеи.',
    situation: 'Какой формат взаимодействия уместен в этой ситуации?',
    options: [
      {id: 'democratic', label: 'Демократический: собрать варианты, обсудить критерии и договориться.', correct: true, explanation: 'Верно: общий выбор помогает учесть опыт участников и повысить включённость.'},
      {id: 'autocratic', label: 'Авторитарный: руководитель сразу назначает решение без обсуждения.', correct: false, explanation: 'Такой формат бывает нужен в дефиците времени, но не использует доступный опыт команды.'},
      {id: 'free', label: 'Свободный: не задавать рамки и ждать, что решение появится само.', correct: false, explanation: 'Свобода без общей цели и критериев может оставить задачу без движения.'},
    ],
    principle: 'Стиль — это выбор формата под задачу, а не постоянная характеристика руководителя.',
  },
]

const channelTaskBank: PracticeTask[] = [
  coreTasks.find(task => task.id === 'channel')!,
  {
    id: 'channel-directive', skill: 'Канал', icon: 'fa-tower-cell', title: 'Начать разговор',
    prompt: 'Перед запуском нужно быстро согласовать действия команды: времени мало, задача понятна, а роли уже распределены.',
    situation: 'С какой реплики лучше начать?',
    options: [
      {id: 'directive', label: '«Берём план: ты готовишь цифры, ты — письмо, я проверяю в 15:00».', correct: true, explanation: 'Верно: ситуация требует короткой, ясной координации и конкретных действий.'},
      {id: 'caring', label: '«Давайте сначала поделимся, как каждый относится к этой задаче».', correct: false, explanation: 'Контакт важен, но он не решает задачу быстрой синхронизации.'},
      {id: 'reflective', label: '«Подумайте каждый в тишине и вернёмся к разговору завтра».', correct: false, explanation: 'Пауза полезна не всегда: здесь она создаст лишнюю задержку.'},
    ],
    principle: 'Канал выбирают по потребностям момента: ясная директива может быть заботой о времени и нагрузке.',
  },
  {
    id: 'channel-question', skill: 'Канал', icon: 'fa-tower-cell', title: 'Начать разговор',
    prompt: 'Коллега принёс решение, но вы видите в нём риск и хотите понять ход мысли, не обесценивая работу.',
    situation: 'Какая реплика поможет начать диалог?',
    options: [
      {id: 'question', label: '«По каким критериям ты сравнивал(а) варианты и какой риск считаешь главным?»', correct: true, explanation: 'Верно: конкретный вопрос приглашает объяснить логику решения и не звучит как нападение.'},
      {id: 'judgement', label: '«Это решение слишком слабое, переделай».', correct: false, explanation: 'Оценка без вопроса вызывает защиту и не даёт понять, где именно расхождение.'},
      {id: 'joke', label: '«Ну что, снова выбираем самый опасный путь?»', correct: false, explanation: 'Шутка может прозвучать как укол, когда нужно аккуратно разобрать риск.'},
    ],
    principle: 'Конкретные вопросы полезны, когда важно исследовать решение, а не выиграть спор.',
  },
]

const repairTaskBank: PracticeTask[] = [
  coreTasks.find(task => task.id === 'repair')!,
  {
    id: 'repair-emotion', skill: 'Восстановление', icon: 'fa-wrench', title: 'Исправить реплику',
    prompt: 'После вашей резкой фразы собеседник замолчал и отвернулся.',
    situation: 'Что лучше сказать следующим?',
    options: [
      {id: 'acknowledge', label: '«Кажется, я сказал(а) это слишком резко. Прости. Давай я сформулирую спокойнее».', correct: true, explanation: 'Верно: признание своего вклада снижает напряжение и возвращает выбор продолжать разговор.'},
      {id: 'justify', label: '«Я просто говорю правду, не надо так реагировать».', correct: false, explanation: 'Оправдание обесценивает реакцию и обычно усиливает дистанцию.'},
      {id: 'pressure', label: '«Не молчи, мне нужен ответ прямо сейчас».', correct: false, explanation: 'Давление в момент перегрузки закрывает возможность восстановить контакт.'},
    ],
    principle: 'Восстановление начинается с ответственности за свою реплику, а не с объяснения, почему другой «неправильно» отреагировал.',
  },
  {
    id: 'repair-boundary', skill: 'Восстановление', icon: 'fa-wrench', title: 'Исправить реплику',
    prompt: 'Разговор зашёл в тупик: собеседник повышает голос, а вы чувствуете, что начинаете отвечать так же.',
    situation: 'Какой следующий шаг бережнее?',
    options: [
      {id: 'pause', label: '«Я хочу решить вопрос, но сейчас мы оба на взводе. Предлагаю вернуться к нему через полчаса».', correct: true, explanation: 'Верно: пауза с ясным намерением и временем возвращения удерживает границу и сохраняет контакт.'},
      {id: 'win', label: '«Пока не согласишься, разговор не закончен».', correct: false, explanation: 'Борьба за немедленную победу обычно усиливает стресс и сопротивление.'},
      {id: 'leave', label: 'Молча уйти и больше не возвращаться к теме.', correct: false, explanation: 'Пауза полезна, когда есть договорённость, как и когда разговор продолжится.'},
    ],
    principle: 'Пауза — это не уход от проблемы, если вы обозначаете намерение и точку возвращения к разговору.',
  },
]

const styleTaskBank: PracticeTask[] = [
  coreTasks.find(task => task.id === 'style')!,
  {
    id: 'style-authoritative', skill: 'Формат', icon: 'fa-people-arrows', title: 'Выбрать стиль',
    prompt: 'Во время инцидента сервис недоступен, команда знает аварийный регламент, а решение нужно принять за минуты.',
    situation: 'Какой формат взаимодействия уместен сейчас?',
    options: [
      {id: 'authoritative', label: 'Авторитарный: быстро назначить действия по регламенту и время следующей сверки.', correct: true, explanation: 'Верно: при острой ситуации ясное лидерство помогает сократить задержку и неопределённость.'},
      {id: 'democratic', label: 'Демократический: подробно обсудить все возможные подходы с каждым участником.', correct: false, explanation: 'Обсуждение ценно, но в аварии может отнять время, нужное для восстановления сервиса.'},
      {id: 'free', label: 'Свободный: дать каждому выбрать, чем заниматься, без общего координатора.', correct: false, explanation: 'Без координации работа может дублироваться или оставить критичные шаги без владельца.'},
    ],
    principle: 'Авторитарный формат уместен в дефиците времени, если он опирается на задачу и заканчивается после неё.',
  },
  {
    id: 'style-delegating', skill: 'Формат', icon: 'fa-people-arrows', title: 'Выбрать стиль',
    prompt: 'Опытный специалист хорошо знает область, результат и границы задачи понятны, а руководитель хочет поддержать самостоятельность.',
    situation: 'Какой формат лучше выбрать?',
    options: [
      {id: 'delegating', label: 'Свободный: согласовать результат и срок, затем дать пространство для самостоятельного решения.', correct: true, explanation: 'Верно: при компетентности и ясной рамке делегирование даёт человеку возможность действовать самостоятельно.'},
      {id: 'authoritative', label: 'Авторитарный: подробно диктовать каждый шаг и способ выполнения.', correct: false, explanation: 'Избыточный контроль может снизить инициативу там, где компетенция уже есть.'},
      {id: 'democratic', label: 'Демократический: собирать ежедневное голосование по каждому следующему шагу.', correct: false, explanation: 'Общий выбор не обязателен, когда ответственность уже может быть передана одному владельцу.'},
    ],
    principle: 'Свобода работает вместе с понятной ответственностью: результат, срок и границы остаются ясными.',
  },
]

const randomTask = <Task extends PracticeTask>(taskBank: Task[]): Task => taskBank[Math.floor(Math.random() * taskBank.length)]

const createTasks = (): PracticeTask[] => {
  return [
    randomTask(filterTaskBank),
    randomTask(channelTaskBank),
    randomTask(repairTaskBank),
    randomTask(styleTaskBank),
  ]
}

const tasks = ref<PracticeTask[]>(createTasks())

const {state: storedProgress, save: saveProgress} = useLocalStore('pcm-practice-progress', {completed: [] as string[]})
const {state: storedHistory, save: saveHistory} = useLocalStore('pcm-practice-history', {days: [] as PracticeHistoryDay[]})
const storedCompleted = Array.isArray(storedProgress.value?.completed) ? storedProgress.value.completed : []
const completed = ref<string[]>(storedCompleted.filter((id: string) => tasks.value.some(task => task.id === id)))
const activeTaskIndex = ref(0)
const selectedAnswers = ref<Record<string, string>>({})
const mistakes = ref(0)
const startedAt = ref(Date.now())
const shuffleOptions = (options: PracticeOption[]): PracticeOption[] => {
  const result = [...options]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }
  return result
}
const createShuffledOptions = (): Record<string, PracticeOption[]> => Object.fromEntries(
  tasks.value.map(task => [task.id, shuffleOptions(task.options)]),
)
const shuffledOptions = ref<Record<string, PracticeOption[]>>(createShuffledOptions())

const activeTask = computed(() => tasks.value[activeTaskIndex.value])
const activeOptions = computed(() => shuffledOptions.value[activeTask.value.id] ?? activeTask.value.options)
const activeAnswer = computed(() => activeTask.value.options.find(option => option.id === selectedAnswers.value[activeTask.value.id]))
const progress = computed(() => `${completed.value.length} / ${tasks.value.length}`)
const isFinished = computed(() => completed.value.length === tasks.value.length)
const historyDays = computed<PracticeHistoryDay[]>(() => {
  if (!Array.isArray(storedHistory.value?.days)) {
    return []
  }
  return storedHistory.value.days
    .filter((day: PracticeHistoryDay) => typeof day?.date === 'string' && Array.isArray(day.attempts))
    .map((day: PracticeHistoryDay) => ({
      date: day.date,
      attempts: day.attempts.filter(attempt => typeof attempt?.completedAt === 'string'),
    }))
})
const allAttempts = computed(() => historyDays.value.flatMap(day => day.attempts))
const bestAttempt = computed(() => [...allAttempts.value].sort((first, second) => first.mistakes - second.mistakes || first.durationSeconds - second.durationSeconds)[0])

const dateKey = (date: Date): string => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
const formatDuration = (durationSeconds: number): string => {
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  return minutes ? `${minutes} мин ${String(seconds).padStart(2, '0')} с` : `${seconds} с`
}
const formatDate = (date: string): string => new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(`${date}T12:00:00`))
const formatTime = (date: string): string => new Intl.DateTimeFormat('ru-RU', {hour: '2-digit', minute: '2-digit'}).format(new Date(date))
const isToday = (date: string): boolean => date === dateKey(new Date())

const saveAttempt = (): void => {
  const completedAt = new Date()
  const today = dateKey(completedAt)
  const attempt: PracticeAttempt = {
    completedAt: completedAt.toISOString(),
    durationSeconds: Math.max(1, Math.round((Date.now() - startedAt.value) / 1000)),
    mistakes: mistakes.value,
    total: tasks.value.length,
  }
  const existingDays = historyDays.value
  const previousDay = existingDays.find(day => day.date === today)
  const updatedDay: PracticeHistoryDay = {
    date: today,
    attempts: [attempt, ...(previousDay?.attempts ?? [])].slice(0, 5),
  }
  storedHistory.value = {
    days: [updatedDay, ...existingDays.filter(day => day.date !== today)].sort((first, second) => second.date.localeCompare(first.date)).slice(0, 10),
  }
  saveHistory()
}

const selectAnswer = (option: PracticeOption): void => {
  if (completed.value.includes(activeTask.value.id)) {
    return
  }
  selectedAnswers.value = {...selectedAnswers.value, [activeTask.value.id]: option.id}
  if (!option.correct) {
    mistakes.value += 1
    return
  }
  const nextCompleted = [...completed.value, activeTask.value.id]
  completed.value = nextCompleted
  storedProgress.value = {completed: completed.value}
  saveProgress()
  if (nextCompleted.length === tasks.value.length) {
    saveAttempt()
  }
}

const setActiveTask = (index: number): void => {
  activeTaskIndex.value = index
}

const nextTask = (): void => {
  activeTaskIndex.value = (activeTaskIndex.value + 1) % tasks.value.length
}

const resetPractice = (): void => {
  completed.value = []
  selectedAnswers.value = {}
  mistakes.value = 0
  startedAt.value = Date.now()
  activeTaskIndex.value = 0
  tasks.value = createTasks()
  shuffledOptions.value = createShuffledOptions()
  storedProgress.value = {completed: []}
  saveProgress()
}

const optionClass = (option: PracticeOption): Record<string, boolean> => {
  const isSelected = selectedAnswers.value[activeTask.value.id] === option.id
  return {
    'is-selected': isSelected,
    'is-correct': isSelected && option.correct,
    'is-wrong': isSelected && !option.correct,
  }
}

const filterOptionMeta = (option: PracticeOption) => {
  if (!activeTask.value.id.startsWith('filter-')) {
    return undefined
  }
  return PCM_HINT_FILTERS.find(item => item.value === option.id)
}
</script>

<template lang="pug">
  .container.practice-page.mb-5
    section.practice-hero
      .practice-hero__copy
        h1.title.is-3 Практикум PCM
        p.subtitle.is-6 Короткие ситуации, чтобы потренировать наблюдение, канал, восстановление контакта и формат взаимодействия.
      span.tag.is-light Локальный прогресс · {{ progress }}

    .practice-layout
      aside.practice-nav
        p.practice-nav__title Задания
        button.practice-nav__item(
          v-for="(task, index) in tasks"
          :key="task.id"
          type="button"
          :class="{'is-active': activeTaskIndex === index, 'is-complete': completed.includes(task.id)}"
          @click="setActiveTask(index)"
        )
          span.icon
            i.fa(:class="completed.includes(task.id) ? 'fa-circle-check' : task.icon")
          span {{ task.skill }}
        button.button.is-small.is-light.practice-reset(v-if="completed.length" type="button" @click="resetPractice")
          span.icon
            i.fa.fa-rotate-left
          span Сбросить

      section.practice-card
        header.practice-card__header
          .practice-card__meta
            span.icon
              i.fa(:class="activeTask.icon")
            span {{ activeTask.skill }}
          span.tag.is-light {{ activeTaskIndex + 1 }} / {{ tasks.length }}
        .practice-card__content
          h2.title.is-4 {{ activeTask.title }}
          blockquote.practice-prompt {{ activeTask.prompt }}
          p.practice-situation {{ activeTask.situation }}
          .practice-options
            button.practice-option(
              v-for="option in activeOptions"
              :key="option.id"
              type="button"
              :class="[optionClass(option), {'is-filter-option': filterOptionMeta(option)}]"
              :style="filterOptionMeta(option) ? {'--type-color': filterOptionMeta(option)?.color} : undefined"
              @click="selectAnswer(option)"
            )
              span.practice-option__type-icon(v-if="filterOptionMeta(option)")
                i.fa(:class="filterOptionMeta(option)?.icon")
              span.icon.practice-option__result(v-if="selectedAnswers[activeTask.id] === option.id")
                i.fa(:class="option.correct ? 'fa-check' : 'fa-rotate-left'")
              span {{ option.label }}
          .practice-feedback(v-if="activeAnswer" :class="activeAnswer.correct ? 'is-correct' : 'is-wrong'")
            span.icon
              i.fa(:class="activeAnswer.correct ? 'fa-circle-check' : 'fa-lightbulb'")
            div
              strong {{ activeAnswer.correct ? 'Подходит' : 'Попробуйте ещё' }}
              p {{ activeAnswer.explanation }}
          .practice-principle
            span.icon
              i.fa.fa-book-open
            p {{ activeTask.principle }}
        footer.practice-card__footer
          p(v-if="isFinished") Все задания пройдены. Можно вернуться к любому и закрепить навык.
          p(v-else) Выберите вариант, затем переходите к следующему заданию.
          button.button.is-success(type="button" v-if="isFinished" @click="resetPractice")
            span.icon
              i.fa.fa-rotate-left
            span Пройти заново
          button.button.is-info(type="button" v-else @click="nextTask")
            span {{ activeTaskIndex === tasks.length - 1 ? 'К началу' : 'Следующее' }}
            span.icon
              i.fa.fa-arrow-right

      section.practice-stats
        header.practice-stats__header
          div
            p.heading Практикум
            h2.title.is-5 Статистика
          .practice-stats__best(v-if="bestAttempt")
            span.icon
              i.fa.fa-trophy
            div
              strong Лучший результат
              span {{ bestAttempt.mistakes ? `${bestAttempt.mistakes} ошибок` : 'без ошибок' }} · {{ formatDuration(bestAttempt.durationSeconds) }}
        p.practice-stats__empty(v-if="!historyDays.length") Первое завершённое прохождение появится здесь.
        .practice-history(v-else)
          article.practice-history-day(v-for="day in historyDays" :key="day.date")
            header.practice-history-day__header
              strong {{ isToday(day.date) ? 'Сегодня' : formatDate(day.date) }}
              span {{ day.attempts.length }} раз
            .practice-history-attempts
              div.practice-history-attempt(v-for="attempt in day.attempts" :key="attempt.completedAt")
                span.practice-history-attempt__time {{ formatTime(attempt.completedAt) }}
                span {{ formatDuration(attempt.durationSeconds) }}
                span(:class="{'is-clean': !attempt.mistakes}") {{ attempt.mistakes ? `${attempt.mistakes} ошибок` : 'без ошибок' }}
</template>

<style scoped>
.practice-page { max-width: 1200px; }
.practice-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.practice-hero .title { margin-bottom: 0.35rem; }
.practice-hero .subtitle { max-width: 42rem; color: var(--app-text-muted); }
.practice-layout { display: grid; grid-template-columns: 170px minmax(0, 1fr) 245px; gap: 1rem; align-items: start; }
.practice-nav, .practice-card, .practice-stats { border: 1px solid var(--app-border); border-radius: 0.7rem; background: var(--app-surface); box-shadow: var(--app-shadow); }
.practice-nav { display: grid; gap: 0.35rem; padding: 0.65rem; }
.practice-nav__title { margin: 0.2rem 0 0.3rem; padding: 0 0.3rem; color: var(--app-text-muted); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; }
.practice-nav__item { display: flex; align-items: center; gap: 0.4rem; min-height: 2.35rem; padding: 0.4rem 0.5rem; border: 1px solid transparent; border-radius: 0.45rem; background: transparent; color: var(--app-text); cursor: pointer; font-size: 0.82rem; text-align: left; }
.practice-nav__item:hover { background: var(--app-surface-muted); }
.practice-nav__item.is-active { border-color: var(--app-accent); background: color-mix(in srgb, var(--app-accent) 12%, var(--app-surface)); font-weight: 700; }
.practice-nav__item.is-complete .icon { color: #1f9d61; }
.practice-reset { margin-top: 0.35rem; }
.practice-card { overflow: hidden; }
.practice-card__header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.9rem 1rem; background: var(--app-surface-muted); }
.practice-card__meta { display: flex; align-items: center; gap: 0.4rem; color: var(--app-text-muted); font-size: 0.82rem; font-weight: 700; }
.practice-card__meta .icon { color: var(--app-accent); }
.practice-card__content { padding: 1.15rem; }
.practice-card__content .title { margin-bottom: 0.8rem; }
.practice-prompt { margin: 0; padding: 0.85rem 0.95rem; border-left: 3px solid var(--app-accent); border-radius: 0 0.5rem 0.5rem 0; background: color-mix(in srgb, var(--app-accent) 10%, var(--app-surface)); color: var(--app-text); font-size: 1.03rem; font-weight: 600; line-height: 1.45; }
.practice-situation { margin: 0.75rem 0; color: var(--app-text-muted); }
.practice-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; }
.practice-option { display: flex; align-items: flex-start; gap: 0.5rem; min-height: 100%; width: 100%; padding: 0.7rem; border: 1px solid var(--app-border); border-radius: 0.5rem; background: var(--app-surface-muted); color: var(--app-text); cursor: pointer; font-size: 0.84rem; text-align: left; line-height: 1.4; }
.practice-option:hover { border-color: var(--app-accent); }
.practice-option.is-selected { box-shadow: inset 0 0 0 1px var(--app-accent); }
.practice-option.is-correct { border-color: #23a66a; background: color-mix(in srgb, #23a66a 11%, var(--app-surface)); }
.practice-option.is-wrong { border-color: #e87932; background: color-mix(in srgb, #e87932 11%, var(--app-surface)); }
.practice-option.is-correct .icon { color: #1f9d61; }
.practice-option.is-wrong .icon { color: #d66a21; }
.practice-option.is-filter-option { border-color: color-mix(in srgb, var(--type-color) 50%, var(--app-border)); background: color-mix(in srgb, var(--type-color) 8%, var(--app-surface-muted)); }
.practice-option.is-filter-option:hover { border-color: var(--type-color); background: color-mix(in srgb, var(--type-color) 14%, var(--app-surface)); }
.practice-option.is-filter-option.is-selected { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--type-color) 70%, transparent); }
.practice-option__type-icon { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; width: 1.45rem; color: var(--type-color); font-size: 1.25rem; }
.practice-option__result { color: var(--app-text-muted); }
.practice-feedback { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 0.5rem; margin-top: 0.75rem; padding: 0.75rem; border-radius: 0.5rem; }
.practice-feedback.is-correct { background: color-mix(in srgb, #23a66a 12%, var(--app-surface)); color: #187347; }
.practice-feedback.is-wrong { background: color-mix(in srgb, #e87932 12%, var(--app-surface)); color: #a65617; }
.practice-feedback strong { font-size: 0.86rem; }
.practice-feedback p { margin: 0.15rem 0 0; color: var(--app-text-muted); font-size: 0.84rem; line-height: 1.4; }
.practice-principle { display: flex; align-items: flex-start; gap: 0.45rem; margin-top: 0.75rem; color: var(--app-text-muted); font-size: 0.8rem; line-height: 1.4; }
.practice-principle .icon { color: var(--app-accent); }
.practice-principle p { margin: 0; }
.practice-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.85rem 1rem; border-top: 1px solid var(--app-border); background: var(--app-surface-muted); }
.practice-card__footer p { margin: 0; color: var(--app-text-muted); font-size: 0.78rem; }
.practice-stats { padding: 0.8rem; }
.practice-stats__header { display: grid; gap: 0.65rem; margin-bottom: 0.7rem; }
.practice-stats__header .heading { margin-bottom: 0.15rem; color: var(--app-text-muted); }
.practice-stats__header .title { margin: 0; }
.practice-stats__best { display: flex; align-items: center; gap: 0.55rem; padding: 0.55rem 0.65rem; border-radius: 0.5rem; background: color-mix(in srgb, #e7b226 13%, var(--app-surface-muted)); color: var(--app-text); font-size: 0.78rem; }
.practice-stats__best .icon { color: #b77900; font-size: 1.05rem; }
.practice-stats__best strong, .practice-stats__best span { display: block; }
.practice-stats__best span { margin-top: 0.08rem; color: var(--app-text-muted); }
.practice-stats__empty { margin: 0; padding: 0.85rem; border-radius: 0.5rem; background: var(--app-surface-muted); color: var(--app-text-muted); font-size: 0.85rem; }
.practice-history { display: grid; gap: 0.5rem; }
.practice-history-day { padding: 0.55rem; border: 1px solid var(--app-border); border-radius: 0.55rem; background: var(--app-surface-muted); }
.practice-history-day__header { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem; }
.practice-history-day__header strong { font-size: 0.86rem; }
.practice-history-day__header span { color: var(--app-text-muted); font-size: 0.75rem; }
.practice-history-attempts { display: grid; gap: 0.32rem; }
.practice-history-attempt { display: grid; grid-template-columns: 3rem 1fr auto; gap: 0.45rem; align-items: center; color: var(--app-text-muted); font-size: 0.77rem; }
.practice-history-attempt__time { color: var(--app-text); font-weight: 700; }
.practice-history-attempt .is-clean { color: #1f9d61; font-weight: 700; }

@media screen and (max-width: 1120px) {
  .practice-page { max-width: 1040px; }
  .practice-layout { grid-template-columns: 170px minmax(0, 1fr); }
  .practice-stats { grid-column: 2; }
  .practice-stats__header { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
  .practice-history { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media screen and (max-width: 768px) {
  .practice-hero { flex-direction: column; gap: 0.5rem; }
  .practice-layout { grid-template-columns: 1fr; }
  .practice-stats { grid-column: auto; }
  .practice-nav { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .practice-nav__title, .practice-reset { grid-column: 1 / -1; }
  .practice-nav__item { justify-content: center; padding: 0.35rem; }
  .practice-nav__item span:not(.icon) { display: none; }
  .practice-history { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media screen and (max-width: 460px) {
  .practice-card__footer { align-items: flex-start; flex-direction: column; }
  .practice-options { grid-template-columns: 1fr; }
  .practice-stats__header { display: grid; grid-template-columns: 1fr; align-items: flex-start; }
  .practice-history { grid-template-columns: 1fr; }
}
</style>
