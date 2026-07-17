import {createUid} from "@/core/id/uid";
import {DataTransfer} from "@/networker/graph/dataTransfer";
import type {
  FactDTO,
  FunctionalCircleDTO,
  GraphLinkDTO,
  GraphNodeDTO,
  TagDTO,
} from "@/networker/graph/types";
import {cloneDataTransfer} from "@/networker/service/transfer/networkFile";

export type ImportCandidateStatus =
  | 'new'
  | 'unchanged'
  | 'changed'
  | 'conflict'
  | 'possible-duplicate'

export type NodeMergeField =
  | 'name'
  | 'description'
  | 'nodeType'
  | 'tags'
  | 'pcm'
  | 'fill'
  | 'stroke'
  | 'strokeWidth'
  | 'fixed'
  | 'position'

export type MergeSide = 'local' | 'incoming'
export type MergeResolution = MergeSide | 'none'

export type LinkMergeField = 'distance' | 'status' | 'stroke' | 'strokeWidth'

export type ImportLinkCandidateStatus =
  | 'new'
  | 'unchanged'
  | 'changed'
  | 'conflict'
  | 'local-only'
  | 'removed-in-file'

export interface ImportCandidate {
  key: string;
  status: ImportCandidateStatus;
  incoming: GraphNodeDTO;
  local?: GraphNodeDTO;
  base?: GraphNodeDTO;
  changedFields: NodeMergeField[];
  conflictFields: NodeMergeField[];
  recommendedResolutions: Partial<Record<NodeMergeField, MergeSide>>;
}

export interface ImportLinkCandidate {
  key: string;
  status: ImportLinkCandidateStatus;
  sourceName: string;
  targetName: string;
  incoming?: GraphLinkDTO;
  local?: GraphLinkDTO;
  base?: GraphLinkDTO;
  changedFields: LinkMergeField[];
  conflictFields: LinkMergeField[];
  recommendedResolution: MergeSide;
}

export interface ImportAnalysis {
  local: DataTransfer;
  incoming: DataTransfer;
  base?: DataTransfer;
  candidates: ImportCandidate[];
  linkCandidates: ImportLinkCandidate[];
  remoteDeletions: Array<{
    local: GraphNodeDTO;
    base: GraphNodeDTO;
    conflict: boolean;
  }>;
  counts: {
    nodes: number;
    links: number;
    tags: number;
    circles: number;
  };
}

export interface ImportNodeDecision {
  key: string;
  selected: boolean;
  fieldResolutions?: Partial<Record<NodeMergeField, MergeResolution>>;
}

export interface ImportLinkDecision {
  key: string;
  side: MergeResolution;
}

export interface ImportPlan {
  result: DataTransfer;
  summary: {
    createdNodes: number;
    updatedNodes: number;
    addedLinks: number;
    updatedLinks: number;
    addedTags: number;
    addedCircles: number;
    skippedLinks: number;
  };
}

const NODE_FIELDS: NodeMergeField[] = [
  'name',
  'description',
  'nodeType',
  'tags',
  'pcm',
  'fill',
  'stroke',
  'strokeWidth',
  'fixed',
  'position',
]

const LINK_FIELDS: LinkMergeField[] = ['distance', 'status', 'stroke', 'strokeWidth']

const comparableNodeFields = (
  ...nodes: Array<GraphNodeDTO | undefined>
): NodeMergeField[] => {
  const presentNodes = nodes.filter((node): node is GraphNodeDTO => node !== undefined)
  const positionIsMeaningful = presentNodes.length > 0
    && presentNodes.every(node => node.fixed === true)

  return positionIsMeaningful
    ? NODE_FIELDS
    : NODE_FIELDS.filter(field => field !== 'position')
}

const normalizeName = (value?: string): string => {
  return (value ?? '').trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ')
}

const stableValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableValue).sort().join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${key}:${stableValue(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

const fieldValue = (node: GraphNodeDTO, field: NodeMergeField): unknown => {
  if (field === 'position') {
    return {x: node.x, y: node.y, fx: node.fx, fy: node.fy}
  }
  return node[field]
}

const valuesEqual = (left: unknown, right: unknown): boolean => {
  return stableValue(left) === stableValue(right)
}

const endpointId = (endpoint: GraphLinkDTO['source']): number | undefined => {
  return typeof endpoint === 'number' ? endpoint : endpoint?.id
}

const linkEndpointName = (
  link: GraphLinkDTO,
  endpoint: 'source' | 'target',
  nodes: GraphNodeDTO[],
): string => {
  const id = endpointId(link[endpoint])
  const node = nodes.find(item => item.id === id)
  return node?.name?.trim() || `Контакт ${id ?? '—'}`
}

const nextId = (items: Array<{id?: number}>): number => {
  return Math.max(0, ...items.map(item => item.id ?? 0)) + 1
}

const candidateKey = (node: GraphNodeDTO): string => {
  return node.uid ?? `legacy-${node.id}-${normalizeName(node.name)}`
}

const findMatchingNode = (
  collection: GraphNodeDTO[],
  incoming: GraphNodeDTO,
): GraphNodeDTO | undefined => {
  if (incoming.uid) {
    const uidMatch = collection.find(node => node.uid === incoming.uid)
    if (uidMatch) {
      return uidMatch
    }
  }

  const name = normalizeName(incoming.name)
  if (!name) {
    return undefined
  }

  const matches = collection.filter(node => normalizeName(node.name) === name)
  return matches.length === 1 ? matches[0] : undefined
}

const prepareFacts = (facts: FactDTO[] = []): FactDTO[] => {
  return facts.map((fact, index) => ({
    ...fact,
    id: index + 1,
    uid: fact.uid ?? createUid(),
  }))
}

export class GraphImportService {
  analyze(localValue: DataTransfer, incomingValue: DataTransfer, baseValue?: DataTransfer): ImportAnalysis {
    const local = cloneDataTransfer(localValue)
    const incoming = cloneDataTransfer(incomingValue)
    const base = baseValue ? cloneDataTransfer(baseValue) : undefined

    const candidates = incoming.nodes.map((incomingNode): ImportCandidate => {
      const localNode = findMatchingNode(local.nodes, incomingNode)
      const baseNode = base ? findMatchingNode(base.nodes, incomingNode) : undefined
      const candidateFields = comparableNodeFields(localNode, baseNode, incomingNode)
      const changedFields = localNode
        ? candidateFields.filter(field => !valuesEqual(fieldValue(localNode, field), fieldValue(incomingNode, field)))
        : candidateFields
      const conflictFields: NodeMergeField[] = []
      const recommendedResolutions: Partial<Record<NodeMergeField, MergeSide>> = {
        position: 'local',
      }

      if (localNode && baseNode) {
        candidateFields.forEach(field => {
          const baseField = fieldValue(baseNode, field)
          const localField = fieldValue(localNode, field)
          const incomingField = fieldValue(incomingNode, field)
          const localChanged = !valuesEqual(localField, baseField)
          const incomingChanged = !valuesEqual(incomingField, baseField)

          if (localChanged && incomingChanged && !valuesEqual(localField, incomingField)) {
            conflictFields.push(field)
            recommendedResolutions[field] = 'local'
          } else if (incomingChanged && !localChanged) {
            recommendedResolutions[field] = 'incoming'
          } else if (localChanged && !incomingChanged) {
            recommendedResolutions[field] = 'local'
          } else {
            recommendedResolutions[field] = field === 'position' ? 'local' : 'incoming'
          }
        })
      } else {
        candidateFields.forEach(field => {
          recommendedResolutions[field] = field === 'position' ? 'local' : 'incoming'
        })
      }

      let status: ImportCandidateStatus = 'new'
      if (localNode) {
        if (!incomingNode.uid || localNode.uid !== incomingNode.uid) {
          status = 'possible-duplicate'
        } else if (conflictFields.length > 0) {
          status = 'conflict'
        } else if (changedFields.length > 0) {
          status = 'changed'
        } else {
          status = 'unchanged'
        }
      }

      return {
        key: candidateKey(incomingNode),
        status,
        incoming: incomingNode,
        local: localNode,
        base: baseNode,
        changedFields,
        conflictFields,
        recommendedResolutions,
      }
    })

    const localNodeKeys = new Map(local.nodes.flatMap(node => {
      return node.id ? [[node.id, `local:${node.id}`] as const] : []
    }))
    const incomingNodeKeys = new Map(candidates.flatMap(candidate => {
      if (!candidate.incoming.id) {
        return []
      }
      const key = candidate.local?.id
        ? `local:${candidate.local.id}`
        : `incoming:${candidate.key}`
      return [[candidate.incoming.id, key] as const]
    }))
    const baseNodeKeys = new Map((base?.nodes ?? []).flatMap(baseNode => {
      if (!baseNode.id) {
        return []
      }
      const localMatch = findMatchingNode(local.nodes, baseNode)
      if (localMatch?.id) {
        return [[baseNode.id, `local:${localMatch.id}`] as const]
      }
      const incomingMatch = findMatchingNode(incoming.nodes, baseNode)
      if (incomingMatch?.id && incomingNodeKeys.has(incomingMatch.id)) {
        return [[baseNode.id, incomingNodeKeys.get(incomingMatch.id) as string] as const]
      }
      return [[baseNode.id, `base:${candidateKey(baseNode)}`] as const]
    }))

    const canonicalLinkKey = (
      link: GraphLinkDTO,
      nodeKeys: Map<number, string>,
    ): string | undefined => {
      const source = endpointId(link.source)
      const target = endpointId(link.target)
      const sourceKey = source ? nodeKeys.get(source) : undefined
      const targetKey = target ? nodeKeys.get(target) : undefined
      if (!sourceKey || !targetKey) {
        return undefined
      }
      return [sourceKey, targetKey].sort().join('|')
    }

    const localLinks = new Map(local.links.flatMap(link => {
      const key = canonicalLinkKey(link, localNodeKeys)
      return key ? [[key, link] as const] : []
    }))
    const incomingLinks = new Map(incoming.links.flatMap(link => {
      const key = canonicalLinkKey(link, incomingNodeKeys)
      return key ? [[key, link] as const] : []
    }))
    const baseLinks = new Map((base?.links ?? []).flatMap(link => {
      const key = canonicalLinkKey(link, baseNodeKeys)
      return key ? [[key, link] as const] : []
    }))

    const linkKeys = new Set([...localLinks.keys(), ...incomingLinks.keys()])
    const linkCandidates: ImportLinkCandidate[] = Array.from(linkKeys).map(key => {
      const localLink = localLinks.get(key)
      const incomingLink = incomingLinks.get(key)
      const baseLink = baseLinks.get(key)
      const displayLink = incomingLink ?? localLink ?? baseLink as GraphLinkDTO
      const displayNodes = incomingLink ? incoming.nodes : localLink ? local.nodes : base?.nodes ?? []
      const changedFields = localLink && incomingLink
        ? LINK_FIELDS.filter(field => !valuesEqual(localLink[field], incomingLink[field]))
        : []
      const conflictFields: LinkMergeField[] = []
      let recommendedResolution: MergeSide = incomingLink ? 'incoming' : 'local'

      if (localLink && incomingLink && baseLink) {
        LINK_FIELDS.forEach(field => {
          const localChanged = !valuesEqual(localLink[field], baseLink[field])
          const incomingChanged = !valuesEqual(incomingLink[field], baseLink[field])
          if (
            localChanged
            && incomingChanged
            && !valuesEqual(localLink[field], incomingLink[field])
          ) {
            conflictFields.push(field)
            recommendedResolution = 'local'
          } else if (incomingChanged && !localChanged) {
            recommendedResolution = 'incoming'
          } else if (localChanged && !incomingChanged) {
            recommendedResolution = 'local'
          }
        })
        if (conflictFields.length) {
          recommendedResolution = 'local'
        }
      }

      let status: ImportLinkCandidateStatus
      if (incomingLink && !localLink) {
        status = 'new'
      } else if (localLink && !incomingLink) {
        status = baseLink ? 'removed-in-file' : 'local-only'
      } else if (conflictFields.length) {
        status = 'conflict'
      } else if (changedFields.length) {
        status = 'changed'
      } else {
        status = 'unchanged'
      }

      return {
        key,
        status,
        sourceName: linkEndpointName(displayLink, 'source', displayNodes),
        targetName: linkEndpointName(displayLink, 'target', displayNodes),
        incoming: incomingLink,
        local: localLink,
        base: baseLink,
        changedFields,
        conflictFields,
        recommendedResolution,
      }
    })

    const remoteDeletions = (base?.nodes ?? []).flatMap(baseNode => {
      const existsIncoming = findMatchingNode(incoming.nodes, baseNode)
      const localNode = findMatchingNode(local.nodes, baseNode)
      if (existsIncoming || !localNode) {
        return []
      }

      return [{
        local: localNode,
        base: baseNode,
        conflict: comparableNodeFields(localNode, baseNode).some(field => {
          return !valuesEqual(fieldValue(localNode, field), fieldValue(baseNode, field))
        }),
      }]
    })

    return {
      local,
      incoming,
      base,
      candidates,
      linkCandidates,
      remoteDeletions,
      counts: {
        nodes: incoming.nodes.length,
        links: incoming.links.length,
        tags: incoming.tags.length,
        circles: incoming.circles.length,
      },
    }
  }

  createReplacePlan(analysis: ImportAnalysis): ImportPlan {
    return {
      result: cloneDataTransfer(analysis.incoming),
      summary: {
        createdNodes: analysis.incoming.nodes.length,
        updatedNodes: 0,
        addedLinks: analysis.incoming.links.length,
        updatedLinks: 0,
        addedTags: analysis.incoming.tags.length,
        addedCircles: analysis.incoming.circles.length,
        skippedLinks: 0,
      },
    }
  }

  createMergePlan(
    analysis: ImportAnalysis,
    decisions: ImportNodeDecision[],
    linkDecisions: ImportLinkDecision[] = [],
  ): ImportPlan {
    const result = cloneDataTransfer(analysis.local)
    const decisionMap = new Map(decisions.map(decision => [decision.key, decision]))
    const linkDecisionMap = new Map(linkDecisions.map(decision => [decision.key, decision]))
    const incomingNodeIdMap = new Map<number, number>()
    const selectedIncomingNodeIds = new Set<number>()
    const incomingTagIdMap = new Map<number, number>()
    let createdNodes = 0
    let updatedNodes = 0
    let addedTags = 0
    let addedLinks = 0
    let updatedLinks = 0
    let addedCircles = 0
    let skippedLinks = 0

    const selectedCandidates = analysis.candidates.filter(candidate => {
      return decisionMap.get(candidate.key)?.selected === true
    })

    const requiredIncomingTagIds = new Set<number>()
    selectedCandidates.forEach(candidate => {
      const tagResolution = decisionMap.get(candidate.key)?.fieldResolutions?.tags
        ?? candidate.recommendedResolutions.tags
      if (candidate.local && tagResolution === 'local') {
        return
      }
      candidate.incoming.tags?.forEach(id => requiredIncomingTagIds.add(id))
    })

    analysis.incoming.tags.forEach(incomingTag => {
      if (!incomingTag.id || !requiredIncomingTagIds.has(incomingTag.id)) {
        return
      }

      const existing = result.tags.find(tag => {
        return (incomingTag.uid && tag.uid === incomingTag.uid)
          || (
            normalizeName(tag.name) === normalizeName(incomingTag.name)
            && normalizeName(tag.group) === normalizeName(incomingTag.group)
          )
      })

      if (existing?.id) {
        incomingTagIdMap.set(incomingTag.id, existing.id)
        return
      }

      const created: TagDTO = {
        ...incomingTag,
        id: nextId(result.tags),
        uid: incomingTag.uid ?? createUid(),
      }
      result.tags.push(created)
      incomingTagIdMap.set(incomingTag.id, created.id as number)
      addedTags += 1
    })

    analysis.candidates.forEach(candidate => {
      if (candidate.incoming.id && candidate.local?.id) {
        incomingNodeIdMap.set(candidate.incoming.id, candidate.local.id)
      }
    })

    selectedCandidates.forEach(candidate => {
      const incoming = candidate.incoming
      const decision = decisionMap.get(candidate.key)
      if (!incoming.id) {
        return
      }
      selectedIncomingNodeIds.add(incoming.id)

      const remappedTags = (incoming.tags ?? [])
        .map(tagId => incomingTagIdMap.get(tagId))
        .filter((tagId): tagId is number => tagId !== undefined)

      if (!candidate.local?.id) {
        const created: GraphNodeDTO = {
          ...incoming,
          id: nextId(result.nodes),
          uid: incoming.uid ?? createUid(),
          tags: remappedTags,
          facts: prepareFacts(incoming.facts),
        }
        result.nodes.push(created)
        incomingNodeIdMap.set(incoming.id, created.id as number)
        createdNodes += 1
        return
      }

      const localIndex = result.nodes.findIndex(node => node.id === candidate.local?.id)
      if (localIndex === -1) {
        return
      }

      const merged: GraphNodeDTO = {...result.nodes[localIndex]}
      NODE_FIELDS.forEach(field => {
        if (
          field === 'position'
          && !comparableNodeFields(candidate.local, candidate.base, incoming).includes('position')
        ) {
          return
        }

        const defaultSide: MergeSide = candidate.recommendedResolutions[field]
          ?? (field === 'position' ? 'local' : 'incoming')
        const side = decision?.fieldResolutions?.[field]
          ?? (candidate.conflictFields.includes(field) ? 'local' : defaultSide)

        if (side === 'local' || side === 'none') {
          return
        }

        if (field === 'position') {
          merged.x = incoming.x
          merged.y = incoming.y
          merged.fx = incoming.fx
          merged.fy = incoming.fy
        } else if (field === 'tags') {
          merged.tags = remappedTags
        } else {
          ;(merged as Record<string, unknown>)[field] = cloneDataTransferValue(incoming[field])
        }
      })
      merged.id = candidate.local.id
      merged.uid = candidate.local.uid ?? incoming.uid ?? createUid()
      const wasChanged = !valuesEqual(result.nodes[localIndex], merged)
      result.nodes[localIndex] = merged
      if (wasChanged) {
        updatedNodes += 1
      }
    })

    const existingLinkIndexes = new Map(result.links.flatMap((link, index) => {
      const source = endpointId(link.source)
      const target = endpointId(link.target)
      const key = source && target ? [source, target].sort((a, b) => a - b).join(':') : ''
      return key ? [[key, index] as const] : []
    }))

    analysis.incoming.links.forEach(incomingLink => {
      const candidate = analysis.linkCandidates.find(item => item.incoming === incomingLink)
      const linkSide = candidate
        ? linkDecisionMap.get(candidate.key)?.side ?? candidate.recommendedResolution
        : 'incoming'
      if (candidate?.status === 'new' && (linkSide === 'local' || linkSide === 'none')) {
        return
      }

      const incomingSource = endpointId(incomingLink.source)
      const incomingTarget = endpointId(incomingLink.target)
      if (!incomingSource || !incomingTarget) {
        skippedLinks += 1
        return
      }

      const source = incomingNodeIdMap.get(incomingSource)
      const target = incomingNodeIdMap.get(incomingTarget)

      if (!source || !target) {
        skippedLinks += 1
        return
      }

      const linkKey = [source, target].sort((a, b) => a - b).join(':')
      const existingIndex = existingLinkIndexes.get(linkKey)
      if (existingIndex !== undefined) {
        if (candidate?.changedFields.length && linkSide === 'incoming') {
          const existing = result.links[existingIndex]
          const updated = {...existing}
          LINK_FIELDS.forEach(field => {
            ;(updated as Record<string, unknown>)[field] = cloneDataTransferValue(incomingLink[field])
          })
          if (!valuesEqual(existing, updated)) {
            result.links[existingIndex] = updated
            updatedLinks += 1
          }
        }
        return
      }

      result.links.push({
        ...incomingLink,
        id: nextId(result.links),
        uid: incomingLink.uid ?? createUid(),
        source,
        target,
      })
      existingLinkIndexes.set(linkKey, result.links.length - 1)
      addedLinks += 1
    })

    analysis.incoming.circles.forEach(incomingCircle => {
      if (!incomingCircle.nodeId || !selectedIncomingNodeIds.has(incomingCircle.nodeId)) {
        return
      }

      const nodeId = incomingNodeIdMap.get(incomingCircle.nodeId)
      if (!nodeId) {
        return
      }

      const exists = result.circles.some(circle => {
        return (incomingCircle.uid && circle.uid === incomingCircle.uid)
          || (circle.nodeId === nodeId && circle.name === incomingCircle.name)
      })
      if (exists) {
        return
      }

      const created: FunctionalCircleDTO = {
        ...incomingCircle,
        id: nextId(result.circles),
        uid: incomingCircle.uid ?? createUid(),
        nodeId,
      }
      result.circles.push(created)
      addedCircles += 1
    })

    return {
      result,
      summary: {
        createdNodes,
        updatedNodes,
        addedLinks,
        updatedLinks,
        addedTags,
        addedCircles,
        skippedLinks,
      },
    }
  }
}

const cloneDataTransferValue = <T>(value: T): T => {
  return value === undefined ? value : JSON.parse(JSON.stringify(value))
}
