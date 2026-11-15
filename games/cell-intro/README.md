# A world inside a cell

Interactive introduction with independently selectable plant, human cheek-cell and E.coli journeys. Each route retains its own progress and ends with persistent matching pairs and optional access to a shared research scene.

The full-screen research scene uses the same navigation, pause, replay and settings controls as the exploration. It retains the selected music track, mute and volume. Its final choices return to the chooser, return to the introduction while keeping earned progress, or open the existing ResearchGames.eu games catalogue.

No build is required; serve this directory through an HTTP server. The production path is https://researchgames.eu/games/cell-intro/ . Videos support native HTTP byte-range delivery, use H.264 with fast-start metadata, and carry no audio stream; the existing soundtrack mixer supplies music exactly once.

See [CREDITS.md](CREDITS.md) for source attribution, licences, adaptations and scientific context.
