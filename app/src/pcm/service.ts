import activist from '@/pcm/data/filter/activist.json'
import dreamer from '@/pcm/data/filter/dreamer.json'
import logic from '@/pcm/data/filter/logic.json'
import persistent from '@/pcm/data/filter/persistent.json'
import rebel from '@/pcm/data/filter/rebel.json'
import soulful from '@/pcm/data/filter/soulful.json'

import caring from '@/pcm/data/channel/caring.json'
import directive from '@/pcm/data/channel/directive.json'
import emotional from '@/pcm/data/channel/emotional.json'
import interrupt from '@/pcm/data/channel/interrupt.json'
import question from '@/pcm/data/channel/question.json'

import comforter from '@/pcm/data/personality/comforter.json'
import computer from '@/pcm/data/personality/computer.json'
import director from '@/pcm/data/personality/director.json'
import emoter from '@/pcm/data/personality/emoter.json'
import protector from '@/pcm/data/personality/protector.json'

import autocratic from '@/pcm/data/interaction/autocratic.json'
import benevolent from '@/pcm/data/interaction/benevolent.json'
import democratic from '@/pcm/data/interaction/democratic.json'
import free from '@/pcm/data/interaction/free.json'
import individualized from '@/pcm/data/interaction/individualized.json'

type PcmData = Record<string, unknown>
type FilterName = 'logic' | 'persistent' | 'soulful' | 'dreamer' | 'rebel' | 'activist'

export default class PCM {
  getFilter(): Promise<PcmData[]> {
    return Promise.resolve([logic, persistent, soulful, dreamer, rebel, activist])
  }

  getFilterByName(name: FilterName): Promise<PcmData> {
    const items = {logic, persistent, soulful, dreamer, rebel, activist}
    const item = items[name]

    if (item === undefined) {
      return Promise.reject(`Name ${name} is invalid`)
    }

    return Promise.resolve(item)
  }

  getChannel(): Promise<PcmData[]> {
    return Promise.resolve([directive, caring, emotional, question, interrupt])
  }

  getPersonality(): Promise<PcmData[]> {
    return Promise.resolve([comforter, computer, director, emoter, protector])
  }

  getInteraction(): Promise<PcmData[]> {
    return Promise.resolve([autocratic, benevolent, democratic, free, individualized])
  }
}
