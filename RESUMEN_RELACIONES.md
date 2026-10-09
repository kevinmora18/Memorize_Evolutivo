# 📊 RESUMEN COMPLETO DE RELACIONES - BASE DE DATOS MEMORIZE

## 🔗 RELACIONES 1:1 (Uno a Uno)

### 1. **Users ←→ Estadisticas_Players**
```
Users (1) ──────── (1) Estadisticas_Players
```
- Cada usuario tiene exactamente una estadística
- Campo: `user_id UNIQUE` en Estadisticas_Players

### 2. **Users ←→ Users_Settings**
```
Users (1) ──────── (1) Users_Settings
```
- Cada usuario tiene exactamente una configuración
- Campo: `user_id UNIQUE` en Users_Settings

---

## 🔗 RELACIONES 1:N (Uno a Muchos)

### 3. **Users → Game_Sessions**
```
Users (1) ────────< (N) Game_Sessions
```
- Un usuario puede tener muchas sesiones de juego
- Campo: `user_id` en Game_Sessions (NO UNIQUE)

### 4. **Users → Rooms** (como host)
```
Users (1) ────────< (N) Rooms
```
- Un usuario puede crear muchas salas
- Campo: `host_id` en Rooms

### 5. **Users → Boss_Defeats**
```
Users (1) ────────< (N) Boss_Defeats
```
- Un usuario puede derrotar muchos jefes
- Campo: `user_id` en Boss_Defeats

### 6. **Users → Unlocked_Items**
```
Users (1) ────────< (N) Unlocked_Items
```
- Un usuario puede desbloquear muchos items
- Campo: `user_id` en Unlocked_Items

### 7. **Users → User_Purchases**
```
Users (1) ────────< (N) User_Purchases
```
- Un usuario puede hacer muchas compras
- Campo: `user_id` en User_Purchases

### 8. **Users → User_Currency**
```
Users (1) ────────< (N) User_Currency
```
- Un usuario tiene muchas transacciones de monedas
- Campo: `user_id` en User_Currency

### 9. **Users → Leaderboard_Entries**
```
Users (1) ────────< (N) Leaderboard_Entries
```
- Un usuario puede tener muchas entradas en rankings
- Campo: `user_id` en Leaderboard_Entries

### 10. **Users → Notifications**
```
Users (1) ────────< (N) Notifications
```
- Un usuario puede tener muchas notificaciones
- Campo: `user_id` en Notifications

### 11. **Users → Admin_Logs**
```
Users (1) ────────< (N) Admin_Logs
```
- Un admin puede tener muchos logs de acciones
- Campo: `admin_id` en Admin_Logs

### 12. **Users → Friend_Requests** (como sender)
```
Users (1) ────────< (N) Friend_Requests
```
- Un usuario puede enviar muchas solicitudes
- Campo: `sender_id` en Friend_Requests

### 13. **Users → Friend_Requests** (como receiver)
```
Users (1) ────────< (N) Friend_Requests
```
- Un usuario puede recibir muchas solicitudes
- Campo: `receiver_id` en Friend_Requests

### 14. **Shop_Items → User_Purchases**
```
Shop_Items (1) ────────< (N) User_Purchases
```
- Un item puede ser comprado muchas veces
- Campo: `item_id` en User_Purchases

### 15. **Shop_Items → Unlocked_Items**
```
Shop_Items (1) ────────< (N) Unlocked_Items
```
- Un item puede ser desbloqueado por muchos usuarios
- Campo: `item_id` en Unlocked_Items

### 16. **Achievements → User_Achievements**
```
Achievements (1) ────────< (N) User_Achievements
```
- Un logro puede ser obtenido por muchos usuarios
- Campo: `achievement_id` en User_Achievements

### 17. **Rooms → Room_Players**
```
Rooms (1) ────────< (N) Room_Players
```
- Una sala puede tener muchos jugadores
- Campo: `room_id` en Room_Players

---

## 🔗 RELACIONES N:N (Muchos a Muchos)

### 18. **Users ←→ Rooms** (a través de Room_Players)
```
Users (N) ────────< Room_Players >──────── (N) Rooms
```
- Muchos usuarios pueden estar en muchas salas
- Tabla intermedia: `Room_Players`
- Campos: `user_id` y `room_id`

### 19. **Users ←→ Achievements** (a través de User_Achievements)
```
Users (N) ────────< User_Achievements >──────── (N) Achievements
```
- Muchos usuarios pueden tener muchos logros
- Tabla intermedia: `User_Achievements`
- Campos: `user_id` y `achievement_id`

### 20. **Users ←→ Users** (Friendships - Auto-referencial)
```
Users (N) ────────< Friendships >──────── (N) Users
```
- Muchos usuarios pueden ser amigos de muchos usuarios
- Tabla intermedia: `Friendships`
- Campos: `user_id` y `friend_id`

---

## 📋 TABLAS SIN RELACIONES DIRECTAS

### 21. **Announcements**
- Tabla independiente de anuncios
- Referencia opcional a Users (created_by)

### 22. **Promotions**
- Tabla independiente de promociones
- Sin relaciones directas

---

## 📊 DIAGRAMA VISUAL COMPLETO

```
                            ┌─────────────────────────────────────┐
                            │          USERS (Principal)          │
                            │  - id, email, username, role        │
                            │  - level, xp, coins, gems           │
                            └─────────────────────────────────────┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        │                                 │                                 │
        │ 1:1                             │ 1:1                             │
        ▼                                 ▼                                 │
┌──────────────────┐            ┌──────────────────┐                       │
│Estadisticas_     │            │Users_Settings    │                       │
│Players (Único)   │            │(Único)           │                       │
└──────────────────┘            └──────────────────┘                       │
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │ 1:N                                                               │
        ▼                                                                   │
┌──────────────────┐                                                       │
│Game_Sessions     │                                                       │
│(Muchos)          │                                                       │
└──────────────────┘                                                       │
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │ 1:N (host)                                                        │
        ▼                                                                   │
┌──────────────────┐         ┌──────────────────┐                         │
│Rooms             │ N ────< │Room_Players      │ >──── N                 │
│(Muchos)          │         │(Tabla intermedia)│       (Relación N:N)    │
└──────────────────┘         └──────────────────┘                         │
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │ 1:N                                                               │
        ▼                                                                   │
┌──────────────────┐                                                       │
│Boss_Defeats      │                                                       │
│(Muchos)          │                                                       │
└──────────────────┘                                                       │
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │ N:N                                                               │
        ▼                                                                   │
┌──────────────────┐         ┌──────────────────┐         ┌──────────────┐
│Achievements      │ N ────< │User_Achievements │ >──── N │Users         │
│                  │         │(Tabla intermedia)│         │(Auto-ref)    │
└──────────────────┘         └──────────────────┘         └──────────────┘
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │ N:N (Amistades)                                                   │
        ▼                                                                   │
┌──────────────────┐         ┌──────────────────┐                         │
│Users             │ N ────< │Friendships       │ >──── N Users           │
│                  │         │(Auto-referencial)│         (mismo)         │
└──────────────────┘         └──────────────────┘                         │
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │ 1:N                                                               │
        ▼                                                                   │
┌──────────────────┐         ┌──────────────────┐                         │
│Shop_Items        │ 1 ────< │User_Purchases    │ >──── N Users           │
│                  │         │(Muchos)          │                         │
└──────────────────┘         └──────────────────┘                         │
        │                                                                   │
        │ 1:N                                                               │
        ▼                                                                   │
┌──────────────────┐                                                       │
│Unlocked_Items    │ >──── N Users                                         │
│(Muchos)          │                                                       │
└──────────────────┘                                                       │
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │ 1:N                                                               │
        ▼                                                                   │
┌──────────────────┐                                                       │
│User_Currency     │                                                       │
│(Muchos)          │                                                       │
└──────────────────┘                                                       │
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │ 1:N                                                               │
        ▼                                                                   │
┌──────────────────┐                                                       │
│Leaderboard_      │                                                       │
│Entries (Muchos)  │                                                       │
└──────────────────┘                                                       │
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │ 1:N                                                               │
        ▼                                                                   │
┌──────────────────┐                                                       │
│Notifications     │                                                       │
│(Muchos)          │                                                       │
└──────────────────┘                                                       │
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │ 1:N                                                               │
        ▼                                                                   │
┌──────────────────┐                                                       │
│Friend_Requests   │                                                       │
│(Muchos)          │                                                       │
└──────────────────┘                                                       │
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┘
        │
        │ 1:N (Admin)
        ▼
┌──────────────────┐
│Admin_Logs        │
│(Muchos)          │
└──────────────────┘

┌──────────────────┐         ┌──────────────────┐
│Announcements     │         │Promotions        │
│(Sin relación)    │         │(Sin relación)    │
└──────────────────┘         └──────────────────┘
```

---

## 📝 CONTEO TOTAL

- **Tablas totales**: 22
- **Relaciones 1:1**: 2
- **Relaciones 1:N**: 17
- **Relaciones N:N**: 3
- **Tablas sin relaciones**: 2

---

## 🎯 INSTRUCCIONES DE USO

1. Copia el contenido de `database_complete_diagram.dbml`
2. Ve a https://dbdiagram.io/
3. Pega el código en el editor
4. El diagrama se generará automáticamente con todas las relaciones visuales

¡Tu base de datos está completamente diseñada! 🎉
