import MainEntity from "../../../core/builder/mainEntity.ts";

export class Network extends MainEntity {
  id: number = ''
  name: string = ''

  constructor(config: any = {}) {
    super();
    Object.assign(this, config)
  }
}