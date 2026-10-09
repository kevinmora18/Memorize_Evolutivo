-- MIGRACIÓN DE DATOS EXISTENTES
-- Ejecutar después de crear todas las tablas

-- Migrar datos de inventories a unlocked_items
INSERT INTO public.unlocked_items ("userId", "itemType", "itemId")
SELECT 
    "userId",
    'pack' AS "itemType",
    unnest("ownedPacks") AS "itemId"
FROM public.inventories
WHERE "ownedPacks" IS NOT NULL AND array_length("ownedPacks", 1) > 0
ON CONFLICT ("userId", "itemType", "itemId") DO NOTHING;

INSERT INTO public.unlocked_items ("userId", "itemType", "itemId")
SELECT 
    "userId",
    'skin' AS "itemType",
    unnest("ownedSkins") AS "itemId"
FROM public.inventories
WHERE "ownedSkins" IS NOT NULL AND array_length("ownedSkins", 1) > 0
ON CONFLICT ("userId", "itemType", "itemId") DO NOTHING;

-- Crear user_settings para todos los usuarios
INSERT INTO public.user_settings ("userId")
SELECT id FROM public.users
ON CONFLICT ("userId") DO NOTHING;

-- Crear user_currency para todos los usuarios (separar de users)
INSERT INTO public.user_currency ("userId", coins, gems)
SELECT id, COALESCE(coins, 0), COALESCE(gems, 0)
FROM public.users
ON CONFLICT ("userId") DO NOTHING;

DO $$ BEGIN RAISE NOTICE 'Migración de datos completada'; END $$;
