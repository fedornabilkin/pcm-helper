import {DataTransfer} from "../../graph/dataTransfer";
import {parseJsonOrThrow} from "@/core/json/safeJson";

export interface IFileAdapter {
  export(dto: DataTransfer): string | ArrayBuffer;
  import(data: string | ArrayBuffer): DataTransfer;
}

export class JsonFileAdapter implements IFileAdapter {
  export(dto: DataTransfer): string {
    return JSON.stringify(dto);
  }

  import(data: string | ArrayBuffer): DataTransfer {
    if (typeof data !== 'string') {
      throw new Error('JSON import supports only text data.');
    }

    const obj = parseJsonOrThrow(data, 'Imported network file contains invalid JSON.');
    return new DataTransfer(obj);
  }
}
