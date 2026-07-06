export interface AiQueueStatus {
  connected: boolean;
  queueLength: number;
  activeRequestId: string | null;
  currentRequestPosition: number | null;
  retryAfterSeconds: number;
  updatedAt: number;
}

type AiQueueStatusListener = (status: AiQueueStatus) => void;

const DEFAULT_QUEUE_STATUS: AiQueueStatus = {
  connected: false,
  queueLength: 0,
  activeRequestId: null,
  currentRequestPosition: null,
  retryAfterSeconds: 0,
  updatedAt: 0,
}

export const createSameOriginAiQueueEndpoint = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/ai/queue`
}

export class AiQueueSocketService {
  private socket?: WebSocket
  private reconnectTimer?: number
  private statusTimer?: number
  private readonly listeners = new Set<AiQueueStatusListener>()
  private status: AiQueueStatus = {...DEFAULT_QUEUE_STATUS}
  private currentRequestId = ''

  constructor(
    private readonly endpoint: string,
    private readonly clientId: string,
  ) {}

  connect(): void {
    if (!this.endpoint || this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
      return
    }

    this.socket = new WebSocket(this.endpoint)

    this.socket.onopen = () => {
      this.applyStatus({connected: true})
      this.send({type: 'identify', clientId: this.clientId})
      this.requestStatus()
      this.startStatusTimer()
    }

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data)
    }

    this.socket.onerror = () => {
      this.applyStatus({connected: false})
    }

    this.socket.onclose = () => {
      this.applyStatus({connected: false})
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }

    if (this.statusTimer) {
      window.clearInterval(this.statusTimer)
      this.statusTimer = undefined
    }

    this.socket?.close()
    this.socket = undefined
  }

  subscribe(listener: AiQueueStatusListener): () => void {
    this.listeners.add(listener)
    listener(this.status)

    return () => {
      this.listeners.delete(listener)
    }
  }

  requestStatus(): void {
    this.send({type: 'status', clientId: this.clientId, currentRequestId: this.currentRequestId})
  }

  setCurrentRequestId(requestId: string): void {
    this.currentRequestId = requestId
    this.requestStatus()
  }

  private handleMessage(rawMessage: unknown): void {
    try {
      const message = JSON.parse(String(rawMessage))

      this.applyStatus({
        connected: message.connected ?? true,
        queueLength: Number(message.queueLength ?? this.status.queueLength ?? 0),
        activeRequestId: message.activeRequestId ?? null,
        currentRequestPosition: this.getCurrentRequestPosition(message),
        retryAfterSeconds: Number(message.retryAfterSeconds ?? 0),
      })
    } catch {
      this.applyStatus({connected: true})
    }
  }

  private send(payload: Record<string, unknown>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload))
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = undefined
      this.connect()
    }, 5000)
  }

  private startStatusTimer(): void {
    if (this.statusTimer) {
      return
    }

    this.statusTimer = window.setInterval(() => {
      this.send({type: 'heartbeat', clientId: this.clientId, currentRequestId: this.currentRequestId})
    }, 5000)
  }

  private getCurrentRequestPosition(message: any): number | null {
    if (!this.currentRequestId) {
      return null
    }

    if (message.activeRequestId === this.currentRequestId) {
      return 1
    }

    if (!Array.isArray(message.positions)) {
      return null
    }

    const position = message.positions.find((item: any) => item?.requestId === this.currentRequestId)
    return Number.isFinite(position?.position) ? Number(position.position) : null
  }

  private applyStatus(update: Partial<AiQueueStatus>): void {
    this.status = {
      ...this.status,
      ...update,
      updatedAt: Date.now(),
    }

    for (const listener of this.listeners) {
      listener(this.status)
    }
  }
}
