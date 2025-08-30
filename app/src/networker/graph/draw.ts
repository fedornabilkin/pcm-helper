// @ts-ignore
import * as d3 from 'd3';
import { DataTransfer } from './dataTransfer.ts';
import { FunctionalCircle } from '../entity/graph/functionalCircle.ts';
import { Link } from '../entity/graph/link.ts';
import { Node } from '../entity/graph/node.ts';

export class DrawNetwork {
  box: any = {
    w: 800,
    h: 600,
    html: { element: null, class: '' },
  };
  dto: DataTransfer = new DataTransfer();
  scope: any = {extra: {}};

  scale: any = {min: 0.1, max: 10}

  divElement: any;
  container: any;
  graph: any;
  nodesGroup: any;
  linksGroup: any;
  funcCirclesGroup: any;
  labelsGroup: any;
  nodes: any;
  links: any;
  funcCircles: any;
  labels: any;
  simulation: any;

  cbClickNode = (e: any, d: Node) => {}
  cbClickLink = (e: any, d: Node) => {}
  cbSimulationEnd = () => {}

  constructor(config: any = {}) {
    Object.assign(this, config)
  }

  render(element: HTMLElement) {
    this.drawContainer(element)
      .drawGraph()

    this.funcCirclesGroup = this.container.append('g').attr('class', 'functional-circle')
    this.linksGroup = this.container.append('g').attr('class', 'links')
    this.nodesGroup = this.container.append('g').attr('class', 'nodes')
    this.labelsGroup = this.container.append('g').attr('class', 'label')

    this.simulationInit()
      .drawFunctionalCircle().drawLink().drawNode().drawLabel()

    this.simulation.on("tick", () => this.drawTick())
    this.simulation.on("end", () => this.drawEnd())
  }

  reRender() {
    if (this.simulation) {
      this.drawFunctionalCircle().drawLink().drawNode().drawLabel()

      this.simulation.nodes(this.dto.getNodes())
      this.simulation.force('link').links(this.dto.getLinks())
      this.simulation.alpha(1).restart()
      // this.simulation.alphaTarget(1).restart()
    }
  }

  drawContainer(element: HTMLElement): this {
    this.divElement = d3.select(element)
      .insert('div', ':first-child')
      .attr('class', this.box.html?.class ?? 'graph-container')
      .style('width', this.box.w + 'px')
      .style('height', this.box.h + 'px')
      .style('background', '#fbfbfb')
    return this;
  }

  zoom(container: any): any {
    return d3.zoom()
      .scaleExtent([this.scale.min, this.scale.max])
      .on("zoom", (event: any) => {
        container.attr("transform", event.transform);
      })
  }

  drawGraph(): this {
    this.graph = this.divElement.append('svg')
      .attr('width', this.box.w + 'px')
      .attr('height', this.box.h + 'px')

    this.container = this.graph.append('g').attr('class', 'zoom-container')
    this.graph.call(this.zoom(this.container))
    return this;
  }

  drawFunctionalCircle(): this {
    this.funcCircles = this.funcCirclesGroup
      .selectAll('circle')
      .data(this.dto.getCircles(), d => `${d.id}-${d.name}`)
      .join('circle')
      .attr('r', (d: FunctionalCircle): number => d.r)
      .style("fill", (d: FunctionalCircle): string => d.getFill())
      .style("stroke", (d: FunctionalCircle): string => d.getStroke())
    return this;
  }

  drag(simulation: d3): d3 {
    const dragStart = (e: any, d: Node): void => {
      if (!e.active) simulation.alphaTarget(1).restart()
      d.fx = d.x
      d.fy = d.y
    }
    const dragMove = (e: any, d: Node): void => {
      d.fx = e.x
      d.fy = e.y
    }
    const dragEnd = (e: any, d: Node): void => {
      if (!e.active) simulation.alphaTarget(0)
      if (!d.isFixed()) {
        d.fx = null
        d.fy = null
      }
    }

    return d3.drag()
      .on("start", dragStart).on("drag", dragMove).on("end", dragEnd)
  }

  drawNode(): this {
    this.nodes = this.nodesGroup
      .selectAll("circle")
      .data(this.dto.getNodes(), d => d.id)
      .join("circle")
      .attr("r", (d: Node): number => d.r)
      .style("fill", (d: Node): string => d.getFill())
      .style("stroke", (d: Node): string => d.getStroke())
      .call(this.drag(this.simulation))
      .on('click', this.cbClickNode)
    return this;
  }

  drawLink(): this {
    this.links = this.linksGroup
      .selectAll("line")
      .data(this.dto.getLinks(), d => d.id)
      .join("line")
      .style("stroke", (d: Link): string => d.getStroke())
      .on('click', this.cbClickLink)
    return this;
  }

  drawLabel(): this {
    this.labels = this.labelsGroup
      .selectAll('text')
      .data(this.dto.getNodes(), d => d.id)
      .join("text")
      .text((d: Node): string => d.getLabel())
      .attr('font-size', (d: Node): number => d.getFontSize())
    return this;
  }

  drawTick(): void {
    this.links
      .attr("x1", (d: Link): number => d.source.x)
      .attr("y1", (d: Link): number => d.source.y)
      .attr("x2", (d: Link): number => d.target.x)
      .attr("y2", (d: Link): number => d.target.y)

    this.nodes
      .attr('class', (d: Node): void => {
        this.scope[d.id] = {circle: d.getPosition()}
      })
      .attr("cx", (d: Node): number => d.x)
      .attr("cy", (d: Node): number => d.y)

    this.labels
      .attr('dx', (d: Node): number => d.x)
      .attr('dy', (d: Node): number => d.y)

    this.funcCircles
      .attr('cx', (d: any): number => this.scope[d.id].circle.x)
      .attr('cy', (d: any): number => this.scope[d.id].circle.y)
  }

  drawEnd(): void {
    this.cbSimulationEnd()
  }

  simulationInit(): this {
    const manyBody = d3.forceManyBody()
      .strength(-500)
      .distanceMin(30).distanceMax(750)

    const simDistance = d3.forceLink(this.dto.getLinks())
      .id((d: any): number => d.id)
      .distance((d: any): number => d.distance ?? 450)

    this.simulation = d3.forceSimulation()
      .nodes(this.dto.getNodes())
      .force("manyBody", manyBody)
      .force("center", d3.forceCenter(this.box.w / 2, this.box.h / 2))
      .force("link", simDistance)
      .alphaDecay(0.01)

    return this
  }
}