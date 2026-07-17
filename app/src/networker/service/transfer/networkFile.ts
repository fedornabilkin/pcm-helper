import {DataTransfer} from "@/networker/graph/dataTransfer";
import type {
  FunctionalCircleDTO,
  GraphLinkDTO,
  GraphNodeDTO,
  NetworkGraphDTO,
  TagDTO,
} from "@/networker/graph/types";

export const NETWORK_FILE_SCHEMA_VERSION = 2

export interface NetworkFileMeta {
  schemaVersion: number;
  version: string;
  exportedAt: string;
  exportedAtReadable?: string;
  networkName?: string;
  networkUid?: string;
  revisionId?: string;
  parentRevisionId?: string;
}

export interface ParsedNetworkFile {
  meta: Partial<NetworkFileMeta>;
  payload: DataTransfer;
  base?: DataTransfer;
  isLegacy: boolean;
  warnings: string[];
}

export interface NetworkGraphValidationResult {
  payload: DataTransfer;
  warnings: string[];
}

const isRecord = (value: unknown): value is Record<string, any> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const cloneValue = <T>(value: T): T => JSON.parse(JSON.stringify(value))

export const cloneDataTransfer = (value: NetworkGraphDTO | DataTransfer): DataTransfer => {
  return new DataTransfer(cloneValue({
    nodes: value.nodes ?? [],
    links: value.links ?? [],
    circles: value.circles ?? [],
    tags: value.tags ?? [],
  }))
}

const endpointId = (endpoint: GraphLinkDTO['source']): number | undefined => {
  if (typeof endpoint === 'number') {
    return endpoint
  }

  return endpoint?.id
}

const assertArray = (value: unknown, label: string): any[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Поле «${label}» должно быть массивом.`)
  }
  return value
}

const assertUniqueIds = (items: Array<{id?: number}>, label: string): void => {
  const ids = new Set<number>()
  items.forEach((item, index): void => {
    if (!Number.isInteger(item.id) || Number(item.id) <= 0) {
      throw new Error(`${label}: у элемента ${index + 1} отсутствует корректный числовой id.`)
    }
    if (ids.has(item.id as number)) {
      throw new Error(`${label}: обнаружен повторяющийся id ${item.id}.`)
    }
    ids.add(item.id as number)
  })
}

const assertUniqueUids = (items: Array<{uid?: string}>, label: string): void => {
  const uids = new Set<string>()
  items.forEach((item): void => {
    if (item.uid === undefined) {
      return
    }
    if (typeof item.uid !== 'string' || !item.uid.trim()) {
      throw new Error(`${label}: uid должен быть непустой строкой.`)
    }
    if (uids.has(item.uid)) {
      throw new Error(`${label}: обнаружен повторяющийся uid ${item.uid}.`)
    }
    uids.add(item.uid)
  })
}

const repairDuplicateIds = (
  items: Array<{id?: number}>,
  label: string,
  warnings: string[],
): void => {
  const usedIds = new Set<number>()
  let nextAvailableId = Math.max(0, ...items.map(item => Number.isInteger(item.id) ? Number(item.id) : 0)) + 1

  items.forEach((item, index): void => {
    if (!Number.isInteger(item.id) || Number(item.id) <= 0) {
      return
    }

    const id = item.id as number
    if (!usedIds.has(id)) {
      usedIds.add(id)
      return
    }

    while (usedIds.has(nextAvailableId)) {
      nextAvailableId += 1
    }
    item.id = nextAvailableId
    usedIds.add(nextAvailableId)
    warnings.push(`${label}: повторяющийся id ${id} у элемента ${index + 1} заменён на ${nextAvailableId}.`)
    nextAvailableId += 1
  })
}

export const validateNetworkGraphDetailed = (value: unknown): NetworkGraphValidationResult => {
  if (!isRecord(value)) {
    throw new Error('Файл не содержит объект с данными сети.')
  }

  const clonedValue = cloneValue(value)
  const nodes = assertArray(clonedValue.nodes ?? [], 'nodes') as GraphNodeDTO[]
  const links = assertArray(clonedValue.links ?? [], 'links') as GraphLinkDTO[]
  const circles = assertArray(clonedValue.circles ?? [], 'circles') as FunctionalCircleDTO[]
  const tags = assertArray(clonedValue.tags ?? [], 'tags') as TagDTO[]
  const warnings: string[] = []

  repairDuplicateIds(links, 'Связи', warnings)
  repairDuplicateIds(circles, 'Функциональные круги', warnings)

  assertUniqueIds(nodes, 'Контакты')
  assertUniqueIds(links, 'Связи')
  assertUniqueIds(circles, 'Функциональные круги')
  assertUniqueIds(tags, 'Теги')
  assertUniqueUids(nodes, 'Контакты')
  assertUniqueUids(links, 'Связи')
  assertUniqueUids(circles, 'Функциональные круги')
  assertUniqueUids(tags, 'Теги')

  const nodeIds = new Set(nodes.map(node => node.id as number))
  const tagIds = new Set(tags.map(tag => tag.id as number))

  nodes.forEach((node, index): void => {
    if (node.name !== undefined && typeof node.name !== 'string') {
      throw new Error(`Контакт ${index + 1}: название должно быть строкой.`)
    }
    if (node.description !== undefined && typeof node.description !== 'string') {
      throw new Error(`Контакт ${index + 1}: описание должно быть строкой.`)
    }
    if (node.tags !== undefined && !Array.isArray(node.tags)) {
      throw new Error(`Контакт ${index + 1}: поле tags должно быть массивом.`)
    }
    node.tags?.forEach(tagId => {
      if (!tagIds.has(tagId)) {
        throw new Error(`Контакт ${index + 1}: указан отсутствующий тег ${tagId}.`)
      }
    })
  })

  links.forEach((link, index): void => {
    const source = endpointId(link.source)
    const target = endpointId(link.target)
    if (!source || !target || !nodeIds.has(source) || !nodeIds.has(target)) {
      throw new Error(`Связь ${index + 1} ссылается на отсутствующий контакт.`)
    }
    if (source === target) {
      throw new Error(`Связь ${index + 1} не может соединять контакт с самим собой.`)
    }
  })

  circles.forEach((circle, index): void => {
    if (!circle.nodeId || !nodeIds.has(circle.nodeId)) {
      throw new Error(`Функциональный круг ${index + 1} ссылается на отсутствующий контакт.`)
    }
  })

  return {
    payload: cloneDataTransfer({nodes, links, circles, tags}),
    warnings,
  }
}

export const validateNetworkGraph = (value: unknown): DataTransfer => {
  return validateNetworkGraphDetailed(value).payload
}
