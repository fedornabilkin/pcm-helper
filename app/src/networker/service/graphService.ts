import {NodeBuilder, LinkBuilder, CircleBuilder, FactBuilder, TagBuilder} from "../entity/graph/builder";
import { Node } from "../entity/graph/node";
import { Link } from "../entity/graph/link";
import {Fact} from "../entity/graph/Fact.ts";
import {Tag} from "../entity/graph/tag.ts";
import { useGraphStore } from "../composable/graphStore.ts";
import { DataTransfer } from "../graph/dataTransfer.ts";
import {MainService} from "./mainService.ts";
import {IFileAdapter} from "./transfer/fileAdapter.ts";

export class GraphService extends MainService{
  private storeId: number = 0
  private nodeBuilder: NodeBuilder;
  private linkBuilder: LinkBuilder;
  private circleBuilder: CircleBuilder;
  private factBuilder: FactBuilder;
  private tagBuilder: TagBuilder;
  private graphStore: any;
  private fileAdapter: IFileAdapter
  currentNode: Node;
  private currentFact: Fact;

  nodes: Node[] = [];
  links: Link[] = [];
  tags: Tag[] = [];
  funcCircles: any[] = [];

  cbActiveNode = (node: Node) => {}

  constructor(config: any = {}) {
    super();
    Object.assign(this, config)

    this.nodeBuilder = new NodeBuilder();
    this.linkBuilder = new LinkBuilder();
    this.circleBuilder = new CircleBuilder();
    this.factBuilder = new FactBuilder();
    this.tagBuilder = new TagBuilder();

    this.graphStore = useGraphStore(this.storeId);

    this.importCollections(
      this.graphStore.nodes.value,
      this.graphStore.links.value,
      this.graphStore.funcCircles.value,
      this.graphStore.tags.value
    )
  }

  importCollections(nodes, links, circles, tags): void {
    this.nodes = this.nodeBuilder.createCollection(nodes);
    this.links = this.linkBuilder.createCollection(links);
    this.funcCircles = this.circleBuilder.createCollection(circles);
    this.tags = this.tagBuilder.createCollection(tags);
  }

  setFileAdapter(adapter: IFileAdapter): this {
    this.fileAdapter = adapter
    return this
  }

  setStoreId(id: number): void {
    this.storeId = id
  }

  setCurrentNode(node: Node|undefined): void {
    this.currentNode?.toggleActive()
    node?.toggleActive()
    this.currentNode = node
    this.cbActiveNode(node)
  }

  getCurrentNode(): Node {
    return this.currentNode
  }

  addNode(name: string = ""): Node {
    this.nodeBuilder.build({ id: this.nextId(this.nodes), name });
    const node = this.nodeBuilder.getEntity();
    this.nodes.push(node);
    this.setCurrentNode(node)
    return node;
  }

  removeNode(node: Node): void {
    const index = this.nodes.findIndex(n => n.id === node.id);
    if (index === -1) return;

    this.links
      .filter(l => l.source.id === node.id || l.target.id === node.id)
      .forEach(l => this.removeLink(l));

    this.nodes.splice(index, 1);
    this.setCurrentNode()
  }

  getNodesCount(): number {
    return this.nodes.length
  }

  addLink(target: Node, distance = 100): Link {
    if (!this.currentNode) return
    this.linkBuilder.build({
      id: this.nextId(this.links), source: this.currentNode, target, distance,
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

  addFact(node: Node): Fact {
    this.factBuilder.build({ id: this.nextId(node.facts)});
    const fact = this.factBuilder.getEntity();
    node.facts.push(fact);
    return fact;
  }

  removeFact(node: Node, fact: Fact): void {
    const index = node.facts.findIndex(f => f.id === fact.id);
    if (index !== -1) node.facts.splice(index, 1);
  }

  addTag(tag: any): Tag {
    tag.id = this.nextId(this.tags)
    this.tagBuilder.build(tag);
    const entity = this.tagBuilder.getEntity();
    this.tags.push(entity);
    return entity;
  }

  removeTag(tag: Tag) {
    const index = this.tags.findIndex(t => t.id === tag.id);
    if (index !== -1) {
      this.tags.splice(index, 1);
    }
  }

  bindTag(tag: Tag, node: Node) {
    node.tags.push(tag.id)
  }

  unbindTag(tag: Tag, node: Node) {
    node.tags = node.tags.filter(id => id !== tag.id)
  }

  toDTO(): DataTransfer {
    return new DataTransfer({
      nodes: this.nodes,
      links: this.links,
      circles: this.funcCircles,
    });
  }

  fromDTO(dto: DataTransfer): void {
    this.importCollections(dto.nodes, dto.links, dto.circles)
  }

  saveAll(): void {
    this.graphStore.nodes.value = this.nodes;
    this.graphStore.links.value = this.links;
    this.graphStore.funcCircles.value = this.funcCircles;
    this.graphStore.tags.value = this.tags;
    this.graphStore.saveAll();
  }

  export(): string | ArrayBuffer {
    return this.fileAdapter.export(this.toDTO());
  }

  import(data: string | ArrayBuffer): void {
    const dto = this.fileAdapter.import(data);
    this.fromDTO(dto);
  }

  // clearAll(): void {
  //   this.graphStore.clearAll();
  //   this.nodes = [];
  //   this.links = [];
  //   this.funcCircles = [];
  // }

}
