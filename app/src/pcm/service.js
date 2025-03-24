import activist from '@/pcm/data/filter/activist.json'
import dreamer from '@/pcm/data/filter/dreamer.json'
import logic from '@/pcm/data/filter/logic.json'
import persistent from '@/pcm/data/filter/persistent.json'
import rebel from '@/pcm/data/filter/rebel.json'
import soulful from '@/pcm/data/filter/soulful.json'

export default class PCM {
  getFilters() {
    return new Promise((resolve, reject) => {
      resolve([logic, persistent, soulful, dreamer, rebel, activist])
    })
  }
}