import React from "react";
import { Helmet } from "react-helmet-async";

export default function SEO({ title, description, canonical, schema }) {
  const t = title ? `${title} · LogiMarket` : "LogiMarket — India's B2B Freight Marketplace";
  const d = description || "Find verified courier and cargo partners across India in 60 seconds. Compare road, rail, air & express freight rates. GST + PAN verified network.";
  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      {canonical && <link rel="canonical" href={canonical} />}
      {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}
    </Helmet>
  );
}
