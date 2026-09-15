export type VercelCustomerSite = {
  slug: string;
  companyName: string;
  websiteName: string;
  contactName: string;
  contactEmail: string;
  domain: string;
  vercelUrl: string;
  githubRepo: string;
  allowedHosts: string[];
};

function hosts(domain: string, vercelHost: string, extras: string[] = []): string[] {
  const apex = domain.replace(/^www\./, "");
  return Array.from(
    new Set([
      domain,
      apex,
      `www.${apex}`,
      vercelHost,
      ...extras,
    ]),
  );
}

export const VERCEL_CUSTOMER_SITES: VercelCustomerSite[] = [
  {
    slug: "abelenimmobilienvermittlung",
    companyName: "Abelen Immobilien",
    websiteName: "Abelen Website",
    contactName: "Abelen Immobilien",
    contactEmail: "info@abelen-immobilien.de",
    domain: "www.abelen-immobilien.de",
    vercelUrl: "https://abelenimmobilienvermittlung.vercel.app",
    githubRepo: "viastefan/abelenimmobilienvermittlung",
    allowedHosts: hosts("www.abelen-immobilien.de", "abelenimmobilienvermittlung.vercel.app"),
  },
  {
    slug: "Wassana",
    companyName: "Wassana Thai Imbiss",
    websiteName: "Wassana Website",
    contactName: "Wassana Thai Imbiss",
    contactEmail: "wassanathaiimbiss@icloud.de",
    domain: "www.wassana-thai-imbiss.de",
    vercelUrl: "https://wassana-sepia.vercel.app",
    githubRepo: "viastefan/Wassana",
    allowedHosts: hosts("www.wassana-thai-imbiss.de", "wassana-sepia.vercel.app"),
  },
  {
    slug: "avs",
    companyName: "Airport Verpackungen",
    websiteName: "AVS Website",
    contactName: "Airport Verpackungen",
    contactEmail: "info@airport-verpackungen.de",
    domain: "www.airport-verpackungen.de",
    vercelUrl: "https://avs-tau.vercel.app",
    githubRepo: "viastefan/avs",
    allowedHosts: hosts("www.airport-verpackungen.de", "avs-tau.vercel.app"),
  },
  {
    slug: "wascotextil",
    companyName: "Wasco Textil",
    websiteName: "Wasco Website",
    contactName: "Wasco Textil",
    contactEmail: "info@wascotextil.de",
    domain: "www.wascotextil.de",
    vercelUrl: "https://wascotextil.vercel.app",
    githubRepo: "viastefan/wascotextil",
    allowedHosts: hosts("www.wascotextil.de", "wascotextil.vercel.app"),
  },
  {
    slug: "festagwebsite",
    companyName: "Festag",
    websiteName: "Festag Website",
    contactName: "Festag",
    contactEmail: "stefandirnberger@viawen.com",
    domain: "festagwebsite.vercel.app",
    vercelUrl: "https://festagwebsite.vercel.app",
    githubRepo: "viastefan/festagwebsite",
    allowedHosts: hosts("festagwebsite.vercel.app", "festagwebsite.vercel.app"),
  },
  {
    slug: "eridebavaria",
    companyName: "eRide Bavaria",
    websiteName: "eRide Bavaria Website",
    contactName: "eRide Bavaria",
    contactEmail: "info@eridebavaria.de",
    domain: "eridebavaria.vercel.app",
    vercelUrl: "https://eridebavaria.vercel.app",
    githubRepo: "viastefan/eridebavaria",
    allowedHosts: hosts("eridebavaria.vercel.app", "eridebavaria.vercel.app"),
  },
  {
    slug: "figura",
    companyName: "Figura",
    websiteName: "Figura Website",
    contactName: "Figura",
    contactEmail: "info@figura.app",
    domain: "figura-nine.vercel.app",
    vercelUrl: "https://figura-nine.vercel.app",
    githubRepo: "viastefan/figura",
    allowedHosts: hosts("figura-nine.vercel.app", "figura-nine.vercel.app"),
  },
  {
    slug: "muc-cargo-handling",
    companyName: "MUC Cargohandling",
    websiteName: "MUC Cargo Website",
    contactName: "MUC Cargohandling",
    contactEmail: "info@muc-cargo.de",
    domain: "www.muc-cargo.de",
    vercelUrl: "https://muc-cargo-handling.vercel.app",
    githubRepo: "viastefan/muc-cargo-handling",
    allowedHosts: hosts("www.muc-cargo.de", "muc-cargo-handling.vercel.app", ["muc-cargo.de"]),
  },
];

export function findCatalogSite(input: {
  vercelProject?: string | null;
  domain?: string | null;
  githubRepo?: string | null;
}): VercelCustomerSite | undefined {
  return VERCEL_CUSTOMER_SITES.find((site) => {
    const vercelHost = new URL(site.vercelUrl).hostname;
    return (
      site.slug === input.vercelProject ||
      site.githubRepo === input.githubRepo ||
      site.domain === input.domain ||
      site.allowedHosts.includes((input.domain ?? "").replace(/^https?:\/\//, "")) ||
      vercelHost === input.domain
    );
  });
}

export function vercelHost(site: VercelCustomerSite): string {
  return new URL(site.vercelUrl).hostname;
}

export type CatalogWebsiteMatch = {
  id: string;
  vercel_project?: string | null;
  domain?: string | null;
  github_repo?: string | null;
  vercel_url?: string | null;
};

export function matchCatalogToWebsites<T extends CatalogWebsiteMatch>(websites: T[]) {
  return VERCEL_CUSTOMER_SITES.map((site) => {
    const website =
      websites.find((row) => {
        const domain = (row.domain ?? "").replace(/^https?:\/\//, "");
        return (
          row.vercel_project === site.slug ||
          row.github_repo === site.githubRepo ||
          row.vercel_url === site.vercelUrl ||
          site.allowedHosts.includes(domain)
        );
      }) ?? null;
    return { site, website };
  });
}
