Deno.serve(async (req) => {
  const reqUrl = new URL(req.url);
  const origin = reqUrl.origin;

  // 1. Buat proxy universal
  const target = reqUrl.searchParams.get("url");
  if (target) {
    const r = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 14)",
        "Referer": "https://www.rctiplus.com/",
        "Origin": "https://www.rctiplus.com"
      }
    });
    return new Response(r.body, {
      headers: {
        "Content-Type": r.headers.get("Content-Type") || "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // 2. Kalau buka /rcti.m3u8
  if (reqUrl.pathname.includes("rcti")) {
    const r = await fetch("https://r-plus.sedotcw3.workers.dev/index.m3u8?id=rcti", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 14)",
        "Referer": "https://www.rctiplus.com/"
      }
    });
    let txt = await r.text();
    const base = "https://r-plus.sedotcw3.workers.dev/";
    txt = txt.split("\n").map(l => {
      l = l.trim();
      if (!l || l.startsWith("#")) return l;
      let abs = l.startsWith("http") ? l : base + l;
      return `${origin}/?url=${encodeURIComponent(abs)}`;
    }).join("\n");
    return new Response(txt, { headers: { "Content-Type": "application/vnd.apple.mpegurl", "Access-Control-Allow-Origin": "*" } });
  }

  // 3. Halaman utama = playlist M3U yang udah jadi
  const playlist = `#EXTM3U
#EXTINF:-1 tvg-name="RCTI" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/0/05/RCTI_logo_2015.png" group-title="MNC Group", RCTI HD
${origin}/rcti.m3u8
#EXTINF:-1 tvg-name="INDOSIAR" group-title="Nasional", INDOSIAR HD
${origin}/?url=${encodeURIComponent("https://www.vidio.com/live/171-indosiar")}
`;

  return new Response(playlist, {
    headers: { "Content-Type": "application/vnd.apple.mpegurl", "Access-Control-Allow-Origin": "*" }
  });
});
