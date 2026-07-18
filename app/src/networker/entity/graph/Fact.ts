import MainEntity from "../../../core/builder/mainEntity";

import {createUid} from "@/core/id/uid";

export class Fact extends MainEntity {
  id: number = 0
  uid: string = createUid()
  description: string = ''
}
