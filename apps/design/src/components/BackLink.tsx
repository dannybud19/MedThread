import { Link } from "react-router-dom";
import { ChevronBackIcon } from "../icons";

/** Text label back control, per NAVIGATION: "Back to home", never a bare chevron. */
export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link className="backlink" to={to}>
      <ChevronBackIcon />
      <span>{label}</span>
    </Link>
  );
}
