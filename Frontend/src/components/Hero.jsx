import { useState, useEffect, useRef, useCallback } from 'react';
import { assets } from '../assets/assets';
import { Link } from 'react-router-dom';

const SLIDES = [
  {
    tag: 'NEW ARRIVALS',
    title: 'Elevate Your\nStyle',
    desc: 'Discover timeless fashion crafted for modern living.',
    cta: 'Shop Collection',
    mobileCta: 'SHOP NOW',
    badge: 'Up to 30% OFF',
    link: '/collection',
    img: assets.hero_image3,
    accent: '#FF3F6C',
  },
  {
    tag: 'LIMITED COLLECTION',
    title: 'Summer\nEssentials',
    desc: 'Lightweight pieces designed for effortless comfort.',
    cta: 'Explore Now',
    mobileCta: 'EXPLORE',
    badge: 'New Season',
    link: '/collection',
    img: assets.hero_img2,
    accent: '#FF3F6C',
  },
  {
    tag: 'SPECIAL OFFER',
    title: 'Up to 40%\nOff',
    desc: 'Premium quality fashion at exclusive prices.',
    cta: 'Shop Deals',
    mobileCta: 'SHOP DEALS',
    badge: 'Limited Time',
    link: '/collection',
    img: assets.hero_img1,
    accent: '#FF3F6C',
  },
];

const INTERVAL = 6000;

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);

  const progRef = useRef(null);
  const startRef = useRef(Date.now());
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isDraggingH = useRef(false);

  const goTo = useCallback((idx) => {
    if (idx === current) return;
    setCurrent(idx);
    setProgress(0);
    setAnimKey((k) => k + 1);
    setDragDelta(0);
    startRef.current = Date.now();
  }, [current]);

  const goNext = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);
  const goPrev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(goNext, INTERVAL);
    return () => clearTimeout(t);
  }, [current, paused, goNext]);

  // Progress RAF
  useEffect(() => {
    if (paused) { cancelAnimationFrame(progRef.current); return; }
    startRef.current = Date.now();
    const tick = () => {
      const pct = Math.min(((Date.now() - startRef.current) / INTERVAL) * 100, 100);
      setProgress(pct);
      if (pct < 100) progRef.current = requestAnimationFrame(tick);
    };
    progRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progRef.current);
  }, [current, paused]);

  // Touch / swipe handlers
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDraggingH.current = false;
    setPaused(true);
  };
  const onTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!isDraggingH.current && Math.abs(dy) > Math.abs(dx)) return;
    isDraggingH.current = true;
    setDragDelta(dx);
  };
  const onTouchEnd = (e) => {
    setPaused(false);
    if (!isDraggingH.current || touchStartX.current === null) { setDragDelta(0); return; }
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 45) { dx < 0 ? goNext() : goPrev(); }
    else setDragDelta(0);
    touchStartX.current = null;
  };

  const slide = SLIDES[current];

  return (
    <>
      <style>{`
        /* ── Ken Burns (desktop) ── */
        @keyframes kenBurns {
          from { transform: scale(1); }
          to   { transform: scale(1.04); }
        }
        .kb-active { animation: kenBurns 7s ease-out forwards; }

        /* ── Desktop content fade-up ── */
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hfu-1 { animation: heroFadeUp 0.55s ease both; }
        .hfu-2 { animation: heroFadeUp 0.6s 0.08s ease both; }
        .hfu-3 { animation: heroFadeUp 0.6s 0.18s ease both; }
        .hfu-4 { animation: heroFadeUp 0.6s 0.28s ease both; }

        /* ── Mobile (Myntra) slide-up ── */
        @keyframes mSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ma-1 { animation: mSlideUp 0.38s 0.04s ease both; }
        .ma-2 { animation: mSlideUp 0.38s 0.12s ease both; }
        .ma-3 { animation: mSlideUp 0.38s 0.20s ease both; }
        .ma-4 { animation: mSlideUp 0.38s 0.28s ease both; }

        /* ── Badge pulse ── */
        @keyframes badgePulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
        .badge-pulse { animation: badgePulse 2s ease-in-out infinite; }

        /* ── Mobile CTA ripple ── */
        .mcta { position: relative; overflow: hidden; }
        .mcta::after {
          content: '';
          position: absolute; inset: 0;
          background: rgba(255,255,255,0.18);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        .mcta:active::after { transform: translateX(0); }
      `}</style>

      {/* ════════════════════════════════════
          MOBILE LAYOUT  — style (< sm)
      ════════════════════════════════════════ */}
      <div
        className="sm:hidden relative w-full overflow-hidden bg-gray-900 select-none"
        style={{ height: 'clamp(380px, 105vw, 560px)' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Images */}
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 w-full h-full"
            style={{
              opacity: i === current ? 1 : 0,
              transition: 'opacity 0.5s ease',
              transform: isDraggingH.current && i === current
                ? `translateX(${dragDelta * 0.22}px)` : 'translateX(0)',
            }}
          >
            <img
              src={s.img}
              alt={s.title}
              className="w-full h-full object-cover object-top"
            />
          </div>
        ))}

        {/* Bottom-heavy gradient */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.04) 38%, rgba(0,0,0,0.75) 100%)' }}
        />

        {/* Top row: tag chip + badge */}
        <div
          key={`mtop-${animKey}`}
          className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between px-4 pt-4 ma-1"
        >
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm"
            style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: slide.accent }} />
            <span className="text-white text-[9px] font-semibold tracking-[0.22em] uppercase">{slide.tag}</span>
          </div>
          <div
            className="badge-pulse px-2.5 py-1 rounded-sm text-white text-[9px] font-bold tracking-wide"
            style={{ background: slide.accent }}
          >
            {slide.badge}
          </div>
        </div>

        {/* Bottom content */}
        <div
          key={`mbot-${animKey}`}
          className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-5"
        >
          {/* Segmented progress bar */}
          <div className="flex items-center gap-1 mb-3.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-[2px] rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.22)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    background: '#fff',
                    width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                    transition: i === current && !paused ? 'width 0.1s linear' : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Title + CTA */}
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2
                className="text-white font-bold leading-tight ma-2 truncate"
                style={{ fontSize: 'clamp(1.2rem, 5.5vw, 1.6rem)', letterSpacing: '-0.01em' }}
              >
                {slide.title.replace('\n', ' ')}
              </h2>
              <p className="text-white/60 ma-3 line-clamp-1 text-[11px] mt-0.5">
                {slide.desc}
              </p>
            </div>
            <Link
              to={slide.link}
              className="mcta ma-4 flex-shrink-0 flex items-center gap-1.5 text-white font-bold rounded-sm"
              style={{
                background: slide.accent,
                fontSize: '9px',
                letterSpacing: '0.14em',
                padding: '9px 16px',
              }}
            >
              {slide.mobileCta}
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Stretch dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? '18px' : '6px',
                  height: '6px',
                  background: i === current ? '#fff' : 'rgba(255,255,255,0.38)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          DESKTOP LAYOUT — original (≥ sm)
      ════════════════════════════════════════ */}
      <div
        className="hidden sm:block relative w-full h-[80vh] overflow-hidden select-none bg-black"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Images with crossfade */}
        {SLIDES.map((s, i) => (
          <img
            key={i}
            src={s.img}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover object-center ${i === current ? 'kb-active' : ''}`}
            style={{
              opacity: i === current ? 1 : 0,
              transform: i === current ? undefined : 'scale(1)',
              transition: 'opacity 0.9s ease',
            }}
          />
        ))}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Slide counter top-right */}
        <div className="absolute top-7 right-8 z-10 flex items-baseline gap-1.5 text-white">
          <span className="text-sm font-semibold tabular-nums">{String(current + 1).padStart(2, '0')}</span>
          <span className="text-white/40 text-xs">/</span>
          <span className="text-white/40 text-xs tabular-nums">{String(SLIDES.length).padStart(2, '0')}</span>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center px-14 lg:px-24">
          <div key={animKey} className="max-w-xl text-white">

            {/* Tag */}
            <div className="flex items-center gap-2.5 mb-4 hfu-1">
              <span className="w-5 h-px bg-white/60" />
              <p className="text-[11px] tracking-[0.4em] uppercase text-white/70 font-medium">{slide.tag}</p>
            </div>

            {/* Title */}
            <h1
              className="text-5xl lg:text-[3.75rem] font-semibold leading-[1.08] whitespace-pre-line hfu-2"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: '-0.02em' }}
            >
              {slide.title}
            </h1>

            {/* Desc */}
            <p className="text-[15px] text-white/70 mt-4 mb-8 leading-relaxed max-w-sm hfu-3">
              {slide.desc}
            </p>

            {/* CTA row */}
            <div className="flex items-center gap-5 hfu-4">
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
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

        {/* Prev arrow */}
        <button
          onClick={goPrev}
          className="absolute left-5 top-1/2 -translate-y-1/2 z-10
            w-9 h-9 border border-white/25 bg-white/10 backdrop-blur-sm
            flex items-center justify-center text-white
            hover:bg-white hover:text-black transition-all duration-200"
          aria-label="Previous slide"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Next arrow */}
        <button
          onClick={goNext}
          className="absolute right-5 top-1/2 -translate-y-1/2 z-10
            w-9 h-9 border border-white/25 bg-white/10 backdrop-blur-sm
            flex items-center justify-center text-white
            hover:bg-white hover:text-black transition-all duration-200"
          aria-label="Next slide"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-14 lg:px-24 pb-8">
          <div className="flex items-center gap-4">
            {/* Dots */}
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
            {paused && (
              <span className="text-[9px] text-white/40 tracking-[0.25em] uppercase">Paused</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;