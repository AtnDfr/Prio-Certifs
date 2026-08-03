import providerLogos from "../../data/provider-logos.json";
import { providerColor } from "../../ui/colors";

const LOGOS: Record<string, string | null> = providerLogos;
const DEFAULT_LOGO = "/logos/default.svg";

type Props = {
  provider: string;
  size: number;
  radius?: string;
};

export function ProviderBadge({ provider, size, radius = "999px" }: Props) {
  const filename = LOGOS[provider];
  const hasLogo = Boolean(filename);
  const src = hasLogo ? `/logos/${filename}` : DEFAULT_LOGO;
  const bg = hasLogo ? "#ffffff" : providerColor(provider);
  const pad = Math.round(size * (hasLogo ? 0.16 : 0.24));

  return (
    <span
      className="provider-badge"
      style={{ width: size, height: size, borderRadius: radius, background: bg, padding: pad }}
    >
      <img src={src} alt="" />
    </span>
  );
}
