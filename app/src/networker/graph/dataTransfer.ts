import type {GraphLinkDTO, GraphNodeDTO, FunctionalCircleDTO, NetworkGraphDTO, TagDTO} from "@/networker/graph/types";

export class DataTransfer {
  circles: FunctionalCircleDTO[] = []
  nodes: GraphNodeDTO[] = []
  links: GraphLinkDTO[] = []
  tags: TagDTO[] = []

  constructor(config: NetworkGraphDTO = {}) {
    Object.assign(this, config)
  }

  getCircles(): FunctionalCircleDTO[] {
    return this.circles
  }

  getNodes(): GraphNodeDTO[] {
    return this.nodes
  }

  getLinks(): GraphLinkDTO[] {
    return this.links
  }

  getTags(): TagDTO[] {
    return this.tags
  }
}
