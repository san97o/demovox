import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

export interface ProductDemoProps {
  title: string;
  tagline: string;
  screenshots: string[];
  voiceover_url: string;
  accent_color?: string;
  [key: string]: unknown;
}

const ACCENT = "#00e128";

function Scene({
  children,
  from,
  durationInFrames,
}: {
  children: React.ReactNode;
  from: number;
  durationInFrames: number;
}) {
  return (
    <Sequence from={from} durationInFrames={durationInFrames}>
      {children}
    </Sequence>
  );
}

function FadeIn({
  children,
  delay = 0,
  fps,
}: {
  children: React.ReactNode;
  delay?: number;
  fps: number;
}) {
  const frame = useCurrentFrame();
  const opacity = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 80, mass: 0.5 },
    durationInFrames: 30,
  });
  const y = interpolate(Math.max(0, frame - delay), [0, 20], [24, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>
  );
}

// Title scene: product name + tagline
function TitleScene({
  title,
  tagline,
  accent,
  fps,
}: {
  title: string;
  tagline: string;
  accent: string;
  fps: number;
}) {
  return (
    <AbsoluteFill
      style={{
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <FadeIn fps={fps}>
        <p
          style={{
            color: accent,
            fontSize: 13,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          Product Demo
        </p>
      </FadeIn>
      <FadeIn delay={8} fps={fps}>
        <h1
          style={{
            color: "#fff",
            fontSize: 72,
            fontWeight: 200,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {title}
        </h1>
      </FadeIn>
      <FadeIn delay={16} fps={fps}>
        <p
          style={{
            color: "#888",
            fontSize: 20,
            fontWeight: 300,
            marginTop: 20,
            letterSpacing: "0.02em",
          }}
        >
          {tagline}
        </p>
      </FadeIn>
      {/* Bottom rule */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 80,
          right: 80,
          height: 1,
          background: "#222",
        }}
      />
    </AbsoluteFill>
  );
}

// Screenshot scene: fills screen with a screenshot + label
function ScreenshotScene({
  src,
  index,
  fps,
  accent,
}: {
  src: string;
  index: number;
  fps: number;
  accent: string;
}) {
  const frame = useCurrentFrame();
  const scale = spring({
    frame,
    fps,
    config: { damping: 25, stiffness: 60, mass: 0.8 },
    durationInFrames: 40,
  });
  const scaledVal = interpolate(scale, [0, 1], [1.04, 1]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div
        style={{
          position: "absolute",
          inset: 48,
          border: "1px solid #222",
          overflow: "hidden",
        }}
      >
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scaledVal})`,
            transformOrigin: "center",
          }}
        />
      </div>
      {/* Step label */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 48,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
        <span
          style={{
            color: "#555",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: "sans-serif",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
    </AbsoluteFill>
  );
}

// Outro scene
function OutroScene({
  title,
  accent,
  fps,
}: {
  title: string;
  accent: string;
  fps: number;
}) {
  return (
    <AbsoluteFill
      style={{
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <FadeIn fps={fps}>
        <div
          style={{
            width: 40,
            height: 1,
            background: accent,
            marginBottom: 32,
          }}
        />
      </FadeIn>
      <FadeIn delay={8} fps={fps}>
        <p
          style={{
            color: "#fff",
            fontSize: 36,
            fontWeight: 200,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </p>
      </FadeIn>
      <FadeIn delay={16} fps={fps}>
        <p
          style={{
            color: accent,
            fontSize: 13,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginTop: 16,
          }}
        >
          Try it today
        </p>
      </FadeIn>
    </AbsoluteFill>
  );
}

export function ProductDemo({
  title,
  tagline,
  screenshots,
  voiceover_url,
  accent_color,
}: ProductDemoProps) {
  const { fps, durationInFrames } = useVideoConfig();
  const accent = accent_color ?? ACCENT;

  // Distribute screenshots evenly across the middle of the video
  // Layout: title (3s) | screenshots spread evenly | outro (3s)
  const titleDuration = fps * 3;
  const outroDuration = fps * 3;
  const middleDuration = durationInFrames - titleDuration - outroDuration;
  const perShot =
    screenshots.length > 0
      ? Math.floor(middleDuration / screenshots.length)
      : middleDuration;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Voiceover */}
      {voiceover_url ? <Audio src={voiceover_url} /> : null}

      {/* Title */}
      <Scene from={0} durationInFrames={titleDuration}>
        <TitleScene title={title} tagline={tagline} accent={accent} fps={fps} />
      </Scene>

      {/* Screenshots */}
      {screenshots.map((src, i) => (
        <Scene
          key={`${i}-${src.slice(-16)}`}
          from={titleDuration + i * perShot}
          durationInFrames={perShot}
        >
          <ScreenshotScene src={src} index={i} fps={fps} accent={accent} />
        </Scene>
      ))}

      {/* Outro */}
      <Scene
        from={durationInFrames - outroDuration}
        durationInFrames={outroDuration}
      >
        <OutroScene title={title} accent={accent} fps={fps} />
      </Scene>
    </AbsoluteFill>
  );
}
