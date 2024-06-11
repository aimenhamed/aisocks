import { openai } from "@ai-sdk/openai";
import { generateText, type LanguageModel } from "ai";
import { logger } from "./logger";

export class AI {
  private readonly logger = logger.child({ module: "ai" });
  private readonly model: LanguageModel;

  constructor() {
    this.model = openai("gpt-3.5-turbo");
    this.logger.info("OPENAI Model success");
  }

  async chat(prompt: string) {
    const result = await generateText({
      model: this.model,
      prompt,
    });
    return result.text;
  }
}
