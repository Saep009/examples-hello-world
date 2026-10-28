Deno.serve(async (req) => {
  const reqUrl = new URL(req.url);
  const origin = reqUrl.origin;

  // proxy video
  const target = reqUrl.searchParams.get("url");
  if (target) {
    const r = await fetch(target, { headers: { "Referer": "https://www.vidio.com/", "User-Agent": "Mozilla/5.0" } });
    return new Response(r.body, { 
      headers: { 
        "Content-Type": r.headers.get("Content-Type") || "video/mp2t",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      } 
    });
  }

  // ambil token Indosiar fresh tiap request
  const htmlRes = await fetch("https://www.vidio.com/live/171-indosiar", {
    headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10)", "Referer": "https://www.vidio.com/" }
  });
  const html = await htmlRes.text();
  const match = html.match(/https:\/\/etslive[^"']+\.m3u8[^"']*/);
  if (!match) return new Response("gagal ambil token", { status: 500 });
  
  let masterUrl = match[0].replace(/\\u002F/g, "/").replace(/\\/g, "");
  const masterRes = await fetch(masterUrl, { headers: { "Referer": "https://www.vidio.com/" } });
  let masterText = await masterRes.text();
  const base = masterUrl.slice(0, masterUrl.lastIndexOf("/") + 1);

  // ubah semua chunk biar lewat Deno kamu (biar gak ke-block IP)
  masterText = masterText.split("\n").map(line => {
    line = line.trim();
    if (!line || line.startsWith("#")) return line;
    const abs = line.startsWith("http") ? line : base + line;
    return `${origin}/?url=${encodeURIComponent(abs)}`;
  }).join("\n");

  return new Response(masterText, {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache"
    }
  });
});