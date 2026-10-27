Deno.serve(async (req) => {
  const reqUrl = new URL(req.url);
  
  // kalau ada ?url= berarti lagi proxy video
  const target = reqUrl.searchParams.get("url");
  if (target) {
    const r = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.vidio.com/" }
    });
    return new Response(r.body, {
      headers: {
        "Content-Type": r.headers.get("Content-Type") || "video/mp2t",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // ambil playlist asli
  const r = await fetch("https://www.vidio.com/live/171-indosiar", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await r.text();
  const m = html.match(/https:\/\/etslive[^"']+\.m3u8[^"']*/);
  if (!m) return new Response("gagal", { status: 500 });
  let u = m[0].replace(/\\u002F/g, "/").replace(/\\/g, "");
  
  const res = await fetch(u, { headers: { "Referer": "https://www.vidio.com/" } });
  let txt = await res.text();
  const base = u.slice(0, u.lastIndexOf("/") + 1);
  const origin = reqUrl.origin;

  txt = txt.split("\n").map(line => {
    line = line.trim();
    if (!line || line.startsWith("#")) return line;
    let abs = line.startsWith("http") ? line : base + line;
    return `${origin}/?url=${encodeURIComponent(abs)}`;
  }).join("\n");

  return new Response(txt, {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Access-Control-Allow-Origin": "*"
    }
  });
});