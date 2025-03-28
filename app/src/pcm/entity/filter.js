export class pcmFilter {
  name = ''
  title = ''
  personalityType = ''
  img = {src:'', alt:''}
  keywords = []
  verb = []
  noun = []
  adjective = []
  character = {strong:''}
  skill = ''
  face = ''
  color = {name:'', hex:'',bulmaName:''}
  perception = {short:''}
  use = {short:''}

  constructor(config = {}) {
    Object.assign(this, config)
  }

  getVerb() {
    return this.verb
  }

  getNoun() {
    return this.noun
  }

  getAdjective() {
    return this.adjective
  }

  getCharacter() {
    return this.character.strong
  }

  getFace() {
    return this.face
  }

  getPerception() {
    return this.perception.short
  }

  getUse() {
    return this.use.short
  }

  tagBackground() {
    return 'is-' + this.color.bulmaName
  }

  textColor() {
    return 'has-text-' + this.color.bulmaName
  }
}