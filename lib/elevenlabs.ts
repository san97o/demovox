export interface Voiceover {
  url: string; // blob: URL, lives in browser memory
  durationInSeconds: number;
}

export async function generateVoiceover(
  script: string,
  apiKey: string,
  voiceId: string,
  signal?: AbortSignal
): Promise<Voiceover> {
  if (!/^[A-Za-z0-9]{10,40}$/.test(voiceId)) {
    throw new Error("Invalid ElevenLabs voice ID");
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal,
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs error ${res.status}: ${body.slice(0, 300)}`);
  }

  const url = URL.createObjectURL(await res.blob());
  const durationInSeconds = await getAudioDuration(url);
  return { url, durationInSeconds };
}

function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () => reject(new Error("Could not read voiceover duration"));
    audio.src = url;
  });
}
