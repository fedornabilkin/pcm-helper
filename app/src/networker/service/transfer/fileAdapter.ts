import {DataTransfer} from "../../graph/dataTransfer";
import {parseJsonOrThrow} from "@/core/json/safeJson";

export interface IFileAdapter {
  export(dto: DataTransfer): string | ArrayBuffer;
  import(data: string | ArrayBuffer): DataTransfer;
}

export interface JsonFileAdapterMeta {
  version: string;
  exportedAt: string;
  networkName?: string;
}

export class JsonFileAdapter implements IFileAdapter {
  private readonly meta?: Partial<JsonFileAdapterMeta>

  constructor(meta?: Partial<JsonFileAdapterMeta>) {
    this.meta = meta
  }

  export(dto: DataTransfer): string {
    return JSON.stringify({
      meta: {
        version: this.meta?.version ?? '1.0.0',
        exportedAt: this.meta?.exportedAt ?? new Date().toISOString(),
        networkName: this.meta?.networkName,
      },
      payload: dto,
    });
  }

  import(data: string | ArrayBuffer): DataTransfer {
    if (typeof data !== 'string') {
      throw new Error('JSON import supports only text data.');
    }

    const obj = parseJsonOrThrow(data, 'Imported network file contains invalid JSON.');
    return new DataTransfer(obj?.payload ?? obj);
  }
}
