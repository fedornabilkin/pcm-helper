import MainEntity from "../../../core/builder/mainEntity.ts";
import {Fact} from "./Fact.ts";
import {PcmEntity} from "./pcm.ts";
import {Link} from "./link.ts";

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

  isMyLink(link: Link, cb): boolean {
    const source = this.isMyLinkAsSource(link)
    const target = this.isMyLinkAsTarget(link)
    if (source) {cb(link.target.id)}
    if (target) {cb(link.source.id)}
    return source || target
  }

  isMyLinkAsSource(link: Link): boolean {
    return link.source.id === this.id
  }

  isMyLinkAsTarget(link: Link): boolean {
    return link.target.id === this.id
  }

  getFontSize(): number {
    return 12
  }

  getFill(): string {
    return this.fill
  }

  getStroke(): string {
    return this.fill
  }

  getPosition(): any {
    return {x: this.x, y: this.y}
  }

  getRadius(): number {
    return this.r
  }
}