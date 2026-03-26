import { useState, useEffect, useRef, useCallback } from 'react';
import { assets } from '../assets/assets';
import { Link } from 'react-router-dom';

const SLIDES = [
  {
    tag: 'NEW ARRIVALS',
    title: 'Elevate Your\nStyle',
    desc: 'Discover timeless fashion crafted for modern living.',
    cta: 'Shop Collection',
    link: '/collection',
    img: assets.hero_image3,
  },
  {
    tag: 'LIMITED COLLECTION',
    title: 'Summer\nEssentials',
    desc: 'Lightweight pieces designed for effortless comfort.',
    cta: 'Explore Now',
    link: '/collection',
    img: assets.hero_img2,
  },
  {
    tag: 'SPECIAL OFFER',
    title: 'Up to 40%\nOff',
    desc: 'Premium quality fashion at exclusive prices.',
    cta: 'Shop Deals',
    link: '/collection',
    img: assets.hero_img1,
  },
];

const INTERVAL = 6000;

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const progRef = useRef(null);
  const startRef = useRef(Date.now());

  const goTo = useCallback(
    (idx) => {
      if (idx === current) return;
      setCurrent(idx);
      setProgress(0);
      setAnimKey((k) => k + 1);
      startRef.current = Date.now();
    },
    [current],
  );

  const goNext = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);
  const goPrev = useCallback(
    () => goTo((current - 1 + SLIDES.length) % SLIDES.length),
    [current, goTo],
  );

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(goNext, INTERVAL);
    return () => clearTimeout(t);
  }, [current, paused, goNext]);

  // Progress RAF
  useEffect(() => {
    if (paused) {
      cancelAnimationFrame(progRef.current);
      return;
    }
    startRef.current = Date.now();
    const tick = () => {
      const pct = Math.min(((Date.now() - startRef.current) / INTERVAL) * 100, 100);
      setProgress(pct);
      if (pct < 100) progRef.current = requestAnimationFrame(tick);
    };
    progRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progRef.current);
  }, [current, paused]);

  const slide = SLIDES[current];

  return (
    <div
      className="relative w-full h-[65vh] sm:h-[80vh] overflow-hidden select-none bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Images with crossfade ── */}
      {SLIDES.map((s, i) => (
        <img
          key={i}
          src={s.img}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{
            opacity: i === current ? 1 : 0,
            transform: i === current ? 'scale(1.04)' : 'scale(1)',
            transition: 'opacity 0.9s ease, transform 7s ease',
          }}
        />
      ))}

      {/* ── Overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* ── Slide counter top-right ── */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-10 hidden sm:flex items-baseline gap-1.5 text-white">
        <span className="text-sm font-semibold tabular-nums">
          {String(current + 1).padStart(2, '0')}
        </span>
        <span className="text-white/40 text-xs">/</span>
        <span className="text-white/40 text-xs tabular-nums">
          {String(SLIDES.length).padStart(2, '0')}
        </span>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 h-full flex items-center px-6 sm:px-14 lg:px-24">
        <div key={animKey} className="max-w-xl text-white">
          {/* Tag line */}
          <div
            className="flex items-center gap-2.5 mb-4"
            style={{ animation: 'heroFadeUp 0.55s ease both' }}
          >
            <span className="w-5 h-px bg-white/60" />
            <p className="text-[10px] sm:text-[11px] tracking-[0.4em] uppercase text-white/70 font-medium">
              {slide.tag}
            </p>
          </div>

          {/* Title */}
          <h1
            className="text-4xl sm:text-5xl lg:text-[3.75rem] font-semibold leading-[1.08] whitespace-pre-line"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: '-0.02em',
              animation: 'heroFadeUp 0.6s 0.08s ease both',
            }}
          >
            {slide.title}
          </h1>

          {/* Description */}
          <p
            className="text-sm sm:text-[15px] text-white/70 mt-4 mb-8 leading-relaxed max-w-sm"
            style={{ animation: 'heroFadeUp 0.6s 0.18s ease both' }}
          >
            {slide.desc}
          </p>

          {/* CTA row */}
          <div
            className="flex items-center gap-5"
            style={{ animation: 'heroFadeUp 0.6s 0.28s ease both' }}
          >
            <Link
              to={slide.link}
              className="group inline-flex items-center gap-2.5 bg-white text-black text-[11px]
                font-semibold tracking-[0.15em] uppercase px-7 py-3.5
                hover:bg-black hover:text-white border border-transparent hover:border-white/30
                transition-all duration-300"
            >
              {slide.cta}
              <svg
                className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>

            <Link
              to="/collection"
              className="text-[11px] text-white/55 tracking-[0.15em] uppercase
                underline underline-offset-4 hover:text-white transition-colors duration-200"
            >
              View All
            </Link>
          </div>
        </div>
      </div>

      {/* ── Prev arrow ── */}
      <button
        onClick={goPrev}
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10
          w-9 h-9 border border-white/25 bg-white/10 backdrop-blur-sm
          flex items-center justify-center text-white
          hover:bg-white hover:text-black transition-all duration-200"
        aria-label="Previous slide"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ── Next arrow ── */}
      <button
        onClick={goNext}
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10
          w-9 h-9 border border-white/25 bg-white/10 backdrop-blur-sm
          flex items-center justify-center text-white
          hover:bg-white hover:text-black transition-all duration-200"
        aria-label="Next slide"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* ── Bottom bar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 sm:px-14 lg:px-24 pb-6 sm:pb-8">
        <div className="flex items-center gap-4">
          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-[2px] rounded-full transition-all duration-500
                  ${i === current ? 'w-8 bg-white' : 'w-3 bg-white/30 hover:bg-white/55'}`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex-1 max-w-[100px] h-px bg-white/15 overflow-hidden">
            <div
              className="h-full bg-white/60"
              style={{ width: `${progress}%`, transition: paused ? 'none' : undefined }}
            />
          </div>

          {/* Paused hint */}
          {paused && (
            <span className="hidden sm:block text-[9px] text-white/40 tracking-[0.25em] uppercase">
              Paused
            </span>
          )}
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
};

export default Hero;
