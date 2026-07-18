export const PCM_HINT_FILTERS = [
  {value: 'logic', label: 'Логик', color: '#479df8', icon: 'fa-face-meh'},
  {value: 'persistent', label: 'Упорный', color: '#9d3cf1', icon: 'fa-face-grimace'},
  {value: 'soulful', label: 'Душевный', color: '#ef8f37', icon: 'fa-face-kiss-wink-heart'},
  {value: 'dreamer', label: 'Мечтатель', color: '#9d6436', icon: 'fa-face-grin-stars'},
  {value: 'rebel', label: 'Бунтарь', color: '#edda52', icon: 'fa-face-grin-tongue-wink'},
  {value: 'activist', label: 'Деятель', color: '#e69492', icon: 'fa-face-grin-wide'},
] as const

export const PCM_HINT_CHANNELS = [
  {value: 'question', label: 'Вопросительный'},
  {value: 'caring', label: 'Заботливый'},
  {value: 'directive', label: 'Директивный'},
  {value: 'emotional', label: 'Эмоциональный'},
  {value: 'interrupt', label: 'Прерывающий'},
] as const

export const PCM_HINT_CONFIDENCE = [
  {value: 'low', label: 'Низкая'},
  {value: 'medium', label: 'Средняя'},
  {value: 'high', label: 'Высокая'},
] as const

export const PCM_HINT_INVOLVEMENT = [
  {value: 'involved', label: 'Вовлечён'},
  {value: 'distant', label: 'Дистанцирован'},
] as const

export const PCM_HINT_STIMULUS = [
  {value: 'inner', label: 'Внутренний стимул'},
  {value: 'outer', label: 'Внешний стимул'},
] as const

export type PcmHintFilter = typeof PCM_HINT_FILTERS[number]['value']
export type PcmHintChannel = typeof PCM_HINT_CHANNELS[number]['value']
export type PcmHintConfidence = typeof PCM_HINT_CONFIDENCE[number]['value']
export type PcmHintInvolvement = typeof PCM_HINT_INVOLVEMENT[number]['value']
export type PcmHintStimulus = typeof PCM_HINT_STIMULUS[number]['value']

export interface PcmHint {
  filter: PcmHintFilter | '';
  confidence: PcmHintConfidence;
  channel: PcmHintChannel | '';
  involvement: PcmHintInvolvement | '';
  stimulus: PcmHintStimulus | '';
  needs: string[];
  helps: string;
  avoid: string;
}

export const createPcmHint = (value: Partial<PcmHint> = {}): PcmHint => ({
  filter: value.filter ?? '',
  confidence: value.confidence ?? 'low',
  channel: value.channel ?? '',
  involvement: value.involvement ?? '',
  stimulus: value.stimulus ?? '',
  needs: Array.isArray(value.needs) ? [...value.needs] : [],
  helps: value.helps ?? '',
  avoid: value.avoid ?? '',
})
