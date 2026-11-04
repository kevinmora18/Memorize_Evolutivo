-- Idempotencia de partidas: evita acreditar dos veces XP/monedas por el mismo
-- resultado (doble envío de React StrictMode, reintentos de red, etc.).
ALTER TABLE "matches" ADD COLUMN "matchKey" TEXT;

-- PostgreSQL permite múltiples NULL, así que las partidas históricas siguen
-- siendo válidas. Las nuevas partidas siempre envían matchKey.
CREATE UNIQUE INDEX "uq_matches_user_match_key" ON "matches"("userId", "matchKey");
