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
  const sectionRegex = new RegExp(
    `Trens amb destinació<\\/span>\\s*<span[^>]*>${destination}<\\/span>[\\s\\S]*?<div class="horarios-calculo">([\\s\\S]*?)<p class="horarios-tip`,
  );
  const sectionMatch = sectionRegex.exec(html);
  if (!sectionMatch) return null;

  const timetableHtml = sectionMatch[1];

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

export function findNextTrain(html, destination) {
  return findNextFromProxims(html, destination) ?? findNextFromTimetable(html, destination);
}
