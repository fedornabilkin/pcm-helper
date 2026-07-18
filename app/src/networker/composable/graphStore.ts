import {useLocalStore} from "../../core/composable/store/localStore";

import type {LocalStoreSaveResult} from "../../core/composable/store/localStore";

const LOCAL_GRAPH_SCHEMA_VERSION = 1

interface GraphStorageRecovery {
  schemaVersion: number;
  recovered: string[];
  unresolved: string[];
  overwriteAllowed: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const readSchemaVersion = (value: unknown): number => {
  if (!isRecord(value) || !Number.isInteger(value.schemaVersion)) {
    return 0
  }

  return Number(value.schemaVersion)
}

const recoverArray = (value: unknown, collectionName: string): unknown[] | undefined => {
  if (Array.isArray(value)) {
    return value
  }
  if (!isRecord(value)) {
    return undefined
  }

  const candidates = [value[collectionName], value.items, value.data]
  return candidates.find(Array.isArray) as unknown[] | undefined
}

const backupRecoverySource = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Исходные ключи не меняем: при недоступном хранилище данные остаются нетронутыми.
  }
}

const getGraphStoreKeys = (id: string | number) => {
  const prefix = String(id)

  return {
    nodes: `${prefix}-graph_nodes`,
    links: `${prefix}-graph_links`,
    funcCircles: `${prefix}-graph_funcCircles`,
    tags: `${prefix}-graph_tags`,
    importRevision: `${prefix}-graph_importRevision`,
    importBackup: `${prefix}-graph_importBackup`,
    storageMeta: `${prefix}-graph_storageMeta`,
    recoveryBackup: `${prefix}-graph_recoveryBackup`,
  }
}

export function clearGraphStore(id: string | number): void {
  Object.values(getGraphStoreKeys(id)).forEach((key: string): void => {
    localStorage.removeItem(key)
  })
}

export function useGraphStore(id: string | number) {
  const keys = getGraphStoreKeys(id)
  const {
    state: nodes, save: saveNodes, clear: clearNodes
  } = useLocalStore(keys.nodes, []);

  const {
    state: links, save: saveLinks, clear: clearLinks
  } = useLocalStore(keys.links, []);

  const {
    state: funcCircles, save: saveFuncCircles, clear: clearFuncCircles
  } = useLocalStore(keys.funcCircles, []);

  const {
    state: tags, save: saveTags, clear: clearTags
  } = useLocalStore(keys.tags, []);

  const {
    state: storageMeta, save: saveStorageMeta
  } = useLocalStore(keys.storageMeta, {schemaVersion: 0});

  const recovery: GraphStorageRecovery = {
    schemaVersion: readSchemaVersion(storageMeta.value),
    recovered: [],
    unresolved: [],
    overwriteAllowed: false,
  }
  const collections: Array<{name: string; state: {value: unknown}}> = [
    {name: 'nodes', state: nodes},
    {name: 'links', state: links},
    {name: 'circles', state: funcCircles},
    {name: 'tags', state: tags},
  ]
  const sourceSnapshot = Object.fromEntries(collections.map(({name, state}) => [name, state.value]))

  if (recovery.schemaVersion > LOCAL_GRAPH_SCHEMA_VERSION) {
    recovery.unresolved.push(`Версия локальных данных ${recovery.schemaVersion} пока не поддерживается.`)
  } else {
    collections.forEach(({name, state}): void => {
      const restored = recoverArray(state.value, name)
      if (restored) {
        if (!Array.isArray(state.value)) {
          recovery.recovered.push(name)
          state.value = restored
        }
        return
      }

      recovery.unresolved.push(`Не удалось восстановить коллекцию «${name}».`)
      state.value = []
    })
  }

  if (recovery.recovered.length || recovery.unresolved.length) {
    backupRecoverySource(keys.recoveryBackup, {
      createdAt: new Date().toISOString(),
      schemaVersion: recovery.schemaVersion,
      collections: sourceSnapshot,
    })
  }

  function saveAll(): LocalStoreSaveResult {
    if (recovery.unresolved.length && !recovery.overwriteAllowed) {
      return {success: false, reason: 'recovery_required'}
    }

    storageMeta.value = {schemaVersion: LOCAL_GRAPH_SCHEMA_VERSION}
    const results = [saveNodes(), saveLinks(), saveFuncCircles(), saveTags(), saveStorageMeta()]
    return results.find((result): result is Exclude<LocalStoreSaveResult, {success: true}> => !result.success)
      ?? {success: true}
  }

  function clearAll(): void {
    clearNodes();
    clearLinks();
    clearFuncCircles();
    clearTags();
    localStorage.removeItem(keys.importRevision)
    localStorage.removeItem(keys.importBackup)
    localStorage.removeItem(keys.storageMeta)
    localStorage.removeItem(keys.recoveryBackup)
  }

  function getRecoveryBackup(): unknown | undefined {
    if (!recovery.unresolved.length) {
      return undefined
    }

    return {
      kind: 'pcm-helper-graph-recovery',
      createdAt: new Date().toISOString(),
      schemaVersion: recovery.schemaVersion,
      collections: sourceSnapshot,
    }
  }

  function allowRecoveryOverwrite(): void {
    recovery.overwriteAllowed = true
  }

  return {
    nodes,
    links,
    funcCircles,
    tags,
    saveAll,
    clearAll,
    recovery,
    getRecoveryBackup,
    allowRecoveryOverwrite,
  };
}

export type GraphStore = ReturnType<typeof useGraphStore>
