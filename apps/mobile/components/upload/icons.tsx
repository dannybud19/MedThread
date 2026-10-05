/**
 * Icons for the Update Medical Files screen.
 *
 * Every icon here is DECORATIVE: it sits beside a word label that carries the meaning, and is hidden
 * from screen readers — so there are no icon-only controls. Same 24x24 stroked style as
 * `components/home/icons.tsx`, so the app reads as one set.
 */
import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconProps = { size?: number; color: string };

const STROKE = 1.9;

function Icon({ size = 28, color, children }: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </Svg>
  );
}

/** Camera body with a lens — "Use camera". */
export function CameraIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Path d="M3 8.8a2 2 0 0 1 2-2h2.7l1.5-2.2h5.6l1.5 2.2H19a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <Circle cx="12" cy="12.8" r="4" />
    </Icon>
  );
}

/** Framed picture with a hill and sun — "Choose from your photos". */
export function GalleryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <Rect x="3" y="4.5" width="18" height="15" rx="2.6" />
      <Circle cx="8.6" cy="10" r="1.8" />
      <Path d="m4.2 17.4 4.9-4.9 4.2 4.2 2.6-2.6 4.1 4.1" />
    </Icon>
  );
}
