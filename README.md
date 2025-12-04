# Signage-Lite

Signage-Lite is een lichte, lokaal-hostbare digital-signage oplossing met een 
web-gebaseerde player, multi-tenant support en een eenvoudige beheertool.  
Het project bestaat uit twee delen:

- **Backend (Node.js + Express + Prisma + PostgreSQL)**
- **Frontend (HTML/JS player + tijdelijke admin-interface)**

---

## Functionaliteit (versie 0.1 – 2 december 2025)

### 🎛️ Device & Player Flow
- Player start met een pairing-scherm en genereert automatisch een 6-cijferige code.
- Beheerder koppelt deze code aan een bestaande OF nieuwe player.
- Device krijgt daarna een **deviceToken** en authenticatie gebeurt met Bearer-token.
- Player stuurt automatisch schermresolutie (width/height) naar de backend.

### 📺 Playlist System
- Elke player kan meerdere playlists hebben.
- Eén playlist per player is actief (automatisch switch mogelijk).
- Playlist bevat:
  - Naam
  - Design canvas (breedte/hoogte)
  - Fit-mode (CONTAIN, COVER, STRETCH, ORIGINAL)
  - Versienummer (player laadt playlist opnieuw bij update)
- Playlist items bevatten:
  - Media (image/video)
  - Duur in seconden
  - Sortering (up/down reordering)

### 🖼️ Media Management
- Media wordt voorlopig als URL toegevoegd.
- Metadata: filename, url, mimeType, mediaType, sizeBytes.

### 🖥️ Player
- Speelt afbeeldingen en video's af in een continue loop.
- Fit-mode bepaalt hoe content wordt weergegeven.
- Debug-overlay toont:
  - Player ID, naam & locatie
  - Playlist naam & versie
  - Items in playlist
  - Fit-mode
  - Canvasresolutie
  - Schermresolutie
  - Actieve slide & duur

### 👨‍💼 Admin Interface (tijdelijke UI)
- Uniforme navigatiebalk voor alle admin-pagina’s.
- Pagina’s:
  - Tenants
  - Players
  - Media
  - Playlists
  - Playlist-items
- Volledige CRUD-functionaliteit aanwezig.

---

## Installatie

### 1. Install dependencies
```bash
npm install
```

### 2. Prisma setup
```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Start de backend
```bash
npm run dev
```

### 4. Start de player  
Open in je browser:
```
https://signage-lite.onrender.com/player.html
```

---

## Database
Prisma schema staat in:  
```
backend/prisma/schema.prisma
```

PostgreSQL is vereist als database.

---

## Roadmap / To-Do
- Moderne Vue/React admin interface
- Media uploads + thumbnails
- Scheduling per dag / periode
- Templates, widgets en overlays
- Offline caching voor de player
- Transitions (fade, slide, etc.)
- Playlists koppelen aan meerdere players
- Live websockets i.p.v. polling

---

Licentie: intern project Ermeco – niet bedoeld voor open distributie.
