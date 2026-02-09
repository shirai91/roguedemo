import { Client, Room } from "colyseus.js";

export class NetworkClient {
  private client: Client;
  public room: Room | null = null;
  public sessionId: string = "";
  private _ping: number = 0;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

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

  disconnect() {
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
