import { canRenderMediaOnWeb, renderMediaOnWeb } from "@remotion/web-renderer";
import { ProductDemo, type ProductDemoProps } from "@/remotion/compositions/ProductDemo";

export const VIDEO = { width: 1280, height: 720, fps: 30 } as const;

const MIN_SECONDS = 9;
const MAX_SECONDS = 120;
const TAIL_SECONDS = 1.5; // let the outro breathe after the voice ends

// This demo uses Remotion under its Free License (non-commercial, individual).
// Forks used by larger companies need a paid license: https://remotion.dev/license
// Set NEXT_PUBLIC_REMOTION_LICENSE_KEY if you have one.
const LICENSE_KEY = process.env.NEXT_PUBLIC_REMOTION_LICENSE_KEY || "free-license";

export function durationInFramesFor(voiceSeconds: number): number {
  const seconds = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, voiceSeconds + TAIL_SECONDS));
  return Math.ceil(seconds * VIDEO.fps);
}

export async function checkBrowserSupport(): Promise<string | null> {
  try {
    const result = await canRenderMediaOnWeb({ ...VIDEO, container: "mp4" });
    if (result.canRender) return null;
    return result.issues.map((i) => i.message).join(" ") || "This browser cannot render video.";
  } catch {
    return "This browser cannot render video. Try a recent version of Chrome or Edge.";
  }
}

export async function renderVideo(
  props: ProductDemoProps,
  voiceSeconds: number,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<string> {
  const { getBlob } = await renderMediaOnWeb({
    composition: {
      id: "ProductDemo",
      component: ProductDemo,
      ...VIDEO,
      durationInFrames: durationInFramesFor(voiceSeconds),
      defaultProps: props,
    },
    inputProps: props,
    container: "mp4",
    licenseKey: LICENSE_KEY,
    onProgress: ({ progress }) => onProgress(progress),
    signal: signal ?? null,
  });
  return URL.createObjectURL(await getBlob());
}
