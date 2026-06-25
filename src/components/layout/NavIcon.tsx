type IconKind =
  | "dashboard"
  | "aidat"
  | "ekodenek"
  | "finans"
  | "rapor"
  | "daire"
  | "blok"
  | "firma"
  | "tanim";

export default function NavIcon({ kind }: { kind: IconKind }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
  };

  switch (kind) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="6" height="6" rx="1.5" />
          <rect x="11" y="3" width="6" height="6" rx="1.5" />
          <rect x="3" y="11" width="6" height="6" rx="1.5" />
          <rect x="11" y="11" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "aidat":
      return (
        <svg {...common}>
          <circle cx="4.2" cy="5.5" r="1" />
          <line x1="7.5" y1="5.5" x2="17" y2="5.5" />
          <circle cx="4.2" cy="10" r="1" />
          <line x1="7.5" y1="10" x2="17" y2="10" />
          <circle cx="4.2" cy="14.5" r="1" />
          <line x1="7.5" y1="14.5" x2="17" y2="14.5" />
        </svg>
      );
    case "ekodenek":
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="7" />
          <line x1="10" y1="7" x2="10" y2="13" />
          <line x1="7" y1="10" x2="13" y2="10" />
        </svg>
      );
    case "finans":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="14" height="11" rx="2.2" />
          <line x1="3" y1="9" x2="17" y2="9" />
          <circle cx="13.5" cy="12.7" r="1.1" />
        </svg>
      );
    case "rapor":
      return (
        <svg {...common}>
          <line x1="4" y1="16" x2="16" y2="16" />
          <rect x="5" y="10" width="2.6" height="5" rx="1" fill="currentColor" stroke="none" />
          <rect x="9" y="6.5" width="2.6" height="8.5" rx="1" fill="currentColor" stroke="none" />
          <rect x="13" y="11.5" width="2.6" height="3.5" rx="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "daire":
      return (
        <svg {...common}>
          <circle cx="10" cy="7" r="3" />
          <rect x="4.5" y="12" width="11" height="5.2" rx="2.6" />
        </svg>
      );
    case "blok":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="10" height="14" rx="1.2" />
          <rect x="7.4" y="6" width="2" height="2" />
          <rect x="10.6" y="6" width="2" height="2" />
          <rect x="7.4" y="9.6" width="2" height="2" />
          <rect x="10.6" y="9.6" width="2" height="2" />
        </svg>
      );
    case "firma":
      return (
        <svg {...common}>
          <rect x="4" y="7" width="12" height="9" rx="1.6" />
          <rect x="8" y="4" width="4" height="3" rx="1" />
          <line x1="4" y1="11" x2="16" y2="11" />
        </svg>
      );
    case "tanim":
      return (
        <svg {...common}>
          <line x1="4" y1="6.5" x2="16" y2="6.5" />
          <circle cx="8" cy="6.5" r="2" />
          <line x1="4" y1="13.5" x2="16" y2="13.5" />
          <circle cx="13" cy="13.5" r="2" />
        </svg>
      );
    default:
      return null;
  }
}
