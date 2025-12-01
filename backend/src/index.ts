import express from "express";
import crypto from "crypto";
import prisma from "./prisma";
import { deviceAuth, DeviceRequest } from "./deviceAuth";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// Root (optioneel)
app.get("/", (_req, res) => {
  res.send("Signage-lite backend staat aan. Gebruik /health of de /api-routes.");
});

// Health-check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Signage-lite backend draait" });
});

// Helper voor 6-cijferige pairing code
function generatePairingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper voor random deviceToken
function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64-karakter hex string
}

// Device registreren (player-app start hiermee)
app.post("/api/devices/register", async (req, res) => {
  try {
    const { platform, deviceName } = req.body as {
      platform?: string;
      deviceName?: string;
    };

    if (!platform) {
      return res.status(400).json({ error: "platform is verplicht" });
    }

    const pairingCode = generatePairingCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minuten

    const device = await prisma.device.create({
      data: {
        platform,
        deviceName: deviceName || null,
        pairingCode,
        pairingExpires: expires,
      },
    });

    return res.status(201).json({
      deviceId: device.id,
      pairingCode,
      expiresAt: expires.toISOString(),
    });
  } catch (error) {
    console.error("Fout in /api/devices/register:", error);
    return res.status(500).json({ error: "Interne serverfout" });
  }
});

// Device status opvragen (polling vanuit player)
app.get("/api/devices/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Ongeldig device-id" });
    }

    const device = await prisma.device.findUnique({
      where: { id },
      include: { player: true },
    });

    if (!device) {
      return res.status(404).json({ status: "NOT_FOUND" });
    }

    if (!device.playerId || !device.deviceToken) {
      return res.json({ status: "PENDING" });
    }

    return res.json({
      status: "PAIRED",
      playerId: device.playerId,
      deviceToken: device.deviceToken,
    });
  } catch (error) {
    console.error("Fout in /api/devices/:id/status:", error);
    return res.status(500).json({ error: "Interne serverfout" });
  }
});

// Player koppelen aan device via pairingCode
app.post("/api/players/pair", async (req, res) => {
  try {
    const { pairingCode, playerName, location, tenantId } = req.body as {
      pairingCode?: string;
      playerName?: string;
      location?: string;
      tenantId?: number;
    };

    if (!pairingCode || !playerName || !tenantId) {
      return res.status(400).json({
        error: "pairingCode, playerName en tenantId zijn verplicht",
      });
    }

    const now = new Date();

    // Device zoeken op pairingCode, nog niet gekoppeld, niet verlopen
    const device = await prisma.device.findFirst({
      where: {
        pairingCode,
        pairingExpires: { gt: now },
        playerId: null,
      },
    });

    if (!device) {
      return res.status(400).json({
        error: "Ongeldige of verlopen pairingCode",
      });
    }

    // TODO: hier straks echte auth/tenant uit token halen
    const player = await prisma.player.create({
      data: {
        name: playerName,
        location: location || null,
        tenantId,
      },
    });

    const deviceToken = generateDeviceToken();

    const updatedDevice = await prisma.device.update({
      where: { id: device.id },
      data: {
        playerId: player.id,
        deviceToken,
        pairingCode: null,
        pairingExpires: null,
      },
    });

    return res.status(201).json({
      playerId: player.id,
      deviceId: updatedDevice.id,
      deviceToken,
    });
  } catch (error) {
    console.error("Fout in /api/players/pair:", error);
    return res.status(500).json({ error: "Interne serverfout" });
  }
});

// Admin: Tenants ophalen
app.get("/api/admin/tenants", async (_req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { id: "asc" },
    });
    res.json(tenants);
  } catch (error) {
    console.error("Fout in GET /api/admin/tenants:", error);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// Admin: Tenant aanmaken
app.post("/api/admin/tenants", async (req, res) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name) {
      return res.status(400).json({ error: "name is verplicht" });
    }

    const tenant = await prisma.tenant.create({
      data: { name },
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error("Fout in POST /api/admin/tenants:", error);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// Admin: Tenant + alles eronder verwijderen
app.delete("/api/admin/tenants/:id", async (req, res) => {
  try {
    const tenantId = Number(req.params.id);
    if (isNaN(tenantId)) {
      return res.status(400).json({ error: "Ongeldige tenant-id" });
    }

    // Cascade: eerst alles eronder weggooien
    await prisma.$transaction([
      prisma.playlistItem.deleteMany({
        where: { playlist: { player: { tenantId } } },
      }),
      prisma.playlist.deleteMany({
        where: { player: { tenantId } },
      }),
      prisma.device.deleteMany({
        where: { player: { tenantId } },
      }),
      prisma.player.deleteMany({
        where: { tenantId },
      }),
      prisma.mediaAsset.deleteMany({
        where: { tenantId },
      }),
      prisma.user.deleteMany({
        where: { tenantId },
      }),
      prisma.tenant.delete({
        where: { id: tenantId },
      }),
    ]);

    res.json({ ok: true });
  } catch (error) {
    console.error("Fout in DELETE /api/admin/tenants/:id:", error);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// Admin: Alle players binnen een tenant ophalen
app.get("/api/admin/tenants/:tenantId/players", async (req, res) => {
  try {
    const tenantId = Number(req.params.tenantId);
    if (isNaN(tenantId)) {
      return res.status(400).json({ error: "Ongeldige tenant-id" });
    }

    const players = await prisma.player.findMany({
      where: { tenantId },
      include: {
        device: true,
        playlists: true,
      },
      orderBy: { id: "asc" },
    });

    res.json(players);
  } catch (e) {
    console.error("GET players:", e);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// Admin: Player aanmaken binnen tenant
app.post("/api/admin/tenants/:tenantId/players", async (req, res) => {
  try {
    const tenantId = Number(req.params.tenantId);
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is verplicht" });
    }

    const player = await prisma.player.create({
      data: {
        name,
        location: location || null,
        tenantId,
      },
    });

    res.status(201).json(player);
  } catch (e) {
    console.error("POST player:", e);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// Admin: Player verwijderen (cascade player → playlist → items → device)
app.delete("/api/admin/players/:id", async (req, res) => {
  try {
    const playerId = Number(req.params.id);
    if (isNaN(playerId)) {
      return res.status(400).json({ error: "Ongeldige player-id" });
    }

    await prisma.$transaction([
      prisma.playlistItem.deleteMany({
        where: { playlist: { playerId } },
      }),
      prisma.playlist.deleteMany({
        where: { playerId },
      }),
      prisma.device.deleteMany({
        where: { playerId },
      }),
      prisma.player.delete({
        where: { id: playerId },
      }),
    ]);

    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE player:", e);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// Admin: Media binnen een tenant ophalen
app.get("/api/admin/tenants/:tenantId/media", async (req, res) => {
  try {
    const tenantId = Number(req.params.tenantId);
    if (isNaN(tenantId)) {
      return res.status(400).json({ error: "Ongeldige tenant-id" });
    }

    const media = await prisma.mediaAsset.findMany({
      where: { tenantId },
      orderBy: { id: "asc" },
    });

    res.json(media);
  } catch (e) {
    console.error("GET media:", e);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// Admin: Media aanmaken binnen tenant (URL-based, nog geen file-upload)
app.post("/api/admin/tenants/:tenantId/media", async (req, res) => {
  try {
    const tenantId = Number(req.params.tenantId);
    if (isNaN(tenantId)) {
      return res.status(400).json({ error: "Ongeldige tenant-id" });
    }

    const { filename, url, mimeType, mediaType, sizeBytes } = req.body as {
      filename?: string;
      url?: string;
      mimeType?: string;
      mediaType?: "IMAGE" | "VIDEO";
      sizeBytes?: number;
    };

    if (!filename || !url || !mimeType || !mediaType) {
      return res.status(400).json({
        error: "filename, url, mimeType en mediaType zijn verplicht",
      });
    }

    const media = await prisma.mediaAsset.create({
      data: {
        tenantId,
        filename,
        url,
        mimeType,
        mediaType,
        sizeBytes: sizeBytes ?? 0,
      },
    });

    res.status(201).json(media);
  } catch (e) {
    console.error("POST media:", e);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// Admin: Media verwijderen (incl. koppelingen in playlistitems)
app.delete("/api/admin/media/:id", async (req, res) => {
  try {
    const mediaId = Number(req.params.id);
    if (isNaN(mediaId)) {
      return res.status(400).json({ error: "Ongeldige media-id" });
    }

    await prisma.$transaction([
      prisma.playlistItem.deleteMany({
        where: { mediaId },
      }),
      prisma.mediaAsset.delete({
        where: { id: mediaId },
      }),
    ]);

    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE media:", e);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// 5) Eenvoudige admin-route: alle players ophalen
app.get("/api/admin/players", async (_req, res) => {
  try {
    const players = await prisma.player.findMany({
      include: {
        tenant: true,
        device: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.json(players);
  } catch (error) {
    console.error("Fout in /api/admin/players:", error);
    res.status(500).json({ error: "Interne serverfout" });
  }
});

// Playlist ophalen voor een gekoppeld device
app.get(
  "/api/device/playlist",
  deviceAuth,
  async (req: DeviceRequest, res) => {
    try {
      const device = req.device!;
      // Actieve playlist voor de player
      const playlist = await prisma.playlist.findFirst({
        where: {
          playerId: device.playerId,
          isActive: true,
        },
        include: {
          items: {
            include: {
              media: true,
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });

      if (!playlist) {
        return res.json({
          playerId: device.playerId,
          version: 0,
          items: [],
        });
      }

      const items = playlist.items.map((item) => ({
        id: item.id,
        type: item.media.mediaType,
        url: item.media.url,
        durationSec: item.durationSec ?? null,
      }));

      return res.json({
        playerId: device.playerId,
        version: playlist.version,
        items,
      });
    } catch (error) {
      console.error("Fout in /api/device/playlist:", error);
      return res.status(500).json({ error: "Interne serverfout" });
    }
  }
);


app.listen(port, () => {
  console.log(`Server luistert op http://localhost:${port}`);
});
