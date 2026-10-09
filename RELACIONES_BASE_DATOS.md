# 📊 Relaciones de Base de Datos - Memorize Game

## 🔗 Tipos de Relaciones

### **1:1 (Uno a Uno)**
Una entidad de la tabla A se relaciona con **exactamente una** entidad de la tabla B.

#### Ejemplos en el proyecto:

**User ←→ PlayerStats**
```
┌─────────┐         ┌──────────────┐
│  User   │ 1 ─── 1 │ PlayerStats  │
└─────────┘         └──────────────┘
```
- **Explicación**: Cada usuario tiene exactamente un registro de estadísticas
- **Implementación**: `userId` en `PlayerStats` es UNIQUE
- **Ejemplo**: 
  - Usuario "Juan" → Estadísticas de Juan (gamesPlayed: 50, gamesWon: 30)
  - Usuario "María" → Estadísticas de María (gamesPlayed: 100, gamesWon: 80)

**User ←→ Inventory**
```
┌─────────┐         ┌───────────┐
│  User   │ 1 ─── 1 │ Inventory │
└─────────┘         └───────────┘
```
- **Explicación**: Cada usuario tiene exactamente un inventario
- **Implementación**: `userId` en `Inventory` es UNIQUE
- **Ejemplo**:
  - Usuario "Juan" → Inventario de Juan (ownedPacks: ["frutas", "animales"])
  - Usuario "María" → Inventario de María (ownedPacks: ["espacio", "oceano"])

---

### **1:N (Uno a Muchos)**
Una entidad de la tabla A se relaciona con **muchas** entidades de la tabla B.

#### Ejemplos en el proyecto:

**User → Matches**
```
┌─────────┐         ┌─────────┐
│  User   │ 1 ─── N │ Matches │
└─────────┘         └─────────┘
```
- **Explicación**: Un usuario puede tener muchas partidas
- **Implementación**: `userId` en `Matches` NO es UNIQUE (puede repetirse)
- **Ejemplo**:
  - Usuario "Juan" → Partida 1 (score: 100, mode: "classic")
  - Usuario "Juan" → Partida 2 (score: 150, mode: "infinite")
  - Usuario "Juan" → Partida 3 (score: 200, mode: "boss")
  - Usuario "María" → Partida 4 (score: 180, mode: "classic")

**User → AdminLogs**
```
┌─────────┐         ┌────────────┐
│  User   │ 1 ─── N │ AdminLogs  │
└─────────┘         └────────────┘
```
- **Explicación**: Un administrador puede tener muchos registros de acciones
- **Implementación**: `adminId` en `AdminLogs` NO es UNIQUE
- **Ejemplo**:
  - Admin "Carlos" → Log 1 (action: "ban_user", targetId: "user123")
  - Admin "Carlos" → Log 2 (action: "give_currency", targetId: "user456")
  - Admin "Carlos" → Log 3 (action: "create_announcement")

---

### **N:N (Muchos a Muchos)**
Muchas entidades de la tabla A se relacionan con **muchas** entidades de la tabla B.

#### ⚠️ No implementado actualmente en el proyecto

**Ejemplo hipotético: Users ←→ Achievements**
```
┌─────────┐         ┌──────────────────┐         ┌──────────────┐
│  User   │ N ─── N │ UserAchievements │ N ─── N │ Achievements │
└─────────┘         └──────────────────┘         └──────────────┘
                    (Tabla intermedia)
```
- **Explicación**: Muchos usuarios pueden tener muchos logros
- **Implementación**: Se necesita una tabla intermedia `UserAchievements`
- **Ejemplo**:
  - Usuario "Juan" → Logro "Primera Victoria", "100 Partidas", "Maestro"
  - Usuario "María" → Logro "Primera Victoria", "Combo x10"
  - Logro "Primera Victoria" → Usuarios: Juan, María, Pedro, Ana

**Cómo se implementaría:**
```prisma
model User {
  id           String              @id @default(uuid())
  achievements UserAchievement[]   // Relación N:N
}

model Achievement {
  id          String              @id @default(uuid())
  name        String
  description String
  users       UserAchievement[]   // Relación N:N
}

model UserAchievement {
  id            String      @id @default(uuid())
  userId        String
  achievementId String
  unlockedAt    DateTime    @default(now())
  
  user          User        @relation(fields: [userId], references: [id])
  achievement   Achievement @relation(fields: [achievementId], references: [id])
  
  @@unique([userId, achievementId]) // Un usuario no puede tener el mismo logro dos veces
}
```

---

## 📋 Resumen Visual

### Relaciones Actuales del Proyecto

```
                    ┌──────────────────────────────────────┐
                    │            USER (Principal)          │
                    │  - id, email, username, role         │
                    │  - level, xp, coins, gems            │
                    └──────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┬──────────────┐
                │             │             │              │
                │ 1:1         │ 1:1         │ 1:N          │ 1:N
                ▼             ▼             ▼              ▼
        ┌──────────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐
        │ PlayerStats  │ │Inventory │ │ Matches │ │ AdminLogs  │
        │ (Único)      │ │ (Único)  │ │(Muchos) │ │  (Muchos)  │
        └──────────────┘ └──────────┘ └─────────┘ └────────────┘

        ┌──────────────┐     ┌────────────┐
        │ Announcements│     │ Promotions │
        │(Sin relación)│     │(Sin relación)│
        └──────────────┘     └────────────┘
```

---

## 🎯 Cómo Identificar el Tipo de Relación

### **1:1 - Uno a Uno**
✅ La columna de relación tiene `UNIQUE`
✅ Cada registro en A tiene máximo 1 registro en B
✅ Ejemplo: `userId UNIQUE` en PlayerStats

### **1:N - Uno a Muchos**
✅ La columna de relación NO tiene `UNIQUE`
✅ Cada registro en A puede tener muchos registros en B
✅ Ejemplo: `userId` (sin UNIQUE) en Matches

### **N:N - Muchos a Muchos**
✅ Se necesita una tabla intermedia
✅ La tabla intermedia tiene dos foreign keys
✅ Ejemplo: UserAchievements con `userId` y `achievementId`

---

## 📝 Para tu Diagrama en Papel

### Símbolos a usar:

**1:1 (Uno a Uno)**
```
User ────────── PlayerStats
     (1)    (1)
```

**1:N (Uno a Muchos)**
```
User ────────── Matches
     (1)    (N)
```

**N:N (Muchos a Muchos)**
```
User ────────── UserAchievements ────────── Achievements
     (N)              (N)              (N)
```

### Notación alternativa:
- **1:1** → `─────`
- **1:N** → `────<`
- **N:N** → `>────<`

---

## 🔧 Comandos Útiles

### Ver el diagrama en dbdiagram.io:
1. Ve a https://dbdiagram.io/
2. Copia el contenido de `database_diagram.dbml`
3. Pégalo en el editor
4. El diagrama se generará automáticamente

### Regenerar el schema de Prisma:
```bash
cd backend
npx prisma generate
npx prisma db push
```

---

## 📚 Recursos Adicionales

- **Prisma Docs**: https://www.prisma.io/docs/concepts/components/prisma-schema/relations
- **DBML Syntax**: https://dbml.dbdiagram.io/docs/
- **Database Design**: https://www.lucidchart.com/pages/database-diagram/database-design
