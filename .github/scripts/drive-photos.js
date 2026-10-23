// 구글 드라이브 '여행사진' 폴더(링크가 있는 모든 사용자 보기)의 사진 목록을 photos.json 으로 만듭니다.
// 시작 폴더 안에 '여행사진' 하위 폴더가 있으면 그 폴더를 쓰고, 그 안의 하위 폴더까지 모두 모읍니다.
const fs = require("fs");
const ROOT = process.env.PHOTO_FOLDER;
const PICK = "여행사진";

const dec = s => s.replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
const bare = s => s.replace(/\s+/g, "");

async function folder(id) {
  const r = await fetch("https://drive.google.com/embeddedfolderview?id=" + id, { headers: { "Accept-Language": "ko" } });
  if (!r.ok) throw new Error("폴더를 열 수 없습니다 (" + r.status + "): " + id);
  const h = await r.text();
  const title = dec((h.match(/<title>([^<]*)<\/title>/) || [])[1] || "");
  const entries = [];
  const re = /<div class="flip-entry" id="entry-([\w-]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]*)<\/div>/g;
  let m;
  while ((m = re.exec(h))) entries.push({ id: m[1], name: dec(m[3]), dir: /\/folders\//.test(m[2]) });
  if (!title && !entries.length) throw new Error("공개되지 않은 폴더이거나 형식이 바뀌었습니다: " + id);
  return { title, entries };
}

const IMG = /\.(jpe?g|png|heic|heif|webp|gif)$/i, VID = /\.(mp4|mov|m4v|3gp|avi|webm)$/i;

async function collect(id, group, depth, out) {
  const f = await folder(id);
  const files = f.entries.filter(e => !e.dir), dirs = f.entries.filter(e => e.dir);
  files.forEach(e => {
    if (IMG.test(e.name)) out.push({ id: e.id, n: e.name, g: group });
    else if (VID.test(e.name)) out.push({ id: e.id, n: e.name, g: group, v: 1 });
  });
  if (depth < 3) for (const d of dirs) await collect(d.id, group ? group + " · " + d.name : d.name, depth + 1, out);
}

(async () => {
  let id = ROOT, top = await folder(ROOT);
  const sub = top.entries.find(e => e.dir && bare(e.name) === PICK);
  if (bare(top.title) !== PICK && sub) { id = sub.id; top = await folder(id); }
  const items = [];
  await collect(id, "", 0, items);
  const coll = new Intl.Collator("ko", { numeric: true });
  items.sort((a, b) => coll.compare(a.g, b.g) || coll.compare(a.n, b.n));
  fs.writeFileSync("photos.json", JSON.stringify({ folder: id, title: top.title, items }, null, 1) + "\n");
  console.log(top.title + " (" + id + "): " + items.length + "개");
  if (items[0]) {
    const r = await fetch("https://lh3.googleusercontent.com/d/" + items[0].id + "=w480");
    console.log("썸네일 확인: " + r.status + " " + r.headers.get("content-type"));
  }
})().catch(e => { console.error(e.message); process.exit(1); });
