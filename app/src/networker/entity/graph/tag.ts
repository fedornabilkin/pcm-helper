import MainEntity from "../../../core/builder/mainEntity";

import {createUid} from "@/core/id/uid";

export class Tag extends MainEntity {
  id: number = 0
  uid: string = createUid()
  name: string = ''
  group: string = ''
  color: string = ''

}
