import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock Spotify API for the demo
  app.get("/api/mock-playlist", (req, res) => {
    res.json({
      name: "Late Night Vibes",
      tracks: [
        { title: "Starboy", artist: "The Weeknd", energy: 0.6, valence: 0.4 },
        { title: "Nightcall", artist: "Kavinsky", energy: 0.5, valence: 0.3 },
        { title: "After Hours", artist: "The Weeknd", energy: 0.4, valence: 0.2 },
      ],
      aesthetic: "Cyberpunk / Dark Minimalist"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
