export class pcmFilter {
  name = ''
  title = ''
  personalityType = ''
  img = {src:'', alt:''}
  keywords = []
  character = {strong:''}
  skill = ''
  color = {name:'', hex:'',bulmaName:''}
  perception = {short:''}
  use = {short:''}

  constructor(config = {}) {
    Object.assign(this, config)
  }

  getCharacter() {
    return this.character.strong
  }

  getPerception() {
    return this.perception.short
  }

  getUse() {
    return this.use.short
  }
}