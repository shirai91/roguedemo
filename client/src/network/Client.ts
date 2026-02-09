import { Client, Room } from "colyseus.js";

export class NetworkClient {
  private client: Client;
  public room: Room | null = null;
  public sessionId: string = "";
  private _ping: number = 0;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private _bytesIn: number = 0;
  private _bytesOut: number = 0;
  private _bytesInPerSec: number = 0;
  private _bytesOutPerSec: number = 0;
  private trafficInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const host = window.location.hostname || "localhost";
    const isLocal = host === "localhost" || /^192\.168\./.test(host);
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const port = isLocal ? ":2567" : "";
    this.client = new Client(`${protocol}://${host}${port}`);
  }

  async connect(playerName?: string): Promise<Room> {
    const options: any = {};
    if (playerName) options.name = playerName;
    this.room = await this.client.joinOrCreate("game", options);
    this.sessionId = this.room.sessionId;

    this.room.onMessage("pong", (message: { timestamp: number }) => {
      this._ping = Date.now() - message.timestamp;
    });

    // Monkey-patch WebSocket to count incoming bytes
    const ws = (this.room.connection as any).ws as WebSocket;
    const origOnMessage = ws.onmessage;
    ws.onmessage = (ev: MessageEvent) => {
      if (ev.data instanceof ArrayBuffer) {
        this._bytesIn += ev.data.byteLength;
      } else if (typeof ev.data === 'string') {
        this._bytesIn += ev.data.length;
      } else if (ev.data instanceof Blob) {
        this._bytesIn += ev.data.size;
      }
      if (origOnMessage) origOnMessage.call(ws, ev);
    };

    // Monkey-patch send to count outgoing bytes
    const origSend = this.room.send.bind(this.room);
    this.room.send = (type: string, message?: any) => {
      // Estimate outgoing size: type string + JSON of message
      this._bytesOut += type.length + (message ? JSON.stringify(message).length : 0) + 4;
      origSend(type, message);
    };

    this.trafficInterval = setInterval(() => {
      this._bytesInPerSec = this._bytesIn;
      this._bytesOutPerSec = this._bytesOut;
      this._bytesIn = 0;
      this._bytesOut = 0;
    }, 1000);

    this.pingInterval = setInterval(() => {
      this.room?.send("ping", { timestamp: Date.now() });
    }, 2000);

    return this.room;
  }

  sendInput(input: any) {
    this.room?.send("input", input);
  }

  sendPickup(instanceId: string) {
    this.room?.send("pickup", { instanceId });
  }

  sendEquip(inventoryIndex: number, slotIndex: number) {
    this.room?.send("equip", { inventoryIndex, slotIndex });
  }

  sendUnequip(slotIndex: number) {
    this.room?.send("unequip", { slotIndex });
  }

  sendLevelSkill(slotIndex: number) {
    this.room?.send("levelSkill", { slotIndex });
  }

  get ping(): number {
    return this._ping;
  }

  get bytesInPerSec(): number {
    return this._bytesInPerSec;
  }

  get bytesOutPerSec(): number {
    return this._bytesOutPerSec;
  }

  disconnect() {
    if (this.trafficInterval) {
      clearInterval(this.trafficInterval);
      this.trafficInterval = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }
}

export const networkClient = new NetworkClient();
