import {DataTransfer} from "../../graph/dataTransfer";
import {parseJsonOrThrow} from "@/core/json/safeJson";
import {
  NETWORK_FILE_SCHEMA_VERSION,
  type NetworkFileMeta,
  type ParsedNetworkFile,
  validateNetworkGraphDetailed,
} from "./networkFile";

export interface IFileAdapter {
  export(dto: DataTransfer): string | ArrayBuffer;
  import(data: string | ArrayBuffer): DataTransfer;
}

export interface JsonFileAdapterMeta extends NetworkFileMeta {}

export class JsonFileAdapter implements IFileAdapter {
  private readonly meta?: Partial<JsonFileAdapterMeta>
  private readonly base?: DataTransfer

  constructor(meta?: Partial<JsonFileAdapterMeta>, base?: DataTransfer) {
    this.meta = meta
    this.base = base
  }

  export(dto: DataTransfer): string {
    return JSON.stringify({
      meta: {
        schemaVersion: NETWORK_FILE_SCHEMA_VERSION,
        version: this.meta?.version ?? '1.0.0',
        exportedAt: this.meta?.exportedAt ?? new Date().toISOString(),
        exportedAtReadable: this.meta?.exportedAtReadable,
        networkName: this.meta?.networkName,
        networkUid: this.meta?.networkUid,
        revisionId: this.meta?.revisionId,
        parentRevisionId: this.meta?.parentRevisionId,
      },
      payload: dto,
      base: this.base,
    }, null, 2);
  }

  import(data: string | ArrayBuffer): DataTransfer {
    if (typeof data !== 'string') {
      throw new Error('JSON import supports only text data.');
    }

    return this.read(data).payload
  }

  read(data: string | ArrayBuffer): ParsedNetworkFile {
    if (typeof data !== 'string') {
      throw new Error('JSON-импорт поддерживает только текстовые данные.')
    }

    const obj = parseJsonOrThrow<any>(data, 'Импортируемый файл содержит некорректный JSON.')
    const hasEnvelope = obj && typeof obj === 'object' && 'payload' in obj
    const schemaVersion = Number(obj?.meta?.schemaVersion ?? 1)
    if (schemaVersion > NETWORK_FILE_SCHEMA_VERSION) {
      throw new Error(
        `Версия схемы ${schemaVersion} пока не поддерживается. Обновите приложение.`,
      )
    }
    const payloadResult = validateNetworkGraphDetailed(hasEnvelope ? obj.payload : obj)
    const baseResult = hasEnvelope && obj.base ? validateNetworkGraphDetailed(obj.base) : undefined

    return {
      meta: hasEnvelope && obj.meta && typeof obj.meta === 'object' ? obj.meta : {},
      payload: payloadResult.payload,
      base: baseResult?.payload,
      isLegacy: !hasEnvelope || schemaVersion < NETWORK_FILE_SCHEMA_VERSION,
      warnings: [
        ...payloadResult.warnings,
        ...(baseResult?.warnings.map(warning => `Базовая версия: ${warning}`) ?? []),
      ],
    }
  }
}
