import {Node} from "../entity/graph/node";
import {Fact} from "../entity/graph/Fact";

interface IPosition {
  x: number, y: number, offsetX: number, offsetY: number
}

export class ToolTip {
  content = ''
  position: IPosition = {x:0, y:0, offsetX: 10, offsetY: 10}

  constructor(config: Partial<Pick<ToolTip, 'content' | 'position'>> = {}) {
    if (config.content !== undefined) {
      this.content = config.content
    }
    if (config.position) {
      this.position = {...this.position, ...config.position}
    }
  }

  setPosition(x: number, y: number): void {
    this.position.x = x
    this.position.y = y
  }

  initPosition(): [number, number] {
    const x: number = this.position.x + this.position.offsetX
    const y: number = this.position.y + this.position.offsetY
    return [x, y]
  }

  createContent(_item: unknown): ToolTip {
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
