import { Link } from '../entity/graph/link.ts';
import { Node } from '../entity/graph/node.ts';
import { FunctionalCircle } from '../entity/graph/functionalCircle.ts';

export class DataTransfer {
  circles: FunctionalCircle[] = []
  nodes: Node[] = []
  links: Link[] = []

  constructor(config: any = {}) {
    Object.assign(this, config)
  }

  getCircles(): FunctionalCircle[] {
    return this.circles
  }

  getNodes(): Node[] {
    return this.nodes
  }

  getLinks(): Link[] {
    return this.links
  }
}