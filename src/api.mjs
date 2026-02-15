const API_URL =
  "https://www.metrovalencia.es/wp-content/themes/metrovalencia/functions/ajax-no-wp.php";

export async function fetchStationHtml(stationId) {
  const today = new Date().toISOString().slice(0, 10);

  const body = new URLSearchParams({
    action: "formularios_ajax",
    data: `action=horarios-estacion&estacion=${stationId}&dia=${today}`,
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
