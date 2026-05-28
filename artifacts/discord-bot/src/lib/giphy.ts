import fetch from "node-fetch";

// Tenor's officially documented public demo key — always available, no registration needed
const TENOR_DEMO_KEY = "LIVDSRZULELA";

const GIPHY_KEY = process.env.GIPHY_API_KEY ?? "";
const TENOR_KEY = process.env.TENOR_API_KEY || TENOR_DEMO_KEY;

export async function fetchGif(query: string): Promise<string | null> {
  // 1. Try Giphy if the user has their own key
  if (GIPHY_KEY) {
    try {
      const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=10&rating=pg-13`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      const json = (await res.json()) as { data: { images: { original: { url: string } } }[] };
      if (json.data?.length) {
        const pick = json.data[Math.floor(Math.random() * json.data.length)];
        return pick.images.original.url;
      }
    } catch { /* fall through */ }
  }

  // 2. Try Tenor (uses your key if set, otherwise the public demo key)
  try {
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=20&contentfilter=medium`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    const json = (await res.json()) as {
      results: { media_formats: { gif?: { url: string }; mediumgif?: { url: string } } }[];
    };
    if (json.results?.length) {
      const pick = json.results[Math.floor(Math.random() * json.results.length)];
      const gifUrl = pick.media_formats.gif?.url ?? pick.media_formats.mediumgif?.url;
      if (gifUrl) return gifUrl;
    }
  } catch { /* fall through */ }

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
    const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(q)}`, {
      signal: AbortSignal.timeout(8_000),
    });
    const json = (await res.json()) as { lyrics?: string; error?: string };
    if (json.lyrics) return { lyrics: json.lyrics.slice(0, 1900), title: song };
    return null;
  } catch {
    return null;
  }
}
