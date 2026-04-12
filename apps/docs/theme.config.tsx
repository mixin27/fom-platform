import React from "react"

const config = {
  logo: (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <img
        src="/brand/png/logo-mark.png"
        alt="FOM Logo"
        style={{ width: "24px", height: "24px" }}
      />
      <span style={{ fontWeight: 700, letterSpacing: "0.1em" }}>FOM DOCS</span>
    </div>
  ),
  project: {
    link: "https://github.com/mixin27/fom-platform",
  },
  docsRepositoryBase:
    "https://github.com/mixin27/fom-platform/tree/main/apps/docs",
  footer: {
    text: (
      <span>
        {new Date().getFullYear()} ©{" "}
        <a href="https://getfom.com" target="_blank">
          FOM Order Manager
        </a>
        . Built for Myanmar Facebook Sellers.
      </span>
    ),
  },
  i18n: [
    { locale: "en", name: "English" },
    { locale: "my", name: "မြန်မာ" },
  ],
  lastUpdated: null,
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="FOM Docs" />
      <meta
        property="og:description"
        content="Documentation for FOM Order Manager"
      />
    </>
  ),
}

export default config
