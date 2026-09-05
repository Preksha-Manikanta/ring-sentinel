// Minimal stroke icon set — keeps the console dependency-free and on-brand.
type P = { className?: string; size?: number };
const base = (size = 16) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconShield = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
export const IconAlert = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l9 16H3z" />
    <path d="M12 10v4M12 17v.5" />
  </svg>
);
export const IconActivity = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  </svg>
);
export const IconPulse = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12h3l2-5 4 10 2-5h7" />
  </svg>
);
export const IconGraph = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="6" cy="6" r="2.2" />
    <circle cx="18" cy="7" r="2.2" />
    <circle cx="12" cy="18" r="2.2" />
    <path d="M7.6 7.4l3 8.6M16.4 8.6l-3 7.4M8 6.5h8" />
  </svg>
);
export const IconSearch = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="6" />
    <path d="M20 20l-4-4" />
  </svg>
);
export const IconPause = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 5v14M15 5v14" />
  </svg>
);
export const IconPlay = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 5l12 7-12 7z" />
  </svg>
);
export const IconClose = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconRetry = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4" />
    <path d="M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4" />
  </svg>
);
export const IconOffline = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 4l16 16" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a9 9 0 0 1 3-2M19 13a9 9 0 0 0-6.5-2.8" />
    <path d="M12 20h.01" />
  </svg>
);
export const IconClock = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </svg>
);
export const IconLayers = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 13l9 5 9-5" />
  </svg>
);
export const IconGauge = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 15a8 8 0 0 1 16 0" />
    <path d="M12 15l4-3" />
    <path d="M4 15h1M19 15h1M12 7v1" />
  </svg>
);
export const IconInbox = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 13l2.5-7h11L20 13v5H4z" />
    <path d="M4 13h4l1.5 2h5L16 13h4" />
  </svg>
);
export const IconChevron = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
