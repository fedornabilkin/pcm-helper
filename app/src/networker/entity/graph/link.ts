import MainEntity from "../../../core/builder/mainEntity.ts";
import {Node} from "./node.ts";

export class Distance {
  support: any = {}
  production: any = {}
  evolution: any = {}
  oblivion: any = {}
}

export class Link extends MainEntity{
  id: number
  source: number|Node = 0
  target: number|Node = 0
  // distance: Distance = new Distance()

  distance: number = 150
  stroke: string = '#aaa'
  strokeWidth: number = 1
  status: boolean = false

  getStroke(): string {
    return this.stroke
  }

  getStrokeWidth(): number {
    return this.status ? this.strokeWidth + 5 : this.strokeWidth
  }

  toJSON() {
    const data: any = { ...this };

    if (this.source && this.source.id) {
      data.source = this.source.id;
    }
    if (this.target && this.target.id) {
      data.target = this.target.id;
    }

    return data;
  }
}