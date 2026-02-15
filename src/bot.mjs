import "dotenv/config";
import { Bot, Keyboard } from "grammy";
import { routes } from "./config.mjs";
import { fetchStationHtml } from "./api.mjs";
import { findNextTrain } from "./parser.mjs";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN environment variable");
  process.exit(1);
}

const bot = new Bot(token);

const keyboard = routes
  .reduce((kb, route) => kb.text(route.label).row(), new Keyboard())
  .resized()
  .persistent();

bot.command("start", (ctx) => {
  console.log(`[start] @${ctx.from?.username ?? ctx.from?.id}`);
  return ctx.reply("Prem el botó per consultar el pròxim tren.", {
    reply_markup: keyboard,
  });
});

for (const route of routes) {
  bot.hears(route.label, async (ctx) => {
    console.log(`[${route.logTag}] @${ctx.from?.username ?? ctx.from?.id}`);
    try {
      const html = await fetchStationHtml(route.stationId);
      const minutes = findNextTrain(html, route.destination);
      if (minutes) {
        await ctx.reply(`En ${minutes}.`, { reply_markup: keyboard });
      } else {
        await ctx.reply("No s'ha trobat cap tren proper.", {
          reply_markup: keyboard,
        });
      }
    } catch (err) {
      console.error(err);
      await ctx.reply("Error a l'obtindre les dades del tren.", {
        reply_markup: keyboard,
      });
    }
  });
}

bot.start();
console.log("Bot is running...");
