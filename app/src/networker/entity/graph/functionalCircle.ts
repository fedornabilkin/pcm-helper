import MainEntity from "../../../core/builder/mainEntity";

import {createUid} from "@/core/id/uid";

export class FunctionalCircle extends MainEntity{
  id: number = 0
  uid: string = createUid()
  nodeId: number = 0
  name: string = ''

  r: number = 100
  x: number = 0
  y: number = 0
  fill: string = 'rgba(158,182,177,0.15)'
  stroke: string = 'rgba(158,182,177,0.25)'

  getFill(): string {
    return this.fill
  }

  getStroke(): string {
    return this.stroke
  }
}
