import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import mime from "mime-types";
import pkg from "whatsapp-web.js";

const { MessageMedia } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, "term_output.txt");

export default {
  name: ".term",
  description: "Executes terminal commands with root shell access",

  async execute(msg, args, client) {
    let command = "";

    // Extract command from body (inline or multiline)
    const body = msg.body.trim();
    if (body.startsWith(".term\n")) {
      command = body.split("\n").slice(1).join("\n").trim();
    } else if (body.startsWith(".term")) {
      command = body.replace(/^\.term\s*/, "").trim();
    }

    // If still no command, try quoted message
    if (!command && msg.hasQuotedMsg) {
      const quoted = await msg.getQuotedMessage();
      command = quoted.body.trim();
    }

    if (!command) return msg.reply("❌ No terminal command provided.");

    exec(command, { shell: "/bin/bash" }, async (error, stdout, stderr) => {
      let output = "";

      if (stdout) output += `📤 stdout:\n${stdout}`;
      if (stderr) output += `\n⚠️ stderr:\n${stderr}`;
      if (error) output += `\n❌ Error:\n${error.message}`;
      if (!output.trim())
        output = "✅ Command executed successfully (no output)";

      if (output.length > 2000) {
        fs.writeFileSync(OUTPUT_FILE, output);
        const media = new MessageMedia(
          mime.lookup(OUTPUT_FILE) || "text/plain",
          fs.readFileSync(OUTPUT_FILE).toString("base64"),
          "output.txt",
        );
        await msg.reply(media, {
          caption: "✅ Output too long. Sent as file.",
        });
        fs.unlinkSync(OUTPUT_FILE);
      } else {
        await msg.reply("```" + output.trim() + "```");
      }
    });
  },
};
