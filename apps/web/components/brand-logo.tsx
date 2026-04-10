import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
  caption?: string;
  showCaption?: boolean;
  priority?: boolean;
  className?: string;
};

const dimensionsBySize = {
  sm: 44,
  md: 64,
  lg: 88
} as const;

export function BrandLogo({
  href = "/",
  size = "md",
  caption = "安静、可信的网页对话",
  showCaption = true,
  priority = false,
  className
}: BrandLogoProps) {
  const dimension = dimensionsBySize[size];
  const classes = ["brand-logo", `brand-logo-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={classes} href={href}>
      <span className="brand-logo-mark">
        <Image
          alt="语闻 Logo"
          height={dimension}
          priority={priority}
          src="/yuwen-logo.png"
          width={dimension}
        />
      </span>
      <span className="brand-logo-copy">
        <strong>语闻</strong>
        {showCaption ? <span>{caption}</span> : null}
      </span>
    </Link>
  );
}
