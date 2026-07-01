import type {GraphLinkDTO, GraphNodeDTO, FunctionalCircleDTO, NetworkGraphDTO} from "@/networker/graph/types";

export class DataTransfer {
  circles: FunctionalCircleDTO[] = []
  nodes: GraphNodeDTO[] = []
  links: GraphLinkDTO[] = []

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
}
