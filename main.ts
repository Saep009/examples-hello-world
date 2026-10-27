Deno.serve(async () => {
  const r = await fetch("https://www.vidio.com/live/171-indosiar", {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  const html = await r.text();
  const found = html.match(/https:\/\/etslive[^"']+\.m3u8[^"']*/);
  if (!found) return new Response("gagal ambil", { status: 500 });
  let url = found[0].replace(/\\u002F/g, "/").replace(/\\/g, "");
  const res = await fetch(url);
  let m3u8 = await res.text();
  const base = url.slice(0, url.lastIndexOf("/") + 1);
  m3u8 = m3u8.split("\n").map(v => {
    v = v.trim();
    if (!v || v.startsWith("#")) return v;
    return v.startsWith("http") ? v : base + v;
  }).join("\n");
  return new Response(m3u8, {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Access-Control-Allow-Origin": "*"
    }
  });
});