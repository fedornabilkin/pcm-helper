export class DataTransfer {
  circles: any = []
  nodes: any = []
  links: any = []

  constructor(config: any = {}) {
    Object.assign(this, config)
  }

  getCircles(): any {
    return this.circles
  }

  getNodes(): any {
    return this.nodes
  }

  getLinks(): any {
    return this.links
  }
}