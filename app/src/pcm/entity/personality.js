export class pcmPersonality {
  name = ''
  title = ''
  gesture = ''
  pose = ''
  word = ''
  voice = ''
  face = ''

  constructor(config = {}) {
    Object.assign(this, config)
  }
}