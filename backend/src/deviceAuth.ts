import { Request, Response, NextFunction } from "express";
import prisma from "./prisma";

/**
 * Express Request + extra device-info.
 * We definiëren body als any om TypeScript niet in de weg te laten zitten
 * bij het parsen van JSON bodies in middleware en routes.
 */
export interface DeviceRequest extends Request {
  device?: {
    id: number;
    playerId: number;
    tenantId: number;
  };
  body: any;
}

export async function deviceAuth(
  req: DeviceRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Gebruik headers i.p.v. req.header() om type-gedoe te vermijden
    const rawAuthHeader =
      (req.headers["authorization"] as string | undefined) ??
      (req.headers["Authorization"] as string | undefined);

    if (!rawAuthHeader || !rawAuthHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header" });
    }

    const token = rawAuthHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({ error: "Missing device token" });
    }

    const device = await prisma.device.findUnique({
      where: { deviceToken: token },
      include: { player: true },
    });

    if (!device || !device.playerId || !device.player) {
      return res.status(401).json({ error: "Invalid device token" });
    }

    req.device = {
      id: device.id,
      playerId: device.player.id,
      tenantId: device.player.tenantId,
    };

    return next();
  } catch (error) {
    console.error("Error in deviceAuth middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
