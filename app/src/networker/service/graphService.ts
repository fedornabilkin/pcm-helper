import {NodeBuilder, LinkBuilder, CircleBuilder, FactBuilder, TagBuilder} from "../entity/graph/builder";
import { Node } from "../entity/graph/node";
import { Link } from "../entity/graph/link";
import {Fact} from "../entity/graph/Fact";
import {Tag} from "../entity/graph/tag";
import {FunctionalCircle} from "../entity/graph/functionalCircle";
import {useGraphStore, type GraphStore} from "../composable/graphStore";
import { DataTransfer } from "../graph/dataTransfer";
import {MainService} from "./mainService";
import {IFileAdapter} from "./transfer/fileAdapter";
import type {
  FunctionalCircleCollection,
  FunctionalCircleDTO,
  GraphLinkCollection,
  GraphLinkDTO,
  GraphNodeCollection,
  GraphNodeDTO,
  TagCollection,
  TagDTO,
} from "@/networker/graph/types";
import {cloneDataTransfer} from "@/networker/service/transfer/networkFile";
import {
  checkFeatureAccess,
  checkLimitAccess,
  type AccessGuardResult,
} from "@/core/composable/access/premiumAccess";
import type {LocalStoreSaveResult} from "@/core/composable/store/localStore";

export interface GraphServiceConfig {
  storeId?: number;
  cbActiveNode?: (node: Node | undefined) => void;
}

type NewFunctionalCircle = Omit<FunctionalCircleDTO, 'id'> & {id?: number}
type NewTag = Omit<TagDTO, 'id'> & {id?: number}
const linkEndpointId = (endpoint: number | Node): number | undefined => {
  return typeof endpoint === 'number' ? endpoint : endpoint.id
}

const FUNCTIONAL_CIRCLE_PRESETS = [
  {name: 'support', label: 'Поддержка', r: 100, fillAlpha: 0.26, strokeAlpha: 0.55},
  {name: 'production', label: 'Продуктивность', r: 250, fillAlpha: 0.16, strokeAlpha: 0.38},
  {name: 'development', label: 'Развитие', r: 400, fillAlpha: 0.08, strokeAlpha: 0.24},
]

const DEFAULT_FUNCTIONAL_CIRCLE_COLOR = '#479df8'

export class GraphService extends MainService{
  private storeId: number = 0
  private nodeBuilder: NodeBuilder;
  private linkBuilder: LinkBuilder;
  private circleBuilder: CircleBuilder;
  private factBuilder: FactBuilder;
  private tagBuilder: TagBuilder;
  private graphStore: GraphStore;
  private fileAdapter?: IFileAdapter
  currentNode?: Node;

  nodes: GraphNodeCollection = [];
  links: GraphLinkCollection = [];
  tags: TagCollection = [];
  funcCircles: FunctionalCircleCollection = [];

  cbActiveNode: (node: Node | undefined) => void = () => {}

  constructor(config: GraphServiceConfig = {}) {
    super();
    this.storeId = config.storeId ?? 0
    this.cbActiveNode = config.cbActiveNode ?? this.cbActiveNode

    this.nodeBuilder = new NodeBuilder();
    this.linkBuilder = new LinkBuilder();
    this.circleBuilder = new CircleBuilder();
    this.factBuilder = new FactBuilder();
    this.tagBuilder = new TagBuilder();

    this.graphStore = useGraphStore(this.storeId);

    const storedNodes = this.graphStore.nodes.value
    const storedLinks = this.graphStore.links.value
    const storedCircles = this.graphStore.funcCircles.value
    const storedTags = this.graphStore.tags.value
    const needsUidMigration = [storedNodes, storedLinks, storedCircles, storedTags]
      .some(collection => collection.some((item: {uid?: string}) => !item.uid))

    this.importCollections(storedNodes, storedLinks, storedCircles, storedTags)

    if (needsUidMigration) {
      this.saveAll()
    }
  }

  importCollections(
    nodes: GraphNodeDTO[] = [],
    links: GraphLinkDTO[] = [],
    circles: FunctionalCircleDTO[] = [],
    tags: TagDTO[] = [],
  ): void {
    this.nodes = this.nodeBuilder.createCollection(nodes);
    this.links = this.linkBuilder.createCollection(links);
    this.funcCircles = this.circleBuilder.createCollection(circles);
    this.tags = this.tagBuilder.createCollection(tags);
    this.bindOrphanFunctionalCirclesToFirstNode()
  }

  private bindOrphanFunctionalCirclesToFirstNode(): void {
    const firstNodeId = this.nodes[0]?.id
    if (!firstNodeId) {
      return
    }

    this.funcCircles
      .filter(circle => !circle.nodeId)
      .forEach(circle => {
        circle.nodeId = firstNodeId
      })
  }

  setFileAdapter(adapter: IFileAdapter): this {
    this.fileAdapter = adapter
    return this
  }

  setStoreId(id: number): void {
    this.storeId = id
  }

  setCurrentNode(node?: Node): void {
    this.currentNode?.toggleActive()
    node?.toggleActive()
    this.currentNode = node
    this.cbActiveNode(node)
  }

  getCurrentNode(): Node | undefined {
    return this.currentNode
  }

  canAddNode(): boolean {
    return this.getNodeCreationAccess().success
  }

  getNodeCreationAccess(): AccessGuardResult {
    return checkLimitAccess('nodesPerNetwork', this.nodes.length)
  }

  addNode(name: string = ""): Node | undefined {
    if (!this.canAddNode()) {
      return undefined
    }
    this.nodeBuilder.build({ id: this.nextId(this.nodes), name });
    const node = this.nodeBuilder.getEntity();
    this.nodes.push(node);
    this.setCurrentNode(node)
    return node;
  }

  removeNode(node?: Node): void {
    if (!node) {
      return
    }

    const index = this.nodes.findIndex(n => n.id === node.id);
    if (index === -1) return;

    this.links
      .filter(l => linkEndpointId(l.source) === node.id || linkEndpointId(l.target) === node.id)
      .forEach(l => this.removeLink(l));

    this.nodes.splice(index, 1);
    this.setCurrentNode()
  }

  getNodesCount(): number {
    return this.nodes.length
  }

  addLink(target: Node, distance = 100): Link | undefined {
    if (!this.currentNode) return
    return this.addLinkBetween(this.currentNode, target, distance)
  }

  findLinkBetween(source: Node, target: Node): Link | undefined {
    return this.links.find(link => {
      return (linkEndpointId(link.source) === source.id && linkEndpointId(link.target) === target.id)
        || (linkEndpointId(link.source) === target.id && linkEndpointId(link.target) === source.id)
    })
  }

  addLinkBetween(source: Node, target: Node, distance = 100): Link | undefined {
    if (!source?.id || !target?.id || source.id === target.id) {
      return undefined
    }
    if (this.findLinkBetween(source, target)) {
      return undefined
    }
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

  addFuncCircle(props: NewFunctionalCircle): FunctionalCircle {
    this.circleBuilder.build(props);
    const circle = this.circleBuilder.getEntity();
    this.funcCircles.push(circle);
    return circle;
  }

  getNodeFuncCircles(node: Node): FunctionalCircle[] {
    if (!node?.id) {
      return []
    }

    return this.funcCircles.filter(circle => circle.nodeId === node.id)
  }

  canAddFuncCircle(node: Node): boolean {
    return this.getNodeFuncCircles(node).length < 3
  }

  addFuncCircleToNode(node: Node): FunctionalCircle | undefined {
    if (!node?.id || !this.canAddFuncCircle(node)) {
      return undefined
    }

    const nodeCircles = this.getNodeFuncCircles(node)
    const preset = FUNCTIONAL_CIRCLE_PRESETS[nodeCircles.length]
    const style = this.createFunctionalCircleStyle(DEFAULT_FUNCTIONAL_CIRCLE_COLOR, preset)

    return this.addFuncCircle({
      id: this.nextId(this.funcCircles),
      nodeId: node.id,
      name: preset.name,
      r: preset.r,
      ...style,
    })
  }

  setFuncCircleFill(circle: FunctionalCircle, color: string): void {
    if (!this.getFunctionalCircleCustomizationAccess().success) {
      return
    }

    const preset = this.getFuncCirclePreset(circle)
    const style = this.createFunctionalCircleStyle(color, preset)
    circle.fill = style.fill
    circle.stroke = style.stroke
  }

  getFuncCircleLabel(circle: FunctionalCircle): string {
    return this.getFuncCirclePreset(circle).label
  }

  getFuncCircleColor(circle: FunctionalCircle): string {
    const match = circle.fill.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      return this.rgbToHex(Number(match[1]), Number(match[2]), Number(match[3]))
    }

    return circle.fill.startsWith('#') && circle.fill.length === 7
      ? circle.fill
      : DEFAULT_FUNCTIONAL_CIRCLE_COLOR
  }

  private getFuncCirclePreset(circle: FunctionalCircle): typeof FUNCTIONAL_CIRCLE_PRESETS[number] {
    return FUNCTIONAL_CIRCLE_PRESETS.find(preset => preset.name === circle.name || preset.r === circle.r)
      ?? FUNCTIONAL_CIRCLE_PRESETS[0]
  }

  private createFunctionalCircleStyle(color: string, preset: typeof FUNCTIONAL_CIRCLE_PRESETS[number]): {fill: string; stroke: string} {
    const rgb = this.hexToRgb(color) ?? {r: 71, g: 157, b: 248}

    return {
      fill: `rgba(${rgb.r},${rgb.g},${rgb.b},${preset.fillAlpha})`,
      stroke: `rgba(${rgb.r},${rgb.g},${rgb.b},${preset.strokeAlpha})`,
    }
  }

  private hexToRgb(color: string): {r: number; g: number; b: number} | undefined {
    const value = color.replace('#', '')
    if (!/^[\da-f]{6}$/i.test(value)) {
      return undefined
    }

    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    }
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('')}`
  }

  removeFuncCircle(circleId: string | number): void {
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

  canAddTag(): boolean {
    return this.getTagCreationAccess().success
  }

  getTagCreationAccess(): AccessGuardResult {
    return checkLimitAccess('tagsPerNetwork', this.tags.length)
  }

  getFunctionalCircleCustomizationAccess(): AccessGuardResult {
    return checkFeatureAccess('customFunctionalCircles')
  }

  addTag(tag: NewTag): Tag | undefined {
    if (!this.canAddTag()) {
      return undefined
    }
    tag.id = this.nextId(this.tags)
    this.tagBuilder.build(tag);
    const entity = this.tagBuilder.getEntity();
    this.tags.push(entity);
    return entity;
  }

  removeTag(tag: Tag): void {
    const index = this.tags.findIndex(t => t.id === tag.id);
    if (index !== -1) {
      this.tags.splice(index, 1);
    }

    this.nodes.forEach(node => {
      node.tags = node.tags.filter(id => id !== tag.id)
    })
  }

  bindTag(tag: Tag, node: Node): void {
    if (node.tags.includes(tag.id)) {
      return
    }

    node.tags.push(tag.id)
  }

  unbindTag(tag: Tag, node: Node): void {
    node.tags = node.tags.filter(id => id !== tag.id)
  }

  toDTO(): DataTransfer {
    return new DataTransfer({
      nodes: this.nodes,
      links: this.links,
      circles: this.funcCircles,
      tags: this.tags,
    });
  }

  fromDTO(dto: DataTransfer): void {
    this.importCollections(dto.nodes, dto.links, dto.circles, dto.tags)
  }

  applyDTOAtomic(dto: DataTransfer): void {
    const backup = cloneDataTransfer(this.toDTO())

    try {
      this.fromDTO(cloneDataTransfer(dto))
      const saveResult = this.saveAll()
      if (!saveResult.success) {
        throw new Error('Не удалось сохранить изменения в браузере.')
      }
    } catch (error) {
      this.fromDTO(backup)
      this.saveAll()
      throw error
    }
  }

  saveAll(): LocalStoreSaveResult {
    this.graphStore.nodes.value = this.nodes;
    this.graphStore.links.value = this.links;
    this.graphStore.funcCircles.value = this.funcCircles;
    this.graphStore.tags.value = this.tags;
    return this.graphStore.saveAll();
  }

  getStorageRecoveryBackup(): unknown | undefined {
    return this.graphStore.getRecoveryBackup()
  }

  allowStorageRecoveryOverwrite(): void {
    this.graphStore.allowRecoveryOverwrite()
  }

  export(): string | ArrayBuffer {
    if (!this.fileAdapter) {
      throw new Error('Адаптер экспорта не настроен.')
    }
    return this.fileAdapter.export(this.toDTO());
  }

  import(data: string | ArrayBuffer): void {
    if (!this.fileAdapter) {
      throw new Error('Адаптер импорта не настроен.')
    }
    const dto = this.fileAdapter.import(data);
    this.applyDTOAtomic(dto);
  }

  // clearAll(): void {
  //   this.graphStore.clearAll();
  //   this.nodes = [];
  //   this.links = [];
  //   this.funcCircles = [];
  // }

}
