import MainBuilder from "../../../core/builder/mainBuilder";
import { Node } from './node';
import { Link } from './link';
import { FunctionalCircle } from './functionalCircle';
import {Network} from "./network";
import {Fact} from "./Fact";
import {PcmEntity} from "./pcm";
import {Tag} from "./tag";
import {createPcmHint} from "./pcmHint";

import {createUid} from "@/core/id/uid";
import type {FactDTO, FunctionalCircleDTO, GraphLinkDTO, GraphNodeDTO, PcmDTO, TagDTO} from "@/networker/graph/types";

interface NetworkDTO {
  id?: number;
  uid?: string;
  name?: string;
}

export class NodeBuilder extends MainBuilder<Node, GraphNodeDTO> {
  entity: Node = new Node()

  createEntity(): Node {
    return new Node();
  }

  build(data: GraphNodeDTO): void {
    super.build(data);
    this.entity.id = data.id
    this.entity.uid = data.uid ?? createUid()
    this.entity.name = data.name ?? ''
    this.entity.description = data.description ?? ''
    this.entity.nodeType = data.nodeType ?? null
    this.entity.pcmHint = createPcmHint(data.pcmHint)
    this.entity.facts = []

    this.entity.fixed = data.fixed || false
    this.entity.x = typeof data.x === 'number' ? data.x : this.entity.x
    this.entity.y = typeof data.y === 'number' ? data.y : this.entity.y
    this.entity.fx = data.fx ?? null
    this.entity.fy = data.fy ?? null
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

export class PcmBuilder extends MainBuilder<PcmEntity, PcmDTO> {
  entity: PcmEntity = new PcmEntity()

  createEntity(): PcmEntity {
    return new PcmEntity();
  }

  build(data: PcmDTO): void {
    super.build(data);
    this.entity.filter = data.filter
  }
}

export class LinkBuilder extends MainBuilder<Link, GraphLinkDTO> {
  entity: Link = new Link()

  createEntity(): Link {
    return new Link();
  }

  build(data: GraphLinkDTO): void {
    super.build(data);
    this.entity.id = data.id ?? 0
    this.entity.uid = data.uid ?? createUid()
    this.entity.source = data.source
    this.entity.target = data.target
    this.entity.distance = data.distance ?? this.entity.distance
    this.entity.status = data.status ?? false
    if (data.stroke) {
      this.entity.stroke = data.stroke
    }
    if (data.strokeWidth) {
      this.entity.strokeWidth = data.strokeWidth
    }
  }
}

export class CircleBuilder extends MainBuilder<FunctionalCircle, FunctionalCircleDTO> {
  entity: FunctionalCircle = new FunctionalCircle()

  createEntity(): FunctionalCircle {
    return new FunctionalCircle();
  }

  build(data: FunctionalCircleDTO): void {
    super.build(data);
    this.entity.id = data.id ?? 0
    this.entity.uid = data.uid ?? createUid()
    this.entity.nodeId = data.nodeId ?? 0
    this.entity.name = data.name ?? ''
    this.entity.r = data.r ?? this.entity.r
    if (data.fill) {
      this.entity.fill = data.fill
    }
    if (data.stroke) {
      this.entity.stroke = data.stroke
    }
  }
}

export class NetworkBuilder extends MainBuilder<Network, NetworkDTO> {
  entity: Network = new Network()

  createEntity(): Network {
    return new Network();
  }

  build(data: NetworkDTO): void {
    super.build(data);
    this.entity.id = data.id ?? 0
    this.entity.uid = data.uid ?? createUid()
    this.entity.name = data.name ?? ''
  }
}

export class FactBuilder extends MainBuilder<Fact, FactDTO> {
  entity: Fact = new Fact()

  createEntity(): Fact {
    return new Fact();
  }

  build(data: FactDTO): void {
    super.build(data);
    this.entity.id = data.id ?? 0
    this.entity.uid = data.uid ?? createUid()
    this.entity.description = data.description ?? ''
  }
}

export class TagBuilder extends MainBuilder<Tag, TagDTO> {
  entity: Tag = new Tag()

  createEntity(): Tag {
    return new Tag();
  }

  build(data: TagDTO): void {
    super.build(data);
    this.entity.id = data.id ?? 0
    this.entity.uid = data.uid ?? createUid()
    this.entity.name = data.name ?? ''
    this.entity.group = data.group ?? ''
    this.entity.color = data.color ?? ''
  }
}
