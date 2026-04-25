import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./db/client.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
const isProduction = process.env.NODE_ENV === "production";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "200kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "leak.bin-api" });
});

app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

if (isProduction) {
  app.use(express.static(distDir));


  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`leak.bin running on port ${port} (${isProduction ? "production" : "development"})`);
});
