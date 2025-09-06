import MainEntity from "../../../core/builder/mainEntity.ts";
import {Fact} from "./Fact.ts";
import {PcmEntity} from "./pcm.ts";

export class Node extends MainEntity{
  id: number|undefined = undefined;
  name: string = ''
  description: string = ''
  facts: Fact[] = []
  pcm: PcmEntity;
  lead: boolean = false

  x: number = 150
  y: number = 150
  fixed: boolean = false
  fx: number|null;
  fy: number|null;
  r: number = 17
  fill: string = '#9eb6b1'
  stroke: string = '#86b3a9'
  fillMain: string = '#078a76'
  strokeMain: string = '#036c5c'

  getLabel(): string {
    return `${this.id} ${this.name}`
  }

  getName() {
    return this.name
  }

  isFixed(): boolean {
    return this.fixed
  }

  setPcm(pcm: PcmEntity): void {
    this.fill = pcm.filter.color
    this.pcm = pcm
  }

  isMain(): boolean {
    return this.id === 1
  }

  getFontSize(): number {
    return 12
  }

  getFill(): string {
    return this.fill
  }

  getStroke(): string {
    return this.stroke
  }

  getPosition(): any {
    return {x: this.x, y: this.y}
  }
}