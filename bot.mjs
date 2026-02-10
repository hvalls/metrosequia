import "dotenv/config";
import { Bot, Keyboard } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Missing TELEGRAM_BOT_TOKEN environment variable");
  process.exit(1);
}

const bot = new Bot(token);

const keyboard = new Keyboard()
  .text("Pròxim tren de Foios a València")
  .row()
  .text("Pròxim tren de Xàtiva a Foios")
  .row()
  .text("Pròxim tren de Benimaclet a Foios")
  .resized()
  .persistent();

const API_URL =
  "https://www.metrovalencia.es/wp-content/themes/metrovalencia/functions/ajax-no-wp.php";

async function fetchStationHtml(estacion) {
  const today = new Date().toISOString().slice(0, 10);

  const body = new URLSearchParams({
    action: "formularios_ajax",
    data: `action=horarios-estacion&estacion=${estacion}&dia=${today}`,
  });

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Origin: "https://www.metrovalencia.es",
      Referer:
        "https://www.metrovalencia.es/ca/consulta-horaris-i-planificador/",
      Cookie: "wp-wpml_current_language=ca",
    },
    body,
  });

  const json = await res.json();
  return json.html;
}

function findNextFromProxims(html, destination) {
  const entryRegex =
    /<div class="info-estacion w100 item--proximos">[\s\S]*?<div class="nombre-estacion">(.*?)<\/div>[\s\S]*?<span class="minutos c-negro">(.*?)<\/span>/g;

  let match;
  while ((match = entryRegex.exec(html)) !== null) {
    if (match[1].trim() === destination) return match[2].trim();
  }
  return null;
}

function findNextFromTimetable(html, destination) {
  // Find the timetable section for the given destination
  const sectionRegex = new RegExp(
    `Trens amb destinació<\\/span>\\s*<span[^>]*>${destination}<\\/span>[\\s\\S]*?<div class="horarios-calculo">([\\s\\S]*?)<p class="horarios-tip`,
  );
  const sectionMatch = sectionRegex.exec(html);
  if (!sectionMatch) return null;

  const timetableHtml = sectionMatch[1];

  // Parse all hour blocks
  const hourBlockRegex =
    /<div class="df-s">\s*<p class="hora">(\d{2})<\/p>([\s\S]*?)<\/div>/g;
  const minuteRegex = /<p class="minuto[^"]*">(\d{2})<\/p>/g;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let bestDiff = Infinity;

  let hourMatch;
  while ((hourMatch = hourBlockRegex.exec(timetableHtml)) !== null) {
    const hour = parseInt(hourMatch[1], 10);
    const minutesHtml = hourMatch[2];

    let minMatch;
    minuteRegex.lastIndex = 0;
    while ((minMatch = minuteRegex.exec(minutesHtml)) !== null) {
      const minute = parseInt(minMatch[1], 10);
      const diff = hour * 60 + minute - nowMinutes;
      if (diff > 0 && diff < bestDiff) bestDiff = diff;
    }
  }

  if (bestDiff === Infinity) return null;
  return `${bestDiff} min`;
}

// Foios (estacion=59) → València (destination: Aeroport)
async function getNextFoiosValencia() {
  const html = await fetchStationHtml("59");
  return findNextFromProxims(html, "Aeroport");
}

// Xàtiva (estacion=71) → Foios (destination: Rafelbunyol)
async function getNextXativaFoios() {
  const html = await fetchStationHtml("71");
  return findNextFromProxims(html, "Rafelbunyol") ?? findNextFromTimetable(html, "Rafelbunyol");
}

// Benimaclet (estacion=67) → Foios (destination: Rafelbunyol)
async function getNextBenimacletFoios() {
  const html = await fetchStationHtml("67");
  return findNextFromProxims(html, "Rafelbunyol") ?? findNextFromTimetable(html, "Rafelbunyol");
}

async function replyFoiosValencia(ctx) {
  try {
    const minutes = await getNextFoiosValencia();
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
}

async function replyXativaFoios(ctx) {
  try {
    const minutes = await getNextXativaFoios();
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
}

bot.command("start", (ctx) => {
  console.log(`[start] @${ctx.from?.username ?? ctx.from?.id}`);
  return ctx.reply("Prem el botó per consultar el pròxim tren.", {
    reply_markup: keyboard,
  });
});

async function replyBenimacletFoios(ctx) {
  try {
    const minutes = await getNextBenimacletFoios();
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
}

bot.hears("Pròxim tren de Foios a València", (ctx) => {
  console.log(`[foios→valència] @${ctx.from?.username ?? ctx.from?.id}`);
  return replyFoiosValencia(ctx);
});
bot.hears("Pròxim tren de Xàtiva a Foios", (ctx) => {
  console.log(`[xàtiva→foios] @${ctx.from?.username ?? ctx.from?.id}`);
  return replyXativaFoios(ctx);
});
bot.hears("Pròxim tren de Benimaclet a Foios", (ctx) => {
  console.log(`[benimaclet→foios] @${ctx.from?.username ?? ctx.from?.id}`);
  return replyBenimacletFoios(ctx);
});

bot.start();
console.log("Bot is running...");
