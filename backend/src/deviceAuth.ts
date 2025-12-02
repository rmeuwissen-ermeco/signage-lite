import { Request, Response, NextFunction } from "express";
import prisma from "./prisma";

/**
 * Extends the Express Request type and adds a `device` field.
 * This preserves ALL Express methods (including `header()`),
 * preventing TypeScript errors seen during Render builds.
 */
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
    // Express Request.header() is fully available now
    const authHeader =
      req.header("authorization") || req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header" });
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
    console.error("Error in deviceAuth middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
