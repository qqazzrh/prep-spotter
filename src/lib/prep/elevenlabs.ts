export async function elevenLabsTTS(text: string): Promise<string> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_ELEVENLABS_API_KEY");
  // ElevenLabs has a hard cap; keep it well under 5k chars.
  const safe = text.slice(0, 4500);
  const res = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: safe,
        model_id: "eleven_turbo_v2_5",
      }),
    }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${t.slice(0, 200)}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
