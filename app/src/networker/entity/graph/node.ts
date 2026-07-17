import MainEntity from "../../../core/builder/mainEntity";
import {Fact} from "./Fact";
import {PcmEntity} from "./pcm";
import {Link} from "./link";
import {Tag} from "./tag";
import type {NodeTypeCode} from "./nodeType";

import {createUid} from "@/core/id/uid";

export class Node extends MainEntity{
  id: number|undefined = undefined;
  uid: string = createUid()
  name: string = ''
  description: string = ''
  nodeType: NodeTypeCode | null = null
  facts: Fact[] = []
  tags: number[] = []
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
  strokeWidth: number = 2
  fillMain: string = '#078a76'
  strokeActive: string = '#f40404'
  active: boolean = false

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

  toggleActive() {
    this.active = !this.active
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

  isMyTag(tag: Tag, cb: any): boolean {
    if(this.tags.includes(tag.id)){
      cb(tag.id)
      return true
    }
    return false
  }

  getFontSize(): number {
    return !this.active ? 16 : this.r * 2
  }

  getFill(): string {
    return this.fill
  }

  getStroke(): string {
    return !this.active ? this.fill : this.strokeActive
  }

  getStrokeWidth(): string {
    return !this.active ? this.strokeWidth : this.strokeWidth * 5
  }

  getPosition(): any {
    return {x: this.x, y: this.y}
  }

  getRadius(): number {
    return !this.active ? this.r : this.r * 2.5
  }
}
