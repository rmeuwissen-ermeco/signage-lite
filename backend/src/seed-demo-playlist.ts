import prisma from "./prisma";

async function main() {
  // 1. Zoek een tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error("Geen tenant gevonden. Maak eerst een tenant aan.");
  }

  console.log("Gevonden tenant:", tenant.id, tenant.name);

  // 2. Zoek een player bij deze tenant
  const player = await prisma.player.findFirst({
    where: { tenantId: tenant.id },
  });

  if (!player) {
    throw new Error(
      `Geen player gevonden voor tenant ${tenant.id}. Koppel eerst een device via de pairing-flow.`
    );
  }

  console.log("Gevonden player:", player.id, player.name);

  // 3. Maak een MediaAsset (demo-afbeelding)
  const media = await prisma.mediaAsset.create({
    data: {
      tenantId: tenant.id,
      filename: "demo-image.jpg",
      url: "https://picsum.photos/800/600.jpg",
      mimeType: "image/jpeg",
      mediaType: "IMAGE",
      sizeBytes: 123456,
    },
  });

  console.log("Aangemaakte media:", media.id, media.url);

  // 4. Maak een Playlist voor deze player
  const playlist = await prisma.playlist.create({
    data: {
      playerId: player.id,
      name: "Demo playlist",
      isActive: true,
      version: 1,
    },
  });

  console.log("Aangemaakte playlist:", playlist.id, playlist.name);

  // 5. Koppel media aan playlist
  const item = await prisma.playlistItem.create({
    data: {
      playlistId: playlist.id,
      mediaId: media.id,
      sortOrder: 1,
      durationSec: 10,
    },
  });

  console.log("Aangemaakte playlistitem:", item.id);

  console.log("✅ Demo playlist seeding afgerond.");
}

main()
  .catch((e) => {
    console.error("Fout in seed-demo-playlist:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

