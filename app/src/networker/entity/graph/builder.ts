import MainBuilder from "../../../core/builder/mainBuilder.ts";
import { Node } from './node.ts';
import { Link } from './link.ts';
import { FunctionalCircle } from './functionalCircle.ts';
import {Network} from "./network.ts";

export class NodeBuilder extends MainBuilder {
  entity: Node = new Node()

  createEntity(): Node {
    return new Node();
  }

  build(data: any) {
    super.build(data);
    this.entity.id = data.id
    this.entity.name = data.name
    this.entity.description = data.description

    this.entity.fixed = data.fixed || false
    this.entity.fx = data.fx
    this.entity.fy = data.fy
    if (data.fill) {
      this.entity.fill = data.fill
    }
  }
}

export class LinkBuilder extends MainBuilder {
  entity: Link = new Link()

  createEntity(): Link {
    return new Link();
  }

  build(data: any) {
    super.build(data);
    this.entity.id = data.id
    this.entity.source = data.source
    this.entity.target = data.target
    this.entity.distance = data.distance
  }
}

export class CircleBuilder extends MainBuilder {
  entity: FunctionalCircle = new FunctionalCircle()

  createEntity(): FunctionalCircle {
    return new FunctionalCircle();
  }

  build(data: any) {
    super.build(data);
    this.entity.id = data.id
    this.entity.name = data.name
    this.entity.r = data.r
  }
}

export class NetworkBuilder extends MainBuilder {
  entity: Network = new Network()

  createEntity(): Network {
    return new Network();
  }

  build(data: any) {
    super.build(data);
    this.entity.id = data.id
    this.entity.name = data.name
  }
}