-- La ruta POST /api/matches ya actualiza player_stats y las recompensas del usuario.
-- El trigger duplicaba esas operaciones (2 partidas, doble XP y doble monedas por cada partida).
DROP TRIGGER IF EXISTS trg_matches_update_stats ON public.matches;
DROP FUNCTION IF EXISTS public.fn_trg_matches_update_stats();
