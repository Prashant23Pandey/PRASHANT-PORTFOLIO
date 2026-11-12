const path = require("path");
const fs = require("fs");
const express = require("express");
const compression = require("compression");

const app = express();
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(compression({ threshold: 1024 }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-src 'none'",
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "connect-src 'self' data: blob:",
      "worker-src 'self' blob:",
      "form-action 'self' mailto:",
    ].join("; ")
  );
  next();
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "sebastien-lempens-portfolio",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/site", (req, res) => {
  res.json({
    title: "Sebastien Lempens :: Web Engineer :: Portfolio",
    sections: [
      { id: "fr", label: "France", route: "home" },
      { id: "frlux", label: "France to Luxembourg", route: "about" },
      { id: "lux", label: "Luxembourg", route: "projects" },
      { id: "befr", label: "Belgium", route: "contact" },
    ],
    projects: [
      "corian-exterior",
      "dupont-airguard",
      "sanrita",
      "pixila",
      "railight",
      "lab77",
      "corian-website",
      "corian-tool",
      "dltal",
      "aos",
      "telkea-voeux-2023",
    ],
  });
});

app.use(
  express.static(publicDir, {
    index: "index.html",
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=604800");
      }
    },
  })
);

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  if (req.method === "GET" && path.extname(req.path) === "") {
    const indexFile = path.join(publicDir, "index.html");
    if (!fs.existsSync(indexFile)) {
      return res.status(404).json({ error: "Portfolio UI is not included in this API-only deployment" });
    }
    return res.sendFile(indexFile);
  }
  return res.status(404).send("Not found");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Portfolio running at http://localhost:${port}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

module.exports = app;
