import {DataTransfer} from "../../graph/dataTransfer.ts";

export interface IFileAdapter {
  export(dto: DataTransfer): string | ArrayBuffer;
  import(data: string | ArrayBuffer): DataTransfer;
}

export class JsonFileAdapter implements IFileAdapter {
  export(dto: DataTransfer): string {
    return JSON.stringify(dto);
  }

  import(data: string): DataTransfer {
    const obj = JSON.parse(data);
    return new DataTransfer(obj);
  }
}