import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://auramind-vert.vercel.app";

export const SITE_NAME = "AuraMind";
export const BRAND_TAGLINE = "Your Personal AI Accountability & Productivity Assistant";

export const DEFAULT_KEYWORDS = [
  "AuraMind",
  "AuraMind AI",
  "AuraMind App",
  "AuraMind Productivity",
  "AuraMind Accountability",
  "AI Goal Planner",
  "AI Accountability Assistant",
  "AI Productivity Assistant",
  "AI Goal Tracking App",
  "Personal Productivity AI",
  "AI Calling Assistant",
  "Goal Management Platform",
  "30-day timetable",
  "hourly check-ins",
  "WhatsApp accountability",
];

interface MetadataOptions {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

export function constructMetadata({
  title,
  description,
  path = "",
  keywords = [],
  noIndex = false,
  ogImage = "/brand/auramind-symbol.png",
  type = "website",
  publishedTime,
  modifiedTime,
}: MetadataOptions): Metadata {
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const canonicalUrl = `${SITE_URL}${cleanPath}`;
  const fullOgImage = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;

  const allKeywords = Array.from(new Set([...DEFAULT_KEYWORDS, ...keywords]));

  return {
    title,
    description,
    keywords: allKeywords,
    applicationName: SITE_NAME,
    authors: [{ name: "AuraMind Team", url: SITE_URL }],
    creator: "AuraMind",
    publisher: "AuraMind",
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: fullOgImage,
          width: 512,
          height: 512,
          alt: `${SITE_NAME} - ${title}`,
        },
      ],
      locale: "en_US",
      type,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [fullOgImage],
      creator: "@AuraMindAI",
    },
    verification: {
      google: "google8a203efe90ab4162",
    },
  };
}

/**
 * JSON-LD Structured Data Schema Generators
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "AuraMind",
    alternateName: ["AuraMind AI", "AuraMind App"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/brand/auramind-symbol.png`,
      width: 512,
      height: 512,
      caption: "AuraMind Official Logo",
    },
    description:
      "AuraMind is an AI-powered productivity and accountability platform that turns ambitious goals into personalized 30-day schedules with hourly check-ins and AI calling.",
    sameAs: [],
  };
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "AuraMind AI",
    alternateName: "AuraMind",
    description:
      "Your Personal AI Accountability & Productivity Assistant. Set ambitious goals, create 30-day timetables, and stay consistent.",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-US",
  };
}

export function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: "AuraMind",
    alternateName: "AuraMind AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android (PWA)",
    description:
      "AI productivity and accountability platform featuring 30-day goal timetables, hourly check-ins, WhatsApp accountability reminders, and AI calling agents.",
    offers: [
      {
        "@type": "Offer",
        name: "Gold Plan",
        price: "249",
        priceCurrency: "INR",
        description: "Essential Productivity: 1 goal, 5 friends, hourly app notifications, focus timer, daily & weekly reports.",
        url: `${SITE_URL}/pricing`,
      },
      {
        "@type": "Offer",
        name: "Platinum Plan",
        price: "699",
        priceCurrency: "INR",
        description: "Smart Accountability: 3 goals, 15 friends, hourly WhatsApp check-ins, 60 AI calls/month, Google Calendar integration.",
        url: `${SITE_URL}/pricing`,
      },
      {
        "@type": "Offer",
        name: "Diamond Plan",
        price: "1299",
        priceCurrency: "INR",
        description: "Complete AI Accountability: 25 goals, 50 friends, WhatsApp check-ins, 450 AI calls/month, full Google Calendar synchronization.",
        url: `${SITE_URL}/pricing`,
      },
    ],
    featureList: [
      "AI Goal Planner",
      "Personalized 30-Day Timetable Generator",
      "Hourly Accountability Check-ins",
      "WhatsApp Check-in Messages",
      "AI Calling Assistant (Hindi & English)",
      "Focus Timer & Distraction Tracking",
      "XP and Level Progress System",
      "Friends & Social Accountability Community",
      "Google Calendar Synchronisation",
      "Daily, Weekly & Monthly Productivity Reports",
    ],
  };
}

export function getBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function getArticleSchema(article: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${article.path}`,
    },
    url: `${SITE_URL}${article.path}`,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    image: article.image ? (article.image.startsWith("http") ? article.image : `${SITE_URL}${article.image}`) : `${SITE_URL}/brand/auramind-symbol.png`,
    author: {
      "@type": "Organization",
      name: article.authorName || "AuraMind Productivity Lab",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "AuraMind",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/auramind-symbol.png`,
      },
    },
  };
}
