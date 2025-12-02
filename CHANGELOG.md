# Changelog – Signage-Lite  
Alle belangrijke wijzigingen worden hieronder bijgehouden.

---

## **v0.1 – 2 december 2025**
_Eerste functionele basisrelease_

### 🎛️ Device & Player Workflow
- Player toont pairing-scherm bij eerste start.
- Backend genereert unieke 6-cijferige pairing code.
- Admin kan device koppelen aan bestaande player via pairing-code.
- Na koppeling ontvangt device een **deviceToken** voor authenticatie.
- Player stuurt schermresolutie automatisch door naar backend.

### 📺 Playlist Systeem
- Playlists kunnen worden aangemaakt per player.
- Velden toegevoegd:  
  - `designWidth`, `designHeight`  
  - `fitMode` (CONTAIN, COVER, STRETCH, ORIGINAL)  
  - `version` (autobump bij wijzigingen)
- Mogelijkheid om playlist actief te maken (deactiveert andere playlists).
- Items binnen een playlist:
  - Media koppelen
  - Duur instellen
  - Sorteren (up/down reordering)
  - Automatische version bump bij aanpassingen

### 🖼️ Media Management
- Media-upload vervangen door URL-based media-invoer (tijdelijke oplossing).
- Metadata-ondersteuning: filename, url, mimeType, mediaType, sizeBytes.
- Verwijderen van media verwijdert automatisch gekoppelde playlist-items.

### 🖥️ Player (frontend)
- Slideshow engine voor afbeeldingen en video's.
- Fit-modes volledig geïmplementeerd:
  - CONTAIN (default)
  - COVER
  - STRETCH
  - ORIGINAL
- Debug-overlay toegevoegd met:
  - Player naam + locatie
  - Playlist naam + versie
  - Aantal items
  - Actieve slide + duur
  - Canvasresolutie (playlist)
  - Schermresolutie (device)
  - Fit-mode

### 👨‍💼 Admin Interface (tijdelijke UI)
- Complete revisie van de layout:
  - Uniforme header + navigatie
  - Donkere thematische stijl (Ermeco-stijl)
- Verbeterde pagina's:
  - **Playlists**
    - Nieuwe playlist aanmaken incl. canvas en fit-mode
    - Fit-mode wijzigen vanuit overzicht
  - **Playlist Items**
    - Volledig herontworpen naar moderne interface
    - Sorteerfunctie verbeterd
  - **Players**
    - Player-info overzichtelijker
    - Pairing via admin werkt stabiel
  - **Tenants** en **Media** pagina's gestroomlijnd

### 🛠️ Backend
- Prisma schema uitgebreid met:
  - `fitMode` enum + kolom
  - `designWidth` en `designHeight`
  - `screenWidth` en `screenHeight`
- Beveiligde endpoint `/api/device/playlist`
  - retourneert nu ook: playlistName, playerName, playerLocation
- Herstructurering van admin-routes
- Betere foutafhandeling en logging

---

## **v0.0 – Architectuurfase**
- Initieel project opgezet.
- Basis Prisma-schema voor tenants, players, media, playlists en items.
- Eerste player prototype (slideshow zonder pairing).
- Basis Express backend structuur.
- Testdata aangelegd.

---

