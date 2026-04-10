import Link from "next/link";

import { BrandLogo } from "./brand-logo";

type HeaderLink = {
  href: string;
  label: string;
};

type SiteHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  links: HeaderLink[];
};

export function SiteHeader({
  eyebrow,
  title,
  description,
  links
}: SiteHeaderProps) {
  return (
    <header className="site-header surface">
      <div className="site-header-top">
        <BrandLogo caption="安静、可信的网页对话" size="sm" />
        <nav className="nav-links">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="site-header-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="section-title serif">{title}</h1>
        {description ? <p className="muted header-copy">{description}</p> : null}
      </div>
    </header>
  );
}
