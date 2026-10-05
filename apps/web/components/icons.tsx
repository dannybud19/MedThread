import type { ReactNode } from "react";
import type { Mood } from "../lib/store";

/** Line icons, 2px stroke on a 24 grid. Always decorative — a word label carries the meaning. */
function Svg({ size = 28, children }: { size?: number | undefined; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

type P = { size?: number | undefined };

export const TodayIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />
  </Svg>
);

export const MicIcon = ({ size }: P) => (
  <Svg size={size}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
  </Svg>
);

export const ChatIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" />
  </Svg>
);

export const PaperIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Svg>
);

export const HistoryIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3 4v4h4M12 8v4.5l3 2" />
  </Svg>
);

export const PillIcon = ({ size }: P) => (
  <Svg size={size}>
    <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)" />
    <path d="m9.5 9.5 5 5" />
  </Svg>
);

export const QuestionIcon = ({ size }: P) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
  </Svg>
);

export const BellIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4" />
  </Svg>
);

export const CameraIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </Svg>
);

export const UploadIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
  </Svg>
);

export const ChevronIcon = ({ size = 24 }: P) => (
  <Svg size={size}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);

export const BackIcon = ({ size = 22 }: P) => (
  <Svg size={size}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const SendIcon = ({ size = 24 }: P) => (
  <Svg size={size}>
    <path d="M5 12h13M12 5l7 7-7 7" />
  </Svg>
);

export const PauseIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M9 5v14M15 5v14" />
  </Svg>
);

export const PlayIcon = ({ size }: P) => (
  <Svg size={size}>
    <path d="M7 4.5v15l12-7.5z" />
  </Svg>
);

const MOUTHS: Record<Mood, string> = {
  "very-good": "M8 13.5a4.5 4.5 0 0 0 8 0",
  good: "M8.5 14.5a4 4 0 0 0 7 0",
  okay: "M8.5 15h7",
  "not-great": "M8.5 16a4 4 0 0 1 7 0",
  poor: "M8 16.5a4.5 4.5 0 0 1 8 0",
};

export const MoodFace = ({ mood, size = 32 }: { mood: Mood; size?: number }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9.5h.01M15 9.5h.01" strokeWidth={2.6} />
    <path d={MOUTHS[mood]} />
  </Svg>
);
