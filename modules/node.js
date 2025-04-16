import fs from "fs";
import path from "path";
import mime from "mime-types";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import pkg from "whatsapp-web.js";

const { MessageMedia } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, "node_output.txt");

// Create a CommonJS-compatible require function
const require = createRequire(import.meta.url);

export default {
  name: ".node",
  description: "Executes Node.js code with WhatsApp context (msg, client)",

  async execute(msg, args, client) {
    let code = "";

    // Extract code from current message
    if (msg.body.trim().startsWith(".node\n")) {
      code = msg.body.split("\n").slice(1).join("\n").trim();
    } else {
      code = msg.body.replace(/^\.node\s*/, "").trim();
    }

    // If no code and the message is a reply, try to extract code from the replied message
    if (!code && msg.hasQuotedMsg) {
      const quoted = await msg.getQuotedMessage();
      code = quoted.body.trim();
    }

    if (!code) return msg.reply("❌ No code provided.");

    // Capture console output
    let logOutput = "";
    const originalLog = console.log;
    console.log = (...args) => {
      logOutput +=
        args
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a, null, 2)))
          .join(" ") + "\n";
    };

    try {
      // Provide `require` and CommonJS compatibility inside user code
      const asyncFunc = new Function(
        "msg",
        "client",
        "require",
        `
          return (async () => {
            let message = msg;
            ${code}
          })();
        `,
      );

      const result = await asyncFunc(msg, client, require);

      console.log = originalLog; // Restore console.log

      let finalOutput = "";

      if (logOutput) finalOutput += `📥 console.log:\n${logOutput}`;
      if (result !== undefined)
        finalOutput += `\n✅ Result:\n${JSON.stringify(result, null, 2)}`;
      if (!finalOutput)
        finalOutput = "✅ Code executed successfully (no return value)";

      // Avoid sending large output directly
      if (finalOutput.length > 2000) {
        fs.writeFileSync(OUTPUT_FILE, finalOutput);
        const media = new MessageMedia(
          mime.lookup(OUTPUT_FILE) || "text/plain",
          fs.readFileSync(OUTPUT_FILE).toString("base64"),
          "output.txt",
        );
        await client.sendMessage(msg.from, media, {
          caption: "✅ Output too long. Sent as file.",
          quotedMessage: msg,
        });
        fs.unlinkSync(OUTPUT_FILE);
      } else {
        await msg.reply("```" + finalOutput.trim() + "```");
      }
    } catch (err) {
      console.log = originalLog;
      await msg.reply("❌ Error:\n```" + err.message + "```");
    }
  },
};
