import * as React from "react";
import { providerColor } from "../../ui/colors";

// SPFx/webpack n'a pas d'equivalent direct de import.meta.env.BASE_URL (Vite) :
// les logos sont importes statiquement pour que webpack les fingerprint et les
// serve depuis le CDN du web part (memes fichiers que code-app/public/logos).
import anthropicLogo from "../../assets/logos/anthropic.svg";
import awsLogo from "../../assets/logos/aws.png";
import azureLogo from "../../assets/logos/azure.png";
import collibraLogo from "../../assets/logos/collibra.png";
import databricksLogo from "../../assets/logos/databricks.svg";
import dataikuLogo from "../../assets/logos/dataiku.svg";
import defaultLogo from "../../assets/logos/default.svg";
import gcpLogo from "../../assets/logos/google-cloud-platform.svg";
import huggingFaceLogo from "../../assets/logos/hugging-face.svg";
import ibmLogo from "../../assets/logos/ibm.png";
import iecLogo from "../../assets/logos/iec.png";
import linuxFoundationLogo from "../../assets/logos/linux-foundation.svg";
import microsoftLogo from "../../assets/logos/microsoft.png";
import palantirLogo from "../../assets/logos/palantir.svg";
import salesforceLogo from "../../assets/logos/salesforce.png";
import scaledAgileLogo from "../../assets/logos/scaled-agile.png";
import snowflakeLogo from "../../assets/logos/snowflake.svg";

const LOGOS: Record<string, string | undefined> = {
  Anthropic: anthropicLogo,
  AWS: awsLogo,
  Azure: azureLogo,
  Collibra: collibraLogo,
  Databricks: databricksLogo,
  Dataiku: dataikuLogo,
  "Google Cloud Platform": gcpLogo,
  "Hugging Face": huggingFaceLogo,
  IBM: ibmLogo,
  IEC: iecLogo,
  "Linux Foundation": linuxFoundationLogo,
  Microsoft: microsoftLogo,
  Palantir: palantirLogo,
  Salesforce: salesforceLogo,
  "Scaled Agile": scaledAgileLogo,
  Snowflake: snowflakeLogo,
};

type Props = {
  provider: string;
  size: number;
  radius?: string;
};

export function ProviderBadge({ provider, size, radius = "999px" }: Props) {
  const filename = LOGOS[provider];
  const hasLogo = Boolean(filename);
  const src = hasLogo ? filename : defaultLogo;
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
