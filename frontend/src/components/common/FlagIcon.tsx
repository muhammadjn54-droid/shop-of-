import type { Language } from '../../i18n/translations';

export const FlagTg = ({ className = 'w-5 h-3.5' }: { className?: string }) => (
  <svg
    viewBox="0 0 640 440"
    className={`inline-block shrink-0 rounded-[2px] shadow-2xs border border-black/10 dark:border-white/10 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Red Stripe */}
    <rect width="640" height="126" fill="#cc0000" />
    {/* White Stripe */}
    <rect y="126" width="640" height="188" fill="#ffffff" />
    {/* Green Stripe */}
    <rect y="314" width="640" height="126" fill="#009933" />
    {/* Crown & Stars (Gold) */}
    <g fill="#f8c300" stroke="#f8c300" strokeWidth="2">
      {/* Crown base */}
      <path
        d="M260 250 C260 215, 380 215, 380 250 C380 262, 260 262, 260 250 Z"
        fill="#f8c300"
      />
      {/* Crown arches */}
      <path
        d="M275 240 C285 200, 355 200, 365 240 C350 220, 290 220, 275 240 Z"
        fill="#ffffff"
      />
      <circle cx="320" cy="208" r="6" fill="#f8c300" />
      <circle cx="280" cy="225" r="5" fill="#f8c300" />
      <circle cx="360" cy="225" r="5" fill="#f8c300" />
      {/* 7 Stars */}
      <circle cx="320" cy="165" r="7" fill="#f8c300" />
      <circle cx="285" cy="175" r="6" fill="#f8c300" />
      <circle cx="355" cy="175" r="6" fill="#f8c300" />
      <circle cx="255" cy="195" r="5.5" fill="#f8c300" />
      <circle cx="385" cy="195" r="5.5" fill="#f8c300" />
      <circle cx="235" cy="225" r="5" fill="#f8c300" />
      <circle cx="405" cy="225" r="5" fill="#f8c300" />
    </g>
  </svg>
);

export const FlagRu = ({ className = 'w-5 h-3.5' }: { className?: string }) => (
  <svg
    viewBox="0 0 640 440"
    className={`inline-block shrink-0 rounded-[2px] shadow-2xs border border-black/10 dark:border-white/10 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="640" height="147" fill="#ffffff" />
    <rect y="147" width="640" height="146" fill="#0039a6" />
    <rect y="293" width="640" height="147" fill="#d52b1e" />
  </svg>
);

export const FlagEn = ({ className = 'w-5 h-3.5' }: { className?: string }) => (
  <svg
    viewBox="0 0 640 440"
    className={`inline-block shrink-0 rounded-[2px] shadow-2xs border border-black/10 dark:border-white/10 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <clipPath id="en-clip">
      <rect width="640" height="440" rx="2" />
    </clipPath>
    <g clipPath="url(#en-clip)">
      <rect width="640" height="440" fill="#012169" />
      <path d="M0 0 L640 440 M640 0 L0 440" stroke="#ffffff" strokeWidth="70" />
      <path d="M0 0 L640 440 M640 0 L0 440" stroke="#c8102e" strokeWidth="35" />
      <path d="M320 0 V440 M0 220 H640" stroke="#ffffff" strokeWidth="100" />
      <path d="M320 0 V440 M0 220 H640" stroke="#c8102e" strokeWidth="60" />
    </g>
  </svg>
);

export const FlagIcon = ({ code, className }: { code: Language; className?: string }) => {
  switch (code) {
    case 'tg':
      return <FlagTg className={className} />;
    case 'ru':
      return <FlagRu className={className} />;
    case 'en':
      return <FlagEn className={className} />;
    default:
      return null;
  }
};
