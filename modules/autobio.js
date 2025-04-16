import fetch from "node-fetch";

let interval = null;
let lastQuote = "";

export const autobioInterval = () => interval;

async function runQuoteUpdate() {
  try {
    let quote = "";
    let attempts = 0;

    while (quote.length === 0 || quote.length > 139 || quote === lastQuote) {
      const res = await fetch("https://quotes-api-self.vercel.app/quote");
      const data = await res.json();
      quote = `${data.quote} —${data.author}`;
      //console.log(`Fetched quote: "${quote}"`);
      attempts++;

      if (attempts >= 10) {
        console.warn(
          "⚠️ Failed to find a new short quote after 10 attempts. Skipping...",
        );
        return null;
      }
    }

    lastQuote = quote;
    return quote;
  } catch (err) {
    console.error("❌ Error fetching quote:", err.message);
    return null;
  }
}

export default {
  name: ".autobio",
  description:
    'Start updating WhatsApp "About" with motivational quotes every X seconds (default 60s)',

  async execute(msg, args, client) {
    const AUTO_BIO_INTERVAL = process.env.AUTO_BIO_INTERVAL_MS || 60000;

    if (interval) {
      await msg.reply("⚠️ AutoBio is already running!");
      return;
    }

    await msg.reply(
      `✅ AutoBio started.\nUpdating every ${AUTO_BIO_INTERVAL / 1000}s`,
    );

    const now = Date.now();
    const nextAligned = Math.ceil(now / AUTO_BIO_INTERVAL) * AUTO_BIO_INTERVAL;
    const delay = nextAligned - now;

    setTimeout(async () => {
      const quote = await runQuoteUpdate();
      if (quote) {
        try {
          await client.setStatus(quote);
          console.log(`✅ About updated"`);
        } catch (err) {
          console.error("❌ Failed to set initial About status:", err.message);
        }
      }

      interval = setInterval(async () => {
        const quote = await runQuoteUpdate();
        if (quote) {
          try {
            await client.setStatus(quote);
            console.log(`✅ About updated"`);
          } catch (err) {
            console.error("❌ Failed to update About:", err.message);
          }
        }
      }, AUTO_BIO_INTERVAL);
    }, delay);
  },
};

export { interval };
