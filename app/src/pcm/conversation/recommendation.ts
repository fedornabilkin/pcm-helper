import type {PcmHint, PcmHintChannel, PcmHintFilter} from '@/networker/entity/graph/pcmHint'

export const CONVERSATION_GOALS = [
  {value: 'discuss', label: 'Обсудить задачу', icon: 'fa-list-check'},
  {value: 'request', label: 'О чём-то попросить', icon: 'fa-hand'},
  {value: 'feedback', label: 'Дать обратную связь', icon: 'fa-message'},
  {value: 'tension', label: 'Снизить напряжение', icon: 'fa-heart'},
] as const

export type ConversationGoal = typeof CONVERSATION_GOALS[number]['value']

export interface ConversationRecommendation {
  opening: string;
  focus: string;
  questions: string[];
  avoid: string;
  channel: string;
  fallback: string;
  missing: string[];
}

const filterAdvice: Record<PcmHintFilter, {opening: string; focus: string; avoid: string; question: string}> = {
  logic: {
    opening: 'Начните с цели и проверяемых фактов.',
    focus: 'Дайте структуру, варианты и время подумать.',
    avoid: 'Не торопите с решением и не заменяйте факты общими словами.',
    question: 'Какие данные или варианты стоит учесть перед решением?',
  },
  persistent: {
    opening: 'Спросите мнение и покажите, что позиция услышана.',
    focus: 'Обсудите принципы, критерии и долгосрочный смысл решения.',
    avoid: 'Не обесценивайте убеждения и не давите авторитетом.',
    question: 'Какие принципы для тебя здесь особенно важны?',
  },
  soulful: {
    opening: 'Сначала установите тёплый личный контакт.',
    focus: 'Назовите вклад человека и проявите искреннее внимание.',
    avoid: 'Не начинайте с холодной критики или резких формулировок.',
    question: 'Как ты себя чувствуешь в этой ситуации?',
  },
  dreamer: {
    opening: 'Коротко и спокойно обозначьте, что нужно сделать.',
    focus: 'Дайте одну ясную задачу, контекст и пространство для самостоятельной работы.',
    avoid: 'Не перегружайте обсуждением, вариантами и лишними деталями.',
    question: 'Что тебе нужно уточнить, чтобы спокойно приступить?',
  },
  rebel: {
    opening: 'Начните живо, просто и по-человечески.',
    focus: 'Используйте лёгкий язык, выбор и возможность быстро откликнуться.',
    avoid: 'Не читайте длинную лекцию и не говорите канцеляритом.',
    question: 'Какой вариант тебе сейчас больше откликается?',
  },
  activist: {
    opening: 'Предложите короткий, энергичный формат разговора.',
    focus: 'Дайте выбор, действие и ощутимый следующий результат.',
    avoid: 'Не затягивайте детали и не ограничивайте без необходимости.',
    question: 'Какой следующий шаг будет самым удобным для тебя?',
  },
}

const channelAdvice: Record<PcmHintChannel, string> = {
  question: 'Задавайте конкретные вопросы и оставляйте место для ответа.',
  caring: 'Добавьте поддержку и признание человека.',
  directive: 'Сформулируйте ясную, короткую просьбу или следующий шаг.',
  emotional: 'Допустимы эмоции, энергия и непосредственная реакция.',
  interrupt: 'Используйте только для быстрой помощи в острой стрессовой ситуации.',
}

const goalAdvice: Record<ConversationGoal, {lead: string; question: string; fallback: string}> = {
  discuss: {
    lead: 'Хочу вместе посмотреть на задачу и выбрать следующий шаг.',
    question: 'Как ты видишь оптимальный следующий шаг?',
    fallback: 'Если разговор буксует, сузьте его до одного решения и договоритесь, когда вернётесь к остальным вопросам.',
  },
  request: {
    lead: 'Мне нужна твоя помощь в одной конкретной вещи.',
    question: 'Сможешь ли ты взять это на себя, и какой формат будет удобен?',
    fallback: 'Если сейчас неудобно, предложите выбор срока или более небольшой объём помощи.',
  },
  feedback: {
    lead: 'Хочу поделиться наблюдением, которое может быть полезно.',
    question: 'Как ты сам(а) оцениваешь, что получилось?',
    fallback: 'Если реакция напряжённая, сделайте паузу: назовите намерение поддержки и вернитесь к одному наблюдаемому факту.',
  },
  tension: {
    lead: 'Мне важно спокойно прояснить ситуацию и сохранить контакт.',
    question: 'Что сейчас помогло бы нам продолжить разговор спокойнее?',
    fallback: 'Не спорьте о мотивах. Сделайте паузу, признайте напряжение и согласуйте безопасный момент для продолжения.',
  },
}

const genericRecommendation = (goal: ConversationGoal): ConversationRecommendation => ({
  opening: goalAdvice[goal].lead,
  focus: 'Опирайтесь на наблюдаемые факты, говорите коротко и проверяйте, как вас поняли.',
  questions: [goalAdvice[goal].question],
  avoid: 'Не делайте выводов о человеке и не используйте PCM как ярлык.',
  channel: 'Начните с нейтрального вопросительного канала: вопрос, пауза, внимание к ответу.',
  fallback: goalAdvice[goal].fallback,
  missing: ['выберите контакт или укажите гипотезу о его типе'],
})

export const getConversationRecommendation = (
  hint: Partial<PcmHint> | undefined,
  goal: ConversationGoal,
): ConversationRecommendation => {
  if (!hint?.filter) {
    return genericRecommendation(goal)
  }

  const advice = filterAdvice[hint.filter]
  const missing: string[] = []
  if (!hint.channel) missing.push('предпочтительный канал')
  if (!hint.needs?.length) missing.push('предполагаемые потребности')

  const questions = [goalAdvice[goal].question, advice.question]
  if (hint.needs?.length) {
    questions.push(`Что сейчас было бы полезнее: ${hint.needs.join(' или ')}?`)
  }

  return {
    opening: `${goalAdvice[goal].lead} ${advice.opening}`,
    focus: `${advice.focus}${hint.helps ? ` Учтите заметку: ${hint.helps}` : ''}`,
    questions,
    avoid: `${advice.avoid}${hint.avoid ? ` Также лучше избегать: ${hint.avoid}` : ''}`,
    channel: hint.channel ? channelAdvice[hint.channel] : 'Канал не выбран: начните с короткого нейтрального вопроса и подстройтесь по ответу.',
    fallback: goalAdvice[goal].fallback,
    missing,
  }
}
