import {createUid} from "@/core/id/uid";
import {parseJsonOrFallback} from "@/core/json/safeJson";
import {DataTransfer} from "@/networker/graph/dataTransfer";
import {
  cloneDataTransfer,
  NETWORK_FILE_SCHEMA_VERSION,
  type NetworkFileMeta,
} from "@/networker/service/transfer/networkFile";

interface ImportRevisionState {
  networkUid: string;
  revisionId: string;
  snapshot: DataTransfer;
}

export interface ExportRevisionContext {
  meta: Pick<
    NetworkFileMeta,
    'schemaVersion' | 'networkUid' | 'revisionId' | 'parentRevisionId'
  >;
  base?: DataTransfer;
}

export class ImportRevisionService {
  constructor(private readonly storeId: string | number) {}

  prepareExport(current: DataTransfer): ExportRevisionContext {
    const previous = this.read()
    const revisionId = createUid()
    const networkUid = previous?.networkUid ?? createUid()
    const snapshot = cloneDataTransfer(current)

    this.write({networkUid, revisionId, snapshot})

    return {
      meta: {
        schemaVersion: NETWORK_FILE_SCHEMA_VERSION,
        networkUid,
        revisionId,
        parentRevisionId: previous?.revisionId,
      },
      base: previous?.snapshot ? cloneDataTransfer(previous.snapshot) : undefined,
    }
  }

  recordImport(
    result: DataTransfer,
    incomingMeta: Partial<NetworkFileMeta>,
    replace: boolean,
  ): void {
    const previous = this.read()
    this.write({
      networkUid: replace
        ? incomingMeta.networkUid ?? previous?.networkUid ?? createUid()
        : previous?.networkUid ?? createUid(),
      revisionId: createUid(),
      snapshot: cloneDataTransfer(result),
    })
  }

  private get key(): string {
    return `${this.storeId}-graph_importRevision`
  }

  private read(): ImportRevisionState | undefined {
    return parseJsonOrFallback<ImportRevisionState | undefined>(
      localStorage.getItem(this.key),
      undefined,
    )
  }

  private write(state: ImportRevisionState): void {
    localStorage.setItem(this.key, JSON.stringify(state))
  }
}

