import type { Server, ServerWebSocket } from "bun";
import type { Message } from "./lib/types";
import { logger } from "./lib/logger";
import { AI } from "./lib/ai";

class SocketServer {
  private readonly logger = logger.child({ module: "server" });
  private server: Server | undefined;
  private ai: AI;

  constructor() {
    this.ai = new AI();
  }

  private async onMessage(ws: ServerWebSocket, message: string) {
    const m = JSON.parse(message) as Message;
    this.logger.info(`Received message from client: [${m.type}](${m.message})`);

    switch (m.type) {
      case "YEET":
        this.logger.info("YEETED");
        break;
      case "PROMPT":
        const text = await this.ai.chat(m.message);
        this.send(ws, { type: "AI", message: text });
        break;
      default:
        break;
    }
  }

  private send(ws: ServerWebSocket, message: Message) {
    ws.send(JSON.stringify(message));
  }

  private onOpen(ws: ServerWebSocket) {
    this.logger.info("Socket connection opened");
    this.send(ws, { type: "OPEN", message: "Connected" });
  }

  private onClose(ws: ServerWebSocket) {}

  init() {
    this.server = Bun.serve({
      port: 8080,
      fetch(req, server) {
        if (server.upgrade(req)) {
          return;
        }
        return new Response("hello!");
      },
      websocket: {
        open: this.onOpen.bind(this),
        message: this.onMessage.bind(this),
        close: this.onClose.bind(this),
      },
    });
    this.logger.info("Socket server listening...");
  }
  destroy() {
    if (this.server) {
      this.server.stop();
    }
  }
}

async function main() {
  let server: SocketServer | undefined;
  try {
    server = new SocketServer();
    server.init();
  } catch (err) {
    console.log(err);
    if (server) {
      server.destroy();
    }
  }
}

main();
