import MainEntity from "../../../core/builder/mainEntity.ts";

export class Node extends MainEntity{
  id: number|undefined = undefined;
  name: string = ''
  description: string = ''
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

  isMain(): boolean {
    return this.id === 1
  }

  getFontSize(): number {
    return 12
  }

  getFill(): string {
    return this.isMain() ? this.fillMain : this.fill
  }

  getStroke(): string {
    return this.isMain() ? this.strokeMain : this.stroke
  }

  getPosition() {
    return {x: this.x, y: this.y}
  }
}