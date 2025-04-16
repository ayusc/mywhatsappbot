import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia, Poll, GroupChat } = pkg;

// Required for resolving __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: ".carbon",
  description: "Generate a code snippet image using Carbon",

  async execute(msg, args, client) {
    let code = "";

    // Case 1: command is replying to a message
    if (msg.hasQuotedMsg) {
      const quoted = await msg.getQuotedMessage();
      code = quoted.body.trim();
    }
    // Case 2: message has body text (including multiline)
    else {
      // remove `.carbon` prefix from msg.body
      code = msg.body.replace(/^\.carbon\s*/, "");
    }

    if (!code) {
      return msg.reply("❌ Please provide some code to render.");
    }

    // Normalize indentation (optional, but keeps things clean)
    code = code
      .split("\n")
      .map((line) => line.trimStart())
      .join("\n");

    // API request to Carbonara
    const response = await fetch("https://carbonara.solopov.dev/api/cook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        backgroundColor: "#FFFFFF",
        theme: "3024-night",
      }),
    });

    if (!response.ok) {
      return msg.reply("⚠️ Failed to generate image from code.");
    }

    const buffer = await response.buffer();

    // Save to temporary file
    const filePath = path.join(__dirname, "code.png");
    fs.writeFileSync(filePath, buffer);

    const carbonimg = await MessageMedia.fromFilePath(filePath);

    // Send the image as a reply
    await msg.reply(carbonimg);

    // Clean up
    fs.unlinkSync(filePath);
  },
};
