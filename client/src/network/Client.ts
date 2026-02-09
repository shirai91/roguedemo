import { Client, Room } from "colyseus.js";

export class NetworkClient {
  private client: Client;
  public room: Room | null = null;
  public sessionId: string = "";

  constructor() {
    const host = window.location.hostname || "localhost";
    const isLocal = host === "localhost" || /^192\.168\./.test(host);
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const port = isLocal ? ":2567" : "";
    this.client = new Client(`${protocol}://${host}${port}`);
  }

  async connect(): Promise<Room> {
    this.room = await this.client.joinOrCreate("game");
    this.sessionId = this.room.sessionId;
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

  disconnect() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
  }
}

export const networkClient = new NetworkClient();
