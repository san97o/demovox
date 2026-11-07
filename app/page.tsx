import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-black text-white overflow-hidden">

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-[#222]">
        <span className="text-sm font-medium tracking-widest uppercase">DemoVox</span>
        <nav className="flex items-center gap-8">
          <a href="#how" className="text-xs tracking-widest uppercase text-[#888] hover:text-white transition-colors">
            How it works
          </a>
          <Link href="/costs" className="text-xs tracking-widest uppercase text-[#888] hover:text-white transition-colors">
            Costs
          </Link>
          <Link href="/studio" className="text-xs tracking-widest uppercase text-[#888] hover:text-white transition-colors">
            Studio
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col justify-center px-8 py-24 max-w-7xl mx-auto w-full">
        <p className="eyebrow mb-6">AI Video Generation</p>

        <h1 className="text-[clamp(3.5rem,9vw,7.5rem)] font-[200] leading-[1.0] tracking-[-0.03em] max-w-4xl">
          Describe.<br />
          Generate.<br />
          <span className="text-[#00e128]">Ship.</span>
        </h1>

        <p className="mt-8 text-base text-[#888] font-[300] leading-relaxed max-w-md">
          Turn a plain-language product description and a few screenshots
          into a narrated demo video. Runs entirely in your browser, with
          your own API keys.
        </p>

        <div className="mt-12 flex items-center gap-6">
          <Link
            href="/studio"
            className="inline-flex items-center gap-3 border border-[#00e128] text-[#00e128] text-sm tracking-widest uppercase px-6 py-3 hover:bg-[#00e128] hover:text-black transition-all duration-200 font-[400]"
          >
            Start Creating
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <a href="#how" className="text-xs tracking-widest uppercase text-[#555] hover:text-[#888] transition-colors">
            See how it works
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-24 grid grid-cols-3 gap-0 border-t border-[#222] max-w-2xl">
          {[
            { value: "1", label: "Prompt to start" },
            { value: "720p", label: "MP4 export" },
            { value: "0", label: "Backend servers" },
          ].map(({ value, label }, i) => (
            <div
              key={label}
              className={`pt-8 ${i > 0 ? "border-l border-[#222] pl-8" : ""} ${i < 2 ? "pr-8" : ""}`}
            >
              <p className="text-3xl font-[200] tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-[#555] tracking-wide uppercase">{label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* How it works — full viewport section */}
      <section
        id="how"
        className="relative z-10 border-t border-[#222] min-h-screen flex flex-col justify-center"
      >
        <div className="max-w-7xl mx-auto w-full px-8 py-24">
          <p className="eyebrow mb-20">How it works</p>

          <div className="grid grid-cols-1 gap-16 sm:grid-cols-3 sm:gap-0">
            {[
              {
                num: "01",
                title: "Describe",
                desc: "Add your Anthropic and ElevenLabs keys, then tell the agent what your product does and attach a few screenshots.",
              },
              {
                num: "02",
                title: "Generate",
                desc: "Claude writes the script, ElevenLabs records the narration, and the video renders in your browser tab.",
              },
              {
                num: "03",
                title: "Download",
                desc: "Download a ready-to-publish MP4. Your keys, screenshots and video never touch a DemoVox server — there isn't one.",
              },
            ].map(({ num, title, desc }, i) => (
              <div
                key={num}
                className={`flex flex-col gap-8 sm:px-12 ${
                  i === 0 ? "sm:pl-0" : "sm:border-l border-[#222]"
                } ${i === 2 ? "sm:pr-0" : ""}`}
              >
                <p className="text-[clamp(5rem,10vw,8rem)] font-[200] leading-none tracking-[-0.04em] text-[#00e128]">
                  {num}
                </p>
                <div>
                  <p className="text-2xl font-[200] tracking-tight mb-4">{title}</p>
                  <p className="text-sm text-[#666] leading-relaxed font-[300] max-w-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="relative z-10 border-t border-[#222]">
        <div className="max-w-7xl mx-auto px-8 py-16 flex items-center justify-between">
          <p className="text-2xl font-[200] tracking-tight max-w-xs">
            Ready to generate your first video?
          </p>
          <Link
            href="/studio"
            className="inline-flex items-center gap-3 border border-[#00e128] text-[#00e128] text-sm tracking-widest uppercase px-6 py-3 hover:bg-[#00e128] hover:text-black transition-all duration-200 shrink-0"
          >
            Open Studio
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#222] px-8 py-6 flex items-center justify-between">
        <span className="text-xs tracking-widest uppercase text-[#444]">DemoVox</span>
        <a
          href="https://github.com/san97o/demovox"
          className="text-xs text-[#444] hover:text-[#888] transition-colors"
        >
          Personal demo by @san97o · Source on GitHub
        </a>
      </footer>
    </div>
  );
}
