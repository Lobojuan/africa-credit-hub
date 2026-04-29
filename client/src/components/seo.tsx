import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: "website" | "article";
  canonical?: string;
}

function setMeta(selector: string, attr: string, key: string, value: string) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function Seo({ title, description, ogImage, ogType = "website", canonical }: SeoProps) {
  useEffect(() => {
    document.title = title;

    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:type"]', "property", "og:type", ogType);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");

    if (ogImage) {
      setMeta('meta[property="og:image"]', "property", "og:image", ogImage);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
    }

    if (canonical) {
      const absolute = canonical.startsWith("http")
        ? canonical
        : (typeof window !== "undefined" ? window.location.origin : "") + canonical;
      setLink("canonical", absolute);
      setMeta('meta[property="og:url"]', "property", "og:url", absolute);
    }
  }, [title, description, ogImage, ogType, canonical]);

  return null;
}
