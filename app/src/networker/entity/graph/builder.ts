import MainBuilder from "../../../core/builder/mainBuilder.ts";
import { Node } from './node.ts';
import { Link } from './link.ts';
import { FunctionalCircle } from './functionalCircle.ts';
import {Network} from "./network.ts";
import {Fact} from "./Fact.ts";
import {PcmEntity} from "./pcm.ts";

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
    this.entity.facts = []

    this.entity.fixed = data.fixed || false
    this.entity.fx = data.fx
    this.entity.fy = data.fy
    if (data.fill) {
      this.entity.fill = data.fill
    }

    if (data.facts) {
      const factBuilder = new FactBuilder()
      this.entity.facts = factBuilder.createCollection(data.facts)
    }

    if (data.pcm) {
      const pcmBuilder = new PcmBuilder()
      pcmBuilder.build(data.pcm)
      this.entity.setPcm(pcmBuilder.getEntity())
    }
  }
}

export class PcmBuilder extends MainBuilder {
  entity: PcmEntity = new PcmEntity()

  createEntity(): PcmEntity {
    return new PcmEntity();
  }

  build(data: any) {
    super.build(data);
    this.entity.filter = data.filter
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
    this.entity.status = data.status
    if (data.stroke) {
      this.entity.stroke = data.stroke
    }
    if (data.strokeWidth) {
      this.entity.strokeWidth = data.strokeWidth
    }
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

export class FactBuilder extends MainBuilder {
  entity: Fact = new Fact()

  createEntity(): Fact {
    return new Fact();
  }

  build(data: any) {
    super.build(data);
    this.entity.id = data.id
    this.entity.description = data.description
  }
}