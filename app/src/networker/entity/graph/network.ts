import MainEntity from "../../../core/builder/mainEntity";

import {createUid} from "@/core/id/uid";

export class Network extends MainEntity {
  id: number = 0
  uid: string = createUid()
  name: string = ''

  constructor(config: any = {}) {
    super();
    Object.assign(this, config)
  }
}
