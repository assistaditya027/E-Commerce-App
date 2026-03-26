import React, { useEffect, useRef, useState, useCallback } from 'react';

/* ─────────────────────────────────────────
   Data
───────────────────────────────────────── */
const SECTIONS = [
  {
    id: 'about',
    number: '01',
    title: 'About Clovo',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9
          0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1
          1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    body: 'These Terms & Conditions govern your use of the Clovo website and services. By accessing or placing an order, you agree to be bound by these terms.',
  },
  {
    id: 'eligibility',
    number: '02',
    title: 'Eligibility & Account',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7
          7 0 00-7-7z"
        />
      </svg>
    ),
    body: 'You must be at least 18 years old or have parental permission to use our services. You are responsible for keeping your login credentials secure and for all activity under your account.',
  },
  {
    id: 'orders',
    number: '03',
    title: 'Orders & Payments',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293
          2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0
          000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    bullets: [
      'All orders are subject to availability and confirmation.',
      'Prices and delivery charges are shown at checkout.',
      'We may cancel or refuse orders that appear fraudulent.',
    ],
  },
  {
    id: 'shipping',
    number: '04',
    title: 'Shipping',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002
          2h10a2 2 0 002-2V8m-9 4h4"
        />
      </svg>
    ),
    body: 'Estimated delivery times are shared during checkout. Delays can occur due to courier or operational issues. We will keep you updated where possible.',
  },
  {
    id: 'returns',
    number: '05',
    title: 'Returns & Refunds',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0
          00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
        />
      </svg>
    ),
    body: 'Return and refund eligibility depends on product condition and timing. Please contact support for return requests.',
  },
  {
    id: 'product',
    number: '06',
    title: 'Product Information',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010
          2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4
          0 014-4z"
        />
      </svg>
    ),
    body: 'We aim to display product colors and details accurately. Minor variations may occur due to screen settings or production batches.',
  },
  {
    id: 'ip',
    number: '07',
    title: 'Intellectual Property',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4
          12H3m1.636-6.364l.707.707M12 21v-1M8.342 8.343a4 4 0 115.657
          5.657 4 4 0 01-5.657-5.657z"
        />
      </svg>
    ),
    body: 'All content, logos, and designs on this site are owned by Clovo or its licensors. You may not copy or reuse content without permission.',
  },
  {
    id: 'liability',
    number: '08',
    title: 'Limitation of Liability',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0
          01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622
          5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12
          9v4m0 4h.01"
        />
      </svg>
    ),
    body: 'To the maximum extent permitted by law, Clovo is not liable for indirect or incidental damages arising from your use of the website or products.',
  },
  {
    id: 'changes',
    number: '09',
    title: 'Changes to These Terms',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11
          11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
    body: 'We may update these Terms periodically. Continued use of the website after updates means you accept the revised terms.',
  },
  {
    id: 'contact',
    number: '10',
    title: 'Contact',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2
          2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    email: 'info@clovo.com',
  },
];

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */

const ProgressBar = ({ progress }) => (
  <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-gray-100 dark:bg-gray-800 print:hidden">
    <div
      className="h-full bg-gray-900 dark:bg-white transition-all duration-75 ease-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);

const CopyLinkBtn = ({ id }) => {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy link to section"
      className="opacity-0 group-hover:opacity-100 ml-2
        text-gray-300 dark:text-gray-600
        hover:text-gray-600 dark:hover:text-gray-300
        transition-all duration-150 flex-shrink-0"
    >
      {copied ? (
        <svg
          className="w-3.5 h-3.5 text-emerald-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101
            m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      )}
    </button>
  );
};

const Section = ({ section, isOpen, onToggle, isActive }) => {
  const { id, number, title, icon, body, bullets, email } = section;

  return (
    <section id={id} className="scroll-mt-6 group">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 text-left py-5
          focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900
          dark:focus-visible:ring-white"
      >
        {/* Number */}
        <span
          className={`text-[10px] font-bold tracking-[0.2em] uppercase
          flex-shrink-0 w-6 text-right transition-colors duration-200
          ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}
        >
          {number}
        </span>

        {/* Icon box — sharp corners */}
        <span
          className={`w-8 h-8 rounded flex items-center justify-center
          flex-shrink-0 transition-all duration-200
          ${
            isActive
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
          }`}
        >
          {icon}
        </span>

        <h2
          className={`flex-1 text-sm sm:text-[15px] font-semibold tracking-[-0.01em]
          transition-colors duration-200
          ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
        >
          {title}
        </h2>

        <CopyLinkBtn id={id} />

        {/* Chevron */}
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500
            transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Accordion body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out
        ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div
          className="ml-[68px] pb-6 pr-4 text-sm sm:text-[14px]
          text-gray-500 dark:text-gray-400 leading-relaxed"
        >
          {bullets && (
            <ul className="space-y-2.5">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-[9px] w-1 h-1 rounded-full bg-gray-300
                    dark:bg-gray-600 flex-shrink-0"
                  />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {body && <p>{body}</p>}
          {email && (
            <p>
              For questions about these Terms, contact us at{' '}
              <a
                href={`mailto:${email}`}
                className="font-medium text-gray-800 dark:text-gray-200
                  underline underline-offset-2
                  hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {email}
              </a>
              .
            </p>
          )}
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />
    </section>
  );
};

/* ─────────────────────────────────────────
   Main page
───────────────────────────────────────── */
const Terms = () => {
  const updatedAt = 'March 23, 2026';

  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [progress, setProgress] = useState(0);
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.id, true])),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const contentRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min((el.scrollTop / total) * 100, 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observers = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: '-30% 0px -60% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const toggleSection = useCallback((id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const allOpen = Object.values(openSections).every(Boolean);
  const toggleAll = () => {
    const next = !allOpen;
    setOpenSections(Object.fromEntries(SECTIONS.map((s) => [s.id, next])));
  };

  const copyPageLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? SECTIONS.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.body && s.body.toLowerCase().includes(q)) ||
          (s.bullets && s.bullets.some((b) => b.toLowerCase().includes(q))),
      )
    : SECTIONS;

  return (
    <>
      <ProgressBar progress={progress} />

      {/* Full-width page shell */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-14 pb-24 px-4 sm:px-6 lg:px-10 print:pt-4">
        <div className="max-w-screen-xl mx-auto">
          {/* ── Wide header strip ── */}
          <div
            className="border-b border-gray-200 dark:border-gray-800 pb-8 mb-10
            flex flex-col sm:flex-row sm:items-end justify-between gap-5"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold
                  tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500"
                >
                  <span className="w-4 h-px bg-gray-300 dark:bg-gray-700 inline-block" />
                  Legal
                </span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-[-0.03em]
                text-gray-900 dark:text-white mb-2"
              >
                Terms &amp; Conditions
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 tracking-wide">
                Last updated: {updatedAt}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={copyPageLink}
                className="flex items-center gap-2 text-xs font-medium
                  text-gray-500 dark:text-gray-400
                  hover:text-gray-900 dark:hover:text-white
                  border border-gray-200 dark:border-gray-700
                  hover:border-gray-400 dark:hover:border-gray-500
                  px-4 py-2.5 rounded transition-all duration-150"
              >
                {copied ? (
                  <svg
                    className="w-3.5 h-3.5 text-emerald-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6
                      8h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
                {copied ? 'Copied' : 'Copy link'}
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-xs font-medium
                  text-gray-500 dark:text-gray-400
                  hover:text-gray-900 dark:hover:text-white
                  border border-gray-200 dark:border-gray-700
                  hover:border-gray-400 dark:hover:border-gray-500
                  px-4 py-2.5 rounded transition-all duration-150"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0
                    002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2
                    2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>
            </div>
          </div>

          {/* ── Two-column layout — wider sidebar + wider content ── */}
          <div
            className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr]
            gap-8 xl:gap-14 items-start"
          >
            {/* ── Sticky TOC sidebar ── */}
            <aside className="hidden lg:flex flex-col gap-4 sticky top-20 print:hidden">
              {/* Search box */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                  text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sections..."
                  className="w-full pl-9 pr-8 py-2.5 text-xs rounded
                    bg-white dark:bg-gray-900
                    border border-gray-200 dark:border-gray-800
                    text-gray-700 dark:text-gray-300
                    placeholder:text-gray-400 dark:placeholder:text-gray-600
                    outline-none focus:ring-2 focus:ring-gray-900
                    dark:focus:ring-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                      text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* TOC header */}
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] tracking-[0.2em] uppercase font-bold
                  text-gray-400 dark:text-gray-500"
                >
                  Contents
                </p>
                <button
                  onClick={toggleAll}
                  className="text-[10px] font-medium text-gray-400 dark:text-gray-500
                    hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {allOpen ? 'Collapse all' : 'Expand all'}
                </button>
              </div>

              {/* TOC nav links */}
              <nav className="flex flex-col">
                {SECTIONS.map(({ id, number, title }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className={`group/nav flex items-center gap-2.5 text-xs py-2 px-3
                      rounded transition-all duration-150 border-l-2
                      ${
                        activeId === id
                          ? 'border-gray-900 dark:border-white bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold shadow-sm'
                          : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900'
                      }`}
                  >
                    <span
                      className={`text-[9px] font-bold tracking-widest flex-shrink-0 tabular-nums
                      ${activeId === id ? 'opacity-50' : 'opacity-30'}`}
                    >
                      {number}
                    </span>
                    <span className="truncate leading-snug">{title}</span>
                  </a>
                ))}
              </nav>

              {/* Progress indicator */}
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800 overflow-hidden rounded-full">
                  <div
                    className="h-full bg-gray-900 dark:bg-white transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-600 tabular-nums w-8 text-right">
                  {Math.round(progress)}%
                </span>
              </div>
            </aside>

            {/* ── Main content card — sharp radius ── */}
            <div
              ref={contentRef}
              className="bg-white dark:bg-gray-900
                border border-gray-200 dark:border-gray-800
                rounded shadow-sm overflow-hidden"
            >
              {/* Mobile search (shown on small screens) */}
              <div className="lg:hidden px-5 pt-5">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                    text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sections..."
                    className="w-full pl-9 pr-8 py-2.5 text-xs rounded
                      bg-gray-50 dark:bg-gray-800
                      border border-gray-200 dark:border-gray-700
                      text-gray-700 dark:text-gray-300
                      placeholder:text-gray-400 outline-none
                      focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Search result count */}
              {q && (
                <div className="px-6 pt-5 pb-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {filtered.length} section{filtered.length !== 1 ? 's' : ''} matching{' '}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      "{searchQuery}"
                    </span>
                  </p>
                </div>
              )}

              {/* Sections list */}
              {filtered.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No sections match your search.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs underline underline-offset-2
                      text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="px-5 sm:px-8">
                  {filtered.map((section) => (
                    <Section
                      key={section.id}
                      section={section}
                      isOpen={openSections[section.id] ?? true}
                      onToggle={() => toggleSection(section.id)}
                      isActive={activeId === section.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;
