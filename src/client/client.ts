import { logger } from "../lib/logger";
import type { Message } from "../lib/types";

class SocketClient {
  private readonly logger = logger.child({ module: "client" });
  private ws: WebSocket | undefined;
  private listening = false;
  private currentAttempt: number = 0;
  private backoffTime: number = 1000;
  private maxAttempts: number = 30;
  private timer: Timer | undefined;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  private send(message: Message) {
    if (this.ws) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private onMessage(event: MessageEvent<string>) {
    const message = JSON.parse(event.data) as Message;
    this.logger.info(`Received message from server: [${message.type}])`);

    switch (message.type) {
      case "OPEN":
        this.send({ type: "YEET", message: "TOM" });
        break;
      case "AI":
        this.logger.info(message.message);
        this.logger.info("Enter a prompt: ");
        break;
      default:
        break;
    }
  }

  private onOpen() {
    this.logger.info("Socket connection opened");

    this.currentAttempt = 0;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private onError(event: Event) {
    this.logger.error("ERROR!");
  }

  private onClose(event: any) {
    if (this.listening) {
      this.removeListeners();
    }

    this.ws?.close();
    this.ws = undefined;

    this.currentAttempt++;
    this.logger.info(
      `WebSocket connection failed. Trying to reconnect. This is attempt ${this.currentAttempt} of ${this.maxAttempts}`,
    );

    if (this.currentAttempt >= this.maxAttempts) {
      this.logger.error("Failed to establish WebSocket connection.");
      return;
    }

    const backoffTimeMilliseconds =
      this.backoffTime * Math.pow(1.5, this.currentAttempt);

    this.timer = setTimeout(this.init.bind(this), backoffTimeMilliseconds);
    this.logger.info(
      `Next reconnection attempt in ${backoffTimeMilliseconds}ms.`,
    );
  }

  private addListeners() {
    if (this.ws) {
      this.logger.info("Adding listeners...");
      this.ws.addEventListener("open", this.onOpen.bind(this));
      this.ws.addEventListener("close", this.onClose.bind(this));
      this.ws.addEventListener("error", this.onError.bind(this));
      this.ws.addEventListener("message", this.onMessage.bind(this));
      this.listening = true;
    }
  }

  private removeListeners() {
    if (this.ws && this.listening) {
      this.ws.removeEventListener("open", this.onOpen.bind(this));
      this.ws.removeEventListener("close", this.onClose.bind(this));
      this.ws.removeEventListener("error", this.onError.bind(this));
      this.ws.removeEventListener("message", this.onMessage.bind(this));
      this.listening = false;
    }
  }

  init() {
    this.ws = new WebSocket(`${this.url}`);
    this.addListeners();
  }

  destroy() {
    if (this.ws) {
      this.removeListeners();
      this.ws.close();
      this.ws = undefined;
    }
  }

  async listenToCli() {
    const prompt = "Enter a prompt: ";
    this.logger.info(prompt);
    for await (const line of console) {
      this.send({ type: "PROMPT", message: line });
      this.logger.info("Sent, waiting for response...");
    }
  }
}

async function main() {
  const ws = new SocketClient("ws://localhost:8080");
  ws.init();
  ws.listenToCli();
}

main();
