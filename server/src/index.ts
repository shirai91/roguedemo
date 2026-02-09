import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { GameRoom } from "./rooms/GameRoom";

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const gameServer = new Server({ server });

gameServer.define("game", GameRoom);

const port = Number(process.env.PORT) || 2567;
gameServer.listen(port);
console.log(`[GameServer] Listening on port ${port}`);
