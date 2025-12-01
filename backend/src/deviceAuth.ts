import { Request, Response, NextFunction } from "express";
import prisma from "./prisma";

export interface DeviceRequest extends Request {
  device?: {
    id: number;
    playerId: number;
    tenantId: number;
  };
}

export async function deviceAuth(
  req: DeviceRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader =
      req.header("authorization") || req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.slice("Bearer ".length).trim();

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
    console.error("Fout in deviceAuth middleware:", error);
    return res.status(500).json({ error: "Interne serverfout" });
  }
}

