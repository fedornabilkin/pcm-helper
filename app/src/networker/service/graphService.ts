import {NodeBuilder, LinkBuilder, CircleBuilder} from "../entity/graph/builder";
import { Node } from "../entity/graph/node";
import { Link } from "../entity/graph/link";
import { useGraphStore } from "../composable/graphStore.ts";
import { DataTransfer } from "../graph/dataTransfer.ts";
import {MainService} from "./mainService.ts";

export class GraphService extends MainService{
  private storeId: number = 0
  private nodeBuilder: NodeBuilder;
  private linkBuilder: LinkBuilder;
  private circleBuilder: CircleBuilder;
  private graphStore: any;

  nodes: Node[] = [];
  links: Link[] = [];
  funcCircles: any[] = [];

  constructor(config: any = {}) {
    super();
    Object.assign(this, config)

    this.nodeBuilder = new NodeBuilder();
    this.linkBuilder = new LinkBuilder();
    this.circleBuilder = new CircleBuilder();

    this.graphStore = useGraphStore(this.storeId);

    this.nodes = this.nodeBuilder.createCollection(this.graphStore.nodes.value);
    this.links = this.linkBuilder.createCollection(this.graphStore.links.value);
    this.funcCircles = this.circleBuilder.createCollection(this.graphStore.funcCircles.value);
  }

  setStoreId(id: number): void {
    this.storeId = id
  }

  addNode(name: string = ""): Node {
    this.nodeBuilder.build({ id: this.nextId(this.nodes), name });
    const node = this.nodeBuilder.getEntity();
    this.nodes.push(node);
    return node;
  }

  removeNode(node: Node): void {
    const index = this.nodes.findIndex(n => n.id === node.id);
    if (index === -1) return;

    this.links
      .filter(l => l.source.id === node.id || l.target.id === node.id)
      .forEach(l => this.removeLink(l));

    this.nodes.splice(index, 1);
  }

  addLink(source: Node, target: Node, distance = 100): Link {
    this.linkBuilder.build({
      id: this.nextId(this.links), source, target, distance,
    });
    const link = this.linkBuilder.getEntity();
    this.links.push(link);
    return link;
  }

  removeLink(link: Link): void {
    const index = this.links.findIndex(l => l.id === link.id);
    if (index !== -1) this.links.splice(index, 1);
  }

  addFuncCircle(props: any) {
    this.circleBuilder.build(props);
    const circle = this.circleBuilder.getEntity();
    this.funcCircles.push(circle);
    return circle;
  }

  removeFuncCircle(circleId: string | number) {
    const index = this.funcCircles.findIndex(c => c.id === circleId);
    if (index !== -1) this.funcCircles.splice(index, 1);
  }

  toDTO(): DataTransfer {
    return new DataTransfer({
      nodes: this.nodes,
      links: this.links,
      circles: this.funcCircles,
    });
  }

  saveAll(): void {
    this.graphStore.nodes.value = this.nodes;
    this.graphStore.links.value = this.links;
    this.graphStore.funcCircles.value = this.funcCircles;
    this.graphStore.saveAll();
  }

  // clearAll(): void {
  //   this.graphStore.clearAll();
  //   this.nodes = [];
  //   this.links = [];
  //   this.funcCircles = [];
  // }

}
