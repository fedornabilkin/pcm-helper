import {useLocalStore} from "../../core/composable/store/localStore";

import type {LocalStoreSaveResult} from "../../core/composable/store/localStore";

const NETWORK_STORAGE_SCHEMA_VERSION = 1
const NETWORK_STORAGE_META_KEY = 'network-list-meta'
const NETWORK_RECOVERY_BACKUP_KEY = 'network-list-recoveryBackup'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const readSchemaVersion = (value: unknown): number => {
  return isRecord(value) && Number.isInteger(value.schemaVersion)
    ? Number(value.schemaVersion)
    : 0
}

const recoverNetworkList = (value: unknown): unknown[] | undefined => {
  if (Array.isArray(value)) {
    return value
  }
  if (!isRecord(value)) {
    return undefined
  }

  return [value.networks, value.items, value.data].find(Array.isArray) as unknown[] | undefined
}

const backupRecoverySource = (value: unknown, schemaVersion: number): void => {
  try {
    localStorage.setItem(NETWORK_RECOVERY_BACKUP_KEY, JSON.stringify({
      createdAt: new Date().toISOString(),
      schemaVersion,
      networks: value,
    }))
  } catch {
    // Исходный ключ остаётся без изменений, даже если резервную копию создать нельзя.
  }
}

export function useNetworkStore() {
  const keyNetworkList = 'network-list'

  const {
    state: networks, save: saveNetworks, clear: clearNetworks
  } = useLocalStore(keyNetworkList, []);
  const {
    state: storageMeta, save: saveStorageMeta
  } = useLocalStore(NETWORK_STORAGE_META_KEY, {schemaVersion: 0});

  const schemaVersion = readSchemaVersion(storageMeta.value)
  let recoveryRequired = schemaVersion > NETWORK_STORAGE_SCHEMA_VERSION
  let recoveryOverwriteAllowed = false
  const sourceNetworks = networks.value
  const restoredNetworks = recoveryRequired ? undefined : recoverNetworkList(networks.value)
  if (restoredNetworks) {
    if (!Array.isArray(networks.value)) {
      backupRecoverySource(networks.value, schemaVersion)
      networks.value = restoredNetworks
    }
  } else {
    backupRecoverySource(networks.value, schemaVersion)
    recoveryRequired = true
    networks.value = []
  }

  function saveAll(): LocalStoreSaveResult {
    if (recoveryRequired && !recoveryOverwriteAllowed) {
      return {success: false, reason: 'recovery_required'}
    }

    storageMeta.value = {schemaVersion: NETWORK_STORAGE_SCHEMA_VERSION}
    const results = [saveNetworks(), saveStorageMeta()]
    return results.find((result): result is Exclude<LocalStoreSaveResult, {success: true}> => !result.success)
      ?? {success: true}
  }

  function clearAll(): void {
    clearNetworks();
    localStorage.removeItem(NETWORK_STORAGE_META_KEY)
    localStorage.removeItem(NETWORK_RECOVERY_BACKUP_KEY)
  }

  function getRecoveryBackup(): unknown | undefined {
    if (!recoveryRequired) {
      return undefined
    }

    return {
      kind: 'pcm-helper-network-list-recovery',
      createdAt: new Date().toISOString(),
      schemaVersion,
      networks: sourceNetworks,
    }
  }

  function allowRecoveryOverwrite(): void {
    recoveryOverwriteAllowed = true
  }

  return {
    saveAll,
    clearAll,
    networks,
    getRecoveryBackup,
    allowRecoveryOverwrite,
  };
}

export type NetworkStore = ReturnType<typeof useNetworkStore>
