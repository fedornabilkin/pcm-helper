import {Node} from "../entity/graph/node.ts";
import {Fact} from "../entity/graph/Fact.ts";

interface IPosition {
  x: number, y: number, offsetX: number, offsetY: number
}

export class ToolTip {
  content: string
  position: IPosition = {x:0, y:0, offsetX: 10, offsetY: 10}

  constructor(config: any = {}) {
    Object.assign(this, config)
  }

  setPosition(x: number, y: number): void {
    this.position.x = x
    this.position.y = y
  }

  initPosition(): [] {
    const x: number = this.position.x + this.position.offsetX
    const y: number = this.position.y + this.position.offsetY
    return [x, y]
  }

  createContent(item: any): ToolTip {
    return this
  }

  getContent(): string {
    return this.content
  }

  clear(): void {
    this.content = ''
  }
}

export class NodeToolTip extends ToolTip {
  createContent(item: Node): ToolTip {
    super.createContent(item);

    this.content = `<strong>${item.getLabel()}</strong>`
    this.content += `<div class="facts">${this.getFacts(item.facts)}</div>`
    return this
  }

  getFacts(items: Fact[]): string {
    const arrReverse = []
    for (const fact of items) {
      arrReverse.unshift(fact)
    }

    let content: string = ''
    let cnt: number = 0
    for (const fact of arrReverse) {
      cnt++
      content += `<p>${fact.description}</p>`
      if (cnt >= 5) break
    }
    return content
  }
}