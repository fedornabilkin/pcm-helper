export class pcmChannel {
  initiator = ''
  recipient = ''
  filter = {}
  title = ''
  description = ''
  example = {concept:[], good:[], bad:[]}

  constructor(config = {}) {
    Object.assign(this, config)
  }

  getExampleConcept() {
    return this.example.concept
  }

  getExampleGood() {
    return this.example.good
  }

  getExampleBad() {
    return this.example.bad
  }
}