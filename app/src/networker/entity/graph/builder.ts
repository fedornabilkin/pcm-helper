import MainBuilder from "../../../core/builder/mainBuilder";
import { Node } from './node';
import { Link } from './link';
import { FunctionalCircle } from './functionalCircle';
import {Network} from "./network";
import {Fact} from "./Fact";
import {PcmEntity} from "./pcm";
import {Tag} from "./tag";

import {createUid} from "@/core/id/uid";

export class NodeBuilder extends MainBuilder {
  entity: Node = new Node()

  createEntity(): Node {
    return new Node();
  }

  build(data: any) {
    super.build(data);
    this.entity.id = data.id
    this.entity.uid = data.uid ?? createUid()
    this.entity.name = data.name
    this.entity.description = data.description
    this.entity.nodeType = data.nodeType ?? null
    this.entity.facts = []

    this.entity.fixed = data.fixed || false
    this.entity.x = typeof data.x === 'number' ? data.x : this.entity.x
    this.entity.y = typeof data.y === 'number' ? data.y : this.entity.y
    this.entity.fx = data.fx
    this.entity.fy = data.fy
    this.entity.r = typeof data.r === 'number' ? data.r : this.entity.r
    if (data.fill) {
      this.entity.fill = data.fill
    }
    if (data.stroke) {
      this.entity.stroke = data.stroke
    }
    if (typeof data.strokeWidth === 'number') {
      this.entity.strokeWidth = data.strokeWidth
    }
    if (data.tags) {
      this.entity.tags = data.tags
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
    this.entity.uid = data.uid ?? createUid()
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
    this.entity.uid = data.uid ?? createUid()
    this.entity.nodeId = data.nodeId
    this.entity.name = data.name
    this.entity.r = data.r
    if (data.fill) {
      this.entity.fill = data.fill
    }
    if (data.stroke) {
      this.entity.stroke = data.stroke
    }
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
    this.entity.uid = data.uid ?? createUid()
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
    this.entity.uid = data.uid ?? createUid()
    this.entity.description = data.description
  }
}

export class TagBuilder extends MainBuilder {
  entity: Tag = new Tag()

  createEntity(): Tag {
    return new Tag();
  }

  build(data: any) {
    super.build(data);
    this.entity.id = data.id
    this.entity.uid = data.uid ?? createUid()
    this.entity.name = data.name
    this.entity.group = data.group
    this.entity.color = data.color
  }
}
