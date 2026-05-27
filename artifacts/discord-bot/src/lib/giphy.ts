import fetch from "node-fetch";

const GIPHY_KEY = process.env.GIPHY_API_KEY ?? "";
const TENOR_KEY = process.env.TENOR_API_KEY ?? "";

export async function fetchGif(query: string): Promise<string | null> {
  if (GIPHY_KEY) {
    try {
      const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=10&rating=pg-13`;
      const res = await fetch(url);
      const json = (await res.json()) as { data: { images: { original: { url: string } } }[] };
      if (json.data?.length) {
        const pick = json.data[Math.floor(Math.random() * json.data.length)];
        return pick.images.original.url;
      }
    } catch { /* fall through */ }
  }

  if (TENOR_KEY) {
    try {
      const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=10`;
      const res = await fetch(url);
      const json = (await res.json()) as { results: { media_formats: { gif: { url: string } } }[] };
      if (json.results?.length) {
        const pick = json.results[Math.floor(Math.random() * json.results.length)];
        return pick.media_formats.gif.url;
      }
    } catch { /* fall through */ }
  }

  return null;
}

export async function fetchLyrics(song: string): Promise<{ lyrics: string; title: string } | null> {
  try {
    const parts = song.split(" - ");
    let artist = parts[0];
    let title = parts[1] ?? parts[0];
    if (!parts[1]) {
      artist = "";
      title = parts[0];
    }
    const q = artist ? `${artist}/${title}` : title;
    const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(q)}`);
    const json = (await res.json()) as { lyrics?: string; error?: string };
    if (json.lyrics) return { lyrics: json.lyrics.slice(0, 1900), title: song };
    return null;
  } catch {
    return null;
  }
}
