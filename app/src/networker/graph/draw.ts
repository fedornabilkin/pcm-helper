import * as d3 from 'd3';
import { DataTransfer } from './dataTransfer';
import { FunctionalCircle } from '../entity/graph/functionalCircle';
import { Link } from '../entity/graph/link';
import { Node } from '../entity/graph/node';
import {getNodeTypeOption} from '../entity/graph/nodeType';
import {ToolTip} from "./toolTip";

type SimulatedLink = Omit<Link, 'source' | 'target'> & {source: Node; target: Node}
type NodeSelection = d3.Selection<SVGCircleElement, Node, SVGGElement, unknown>
type LinkSelection = d3.Selection<SVGLineElement, SimulatedLink, SVGGElement, unknown>
type CircleSelection = d3.Selection<SVGCircleElement, FunctionalCircle, SVGGElement, unknown>
type LabelSelection = d3.Selection<SVGTextElement, Node, SVGGElement, unknown>
type NodeBadgeSelection = d3.Selection<SVGGElement, Node, SVGGElement, unknown>
type GroupSelection = d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>

interface GraphBox {
  w: number;
  h: number;
  html?: {element?: HTMLElement | null; class?: string};
}

interface DrawNetworkConfig {
  dto?: DataTransfer;
  box?: Partial<GraphBox>;
  toolTip?: ToolTip;
  clickNode?: (event: MouseEvent, node: Node) => void;
  clickLink?: (event: MouseEvent, link: Link) => void;
  cbSimulationEnd?: () => void;
}

export class DrawNetwork {
  box: GraphBox = {
    w: 800,
    h: 600,
    html: { element: null, class: '' },
  };
  dto: DataTransfer = new DataTransfer();
  scope: Record<number, {circle: {x: number; y: number}}> = {};

  scale = {min: 0.05, max: 5}

  divElement!: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  container!: GroupSelection;
  graph!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodesGroup!: GroupSelection;
  linksGroup!: GroupSelection;
  funcCirclesGroup!: GroupSelection;
  nodeTypeBadgesGroup!: GroupSelection;
  labelsGroup!: GroupSelection;
  nodes?: NodeSelection;
  links?: LinkSelection;
  funcCircles?: CircleSelection;
  nodeTypeBadges?: NodeBadgeSelection;
  labels?: LabelSelection;
  simulation?: d3.Simulation<Node, SimulatedLink>;

  toolTipBox!: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  toolTip: ToolTip;
  activeTagId: number | null = null;
  searchHighlightedNodeIds: Set<number> = new Set();
  linkActionSourceNodeId: number | null = null;
  linkEditMode = false;

  clickNode: (event: MouseEvent, node: Node) => void = () => {}
  clickLink: (event: MouseEvent, link: Link) => void = () => {}
  cbSimulationEnd = () => {}

  constructor(config: DrawNetworkConfig = {}) {
    this.dto = config.dto ?? this.dto
    this.box = {...this.box, ...config.box, html: {...this.box.html, ...config.box?.html}}
    this.toolTip = config.toolTip ?? new ToolTip()
    this.clickNode = config.clickNode ?? this.clickNode
    this.clickLink = config.clickLink ?? this.clickLink
    this.cbSimulationEnd = config.cbSimulationEnd ?? this.cbSimulationEnd
  }

  private getNodes(): Node[] {
    return this.dto.getNodes() as Node[]
  }

  private getLinks(): SimulatedLink[] {
    return this.dto.getLinks() as SimulatedLink[]
  }

  private getCircles(): FunctionalCircle[] {
    return this.dto.getCircles() as FunctionalCircle[]
  }

  render(element: HTMLElement) {
    this.drawContainer(element)
      .drawGraph().initToolTip()

    this.funcCirclesGroup = this.container.append('g').attr('class', 'functional-circle') as GroupSelection
    this.linksGroup = this.container.append('g').attr('class', 'links') as GroupSelection
    this.nodesGroup = this.container.append('g').attr('class', 'nodes') as GroupSelection
    this.nodeTypeBadgesGroup = this.container.append('g').attr('class', 'node-type-badges') as GroupSelection
    this.labelsGroup = this.container.append('g').attr('class', 'label') as GroupSelection

    this.simulationInit()
      .drawFunctionalCircle().drawLink().drawNode().drawNodeTypeBadge().drawLabel()

    this.simulation!.on("tick", () => this.drawTick())
    this.simulation!.on("end", () => this.drawEnd())
  }

  reRender() {
    if (this.simulation) {
      this.drawFunctionalCircle().drawLink().drawNode().drawNodeTypeBadge().drawLabel()

      this.simulation.nodes(this.getNodes())
      const linkForce = this.simulation.force('link') as d3.ForceLink<Node, SimulatedLink>
      linkForce.links(this.getLinks())
      this.simulation.alpha(1).restart()
      // this.simulation.alphaTarget(1).restart()
    }
  }

  setActiveTagId(tagId: number | null): this {
    this.activeTagId = tagId
    this.refreshTagHighlight()
    return this
  }

  isNodeInActiveTag(node: Node): boolean {
    return this.activeTagId !== null && node.tags.includes(this.activeTagId)
  }

  setSearchHighlightedNodeIds(nodeIds: Iterable<number>): this {
    this.searchHighlightedNodeIds = new Set(nodeIds)
    this.refreshSearchHighlight()
    return this
  }

  isNodeSearchHighlighted(node: Node): boolean {
    return node.id !== undefined && this.searchHighlightedNodeIds.has(node.id)
  }

  setLinkActionSourceNodeId(nodeId: number | null): this {
    this.linkActionSourceNodeId = nodeId
    this.refreshLinkActionHighlight()
    return this
  }

  setLinkEditMode(enabled: boolean): this {
    this.linkEditMode = enabled
    this.links?.classed('is-link-editable', enabled)
    return this
  }

  isLinkActionSource(node: Node): boolean {
    return node.id !== undefined && node.id === this.linkActionSourceNodeId
  }

  refreshTagHighlight(): void {
    if (!this.nodes) {
      return
    }

    this.nodes.classed(
      'is-tag-highlighted',
      (d: Node): boolean => this.isNodeInActiveTag(d),
    )
  }

  refreshSearchHighlight(): void {
    if (!this.nodes) {
      return
    }

    this.nodes.classed(
      'is-search-highlighted',
      (d: Node): boolean => this.isNodeSearchHighlighted(d),
    )
  }

  refreshLinkActionHighlight(): void {
    if (!this.nodes) {
      return
    }

    this.nodes.classed(
      'is-link-action-source',
      (d: Node): boolean => this.isLinkActionSource(d),
    )
  }

  drawContainer(element: HTMLElement): this {
    this.divElement = d3.select(element)
      .insert('div', ':first-child')
      .attr('class', this.box.html?.class ?? 'graph-container')
      .style('width', this.box.w + 'px')
      .style('height', this.box.h + 'px')
      .style('background', 'var(--app-graph-background)')
    return this;
  }

  zoom(): d3.ZoomBehavior<SVGSVGElement, unknown> {
    return d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([this.scale.min, this.scale.max])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        this.container.attr("transform", event.transform.toString());
      })
  }

  initToolTip (): this {
    this.toolTipBox = this.divElement.append('div')
      .classed('tooltip', true)
      .style('display', 'none')
      .style('pointer-events', 'none')
      .style('position', 'fixed')
      .style('z-index', '100') as typeof this.toolTipBox
    return this
  }

  drawGraph(): this {
    const graph = this.divElement.append('svg')
      .attr('width', this.box.w + 'px')
      .attr('height', this.box.h + 'px')
    this.graph = graph as typeof this.graph

    this.container = this.graph.append('g').attr('class', 'zoom-container') as GroupSelection
    this.graph.call(this.zoom())
    return this;
  }

  drawFunctionalCircle(): this {
    this.funcCircles = this.funcCirclesGroup
      .selectAll<SVGCircleElement, FunctionalCircle>('circle')
      .data(this.getCircles(), d => `${d.id}-${d.name}`)
      .join('circle')
      .attr('r', (d: FunctionalCircle): number => d.r)
      .style("fill", (d: FunctionalCircle): string => d.getFill())
      .style("stroke", (d: FunctionalCircle): string => d.getStroke())
    return this;
  }

  drag(simulation: d3.Simulation<Node, SimulatedLink>): d3.DragBehavior<SVGCircleElement, Node, Node> {
    const dragStart = (e: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node): void => {
      if (!e.active) simulation.alphaTarget(1).restart()
      d.fx = d.x
      d.fy = d.y
    }
    const dragMove = (e: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node): void => {
      d.fx = e.x
      d.fy = e.y
    }
    const dragEnd = (e: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node): void => {
      if (!e.active) simulation.alphaTarget(0)
      if (!d.isFixed()) {
        d.fx = null
        d.fy = null
      }
    }

    return d3.drag<SVGCircleElement, Node, Node>()
      .on("start", dragStart).on("drag", dragMove).on("end", dragEnd)
  }

  drawNode(): this {
    this.nodes = this.nodesGroup
      .selectAll<SVGCircleElement, Node>("circle")
      .data(this.getNodes(), d => d.id ?? 0)
      .join("circle")
      .attr("r", (d: Node): number => d.getRadius())
      .style("fill", (d: Node): string => d.getFill())
      .style("stroke", (d: Node): string => d.getStroke())
      .style("stroke-width", (d: Node): number => d.getStrokeWidth())
      .classed('is-tag-highlighted', (d: Node): boolean => this.isNodeInActiveTag(d))
      .classed('is-search-highlighted', (d: Node): boolean => this.isNodeSearchHighlighted(d))
      .classed('is-link-action-source', (d: Node): boolean => this.isLinkActionSource(d))
      .call(this.drag(this.simulation!))
      .on('click', this.clickNode)
      .on('mouseover', (event: MouseEvent, node: Node): void => {this.mouseOver(event, node)})
      .on('mousemove', (event: MouseEvent, node: Node): void => {this.mouseMove(event, node)})
      .on('mouseout', (event: MouseEvent, node: Node): void => {this.mouseLeave(event, node)})
      .on('mouseleave', (event: MouseEvent, node: Node): void => {this.mouseLeave(event, node)})
    return this;
  }

  drawNodeTypeBadge(): this {
    this.nodeTypeBadges = this.nodeTypeBadgesGroup
      .selectAll<SVGGElement, Node>('g')
      .data(this.getNodes().filter((d: Node): boolean => Boolean(d.nodeType)), d => d.id ?? 0)
      .join('g')
      .attr('class', 'node-type-badge')

    this.nodeTypeBadges.selectAll('*').remove()

    this.nodeTypeBadges
      .append('circle')
      .attr('r', 10)
      .style('fill', (d: Node): string => getNodeTypeOption(d.nodeType)?.color ?? '#64748b')
      .style('stroke', 'var(--app-graph-badge-outline)')
      .style('stroke-width', '2px')

    this.nodeTypeBadges.each((d, index, groups): void => {
      this.drawNodeTypeIcon(d3.select<SVGGElement, Node>(groups[index] as SVGGElement), d)
    })

    return this
  }

  drawNodeTypeIcon(group: d3.Selection<SVGGElement, Node, null, undefined>, node: Node): void {
    const nodeType = getNodeTypeOption(node.nodeType)
    const iconGroup = group
      .append('g')
      .attr('class', 'node-type-icon')
      .style('stroke', '#ffffff')
      .style('stroke-width', '1.7px')
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round')

    if (nodeType?.iconKind === 'connector') {
      iconGroup.append('line').attr('x1', -5).attr('y1', 0).attr('x2', 5).attr('y2', 0)
      iconGroup.append('circle').attr('cx', -5).attr('cy', 0).attr('r', 2).style('fill', 'none')
      iconGroup.append('circle').attr('cx', 5).attr('cy', 0).attr('r', 2).style('fill', 'none')
      return
    }

    if (nodeType?.iconKind === 'condenser') {
      iconGroup.append('line').attr('x1', -5).attr('y1', 0).attr('x2', -1.5).attr('y2', 0)
      iconGroup.append('line').attr('x1', 1.5).attr('y1', 0).attr('x2', 5).attr('y2', 0)
      iconGroup.append('line').attr('x1', -1.5).attr('y1', -5).attr('x2', -1.5).attr('y2', 5)
      iconGroup.append('line').attr('x1', 1.5).attr('y1', -5).attr('x2', 1.5).attr('y2', 5)
      return
    }

    if (nodeType?.iconKind === 'bridge') {
      this.drawFontAwesomeNodeTypeIcon(group, nodeType.iconClass)
      return
    }

    if (nodeType?.iconKind === 'gatekeeper') {
      this.drawFontAwesomeNodeTypeIcon(group, nodeType.iconClass)
    }
  }

  drawFontAwesomeNodeTypeIcon(group: d3.Selection<SVGGElement, Node, null, undefined>, iconClass?: string): void {
    group.select('.node-type-icon').remove()

    group
      .append('foreignObject')
      .attr('x', -8)
      .attr('y', -8)
      .attr('width', 16)
      .attr('height', 16)
      .append('xhtml:span')
      .attr('class', 'node-type-fa-icon')
      .style('width', '16px')
      .style('height', '16px')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('color', '#ffffff')
      .style('font-size', '11px')
      .html(`<i class="fa ${iconClass ?? ''}"></i>`)
  }

  mouseOver(event: MouseEvent, node: Node): void {
    this.toolTipBox.classed('box', true).classed('is-block', false).style('display', 'block')
    const content: string = this.toolTip.createContent(node).getContent()
    this.toolTipBox.html(content)
    this.moveToolTip(event)
  }

  mouseMove(event: MouseEvent, _node: Node): void {
    this.moveToolTip(event)
  }

  private moveToolTip(event: MouseEvent): void {
    this.toolTip.setPosition(event.clientX, event.clientY)
    const [posX, posY] = this.toolTip.initPosition()

    this.toolTipBox
      .style('left', posX + 'px')
      .style('top', posY + 'px')
      .style('transform', 'translateY(-50%)')
  }

  mouseLeave(_event: MouseEvent, _node: Node): void {
    this.hideToolTip()
  }

  private hideToolTip(): void {
    this.toolTipBox.classed('is-block', false).style('display', 'none')
    this.toolTip.clear()
  }

  drawLink(): this {
    this.links = this.linksGroup
      .selectAll<SVGLineElement, SimulatedLink>("line")
      .data(this.getLinks(), d => d.id)
      .join("line")
      .style("stroke", (d: Link): string => d.getStroke())
      .style("stroke-width", (d: Link): number => d.getStrokeWidth())
      .classed('is-link-editable', this.linkEditMode)
      .on('click', this.clickLink)
    return this;
  }

  drawLabel(): this {
    this.labels = this.labelsGroup
      .selectAll<SVGTextElement, Node>('text')
      .data(this.getNodes(), d => d.id ?? 0)
      .join("text")
      .text((d: Node): string => d.getName())
      .attr('font-size', (d: Node): number => d.getFontSize())
      .style('fill', 'var(--app-graph-label)')
      .style('paint-order', 'stroke')
      .style('stroke', 'var(--app-graph-label-outline)')
      .style('stroke-width', '3px')
      .style('stroke-linejoin', 'round')
    return this;
  }

  drawTick(): void {
    this.links!
      .attr("x1", (d: SimulatedLink): number => d.source.x)
      .attr("y1", (d: SimulatedLink): number => d.source.y)
      .attr("x2", (d: SimulatedLink): number => d.target.x)
      .attr("y2", (d: SimulatedLink): number => d.target.y)

    this.nodes!
      .each((d: Node): void => {
        if (d.id !== undefined) {
          this.scope[d.id] = {circle: d.getPosition()}
        }
      })
      .attr("cx", (d: Node): number => d.x)
      .attr("cy", (d: Node): number => d.y)

    this.labels!
      .attr('dx', (d: Node): number => d.x + d.getRadius())
      .attr('dy', (d: Node): number => d.y - d.getRadius() / 2)

    this.nodeTypeBadges!
      .attr('transform', (d: Node): string => `translate(${d.x - d.getRadius() * 0.72}, ${d.y - d.getRadius() * 0.72})`)

    this.funcCircles!
      .attr('cx', (d: FunctionalCircle): number => this.scope[d.nodeId]?.circle?.x ?? this.box.w / 2)
      .attr('cy', (d: FunctionalCircle): number => this.scope[d.nodeId]?.circle?.y ?? this.box.h / 2)
  }

  drawEnd(): void {
    this.cbSimulationEnd()
  }

  simulationInit(): this {
    const manyBody = d3.forceManyBody()
      .strength(-500)
      .distanceMin(30).distanceMax(750)

    const simDistance = d3.forceLink<Node, SimulatedLink>(this.getLinks())
      .id((d: Node): number => d.id ?? 0)
      .distance((d: SimulatedLink): number => d.distance ?? 450)

    this.simulation = d3.forceSimulation<Node, SimulatedLink>()
      .nodes(this.getNodes())
      .force("manyBody", manyBody)
      .force("center", d3.forceCenter(this.box.w / 2, this.box.h / 2))
      .force("link", simDistance)
      .alphaDecay(0.01)

    return this
  }
}
