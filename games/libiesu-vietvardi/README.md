# Lībiešu vietvārdu spēle


## Data receiver repair – 2026-09-25

The game posts to the bound Apps Script project `1bK6md4ruItdMoOKWEF012GS8I3lBwtCcybKHR9dusjq1ESOVwFlMsWHw`, deployment `AKfycbzZJv4C-LK3cMy-ejINa4Di-Orr37jfLYed2pxw8CnZOneu8H72wJ3okuyd72Xu07FzAg`.

Version 3 rejected incoming sessions when the Games sheet had used columns beyond the 30 game fields, even though those 30 headers were correct. Live diagnostics returned `The header row in the "Games" sheet does not match HEADERS.` The dashboard itself correctly read the stored data, whose latest activity was 2026-07-26.

Receiver version 4 was deployed on 2026-09-25. It validates only the game-owned header prefix and leaves extra columns intact. `apps-script/receiver-sheet.gs` records the replacement helper; all other receiver code is unchanged. A no-write diagnostic request now passes header validation and reaches the expected `Unknown action` response. No synthetic sessions were inserted. Previously rejected payloads are not stored in the sheet and cannot be recovered from dashboard aggregates.

Validation: `node --test games/libiesu-vietvardi/tests/*.test.mjs`.
