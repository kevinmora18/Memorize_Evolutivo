import { Router } from 'express';
import { prisma } from '../index';
import { requireAdmin } from '../core/middleware/auth';
import { clampLimit, clampPage } from '../core/validation/schemas';

const router = Router();

// Todas las rutas de admin exigen JWT con rol admin.
// La identidad se toma del token firmado, NUNCA del body (evita suplantación).
router.use(requireAdmin);

// Helper: id del admin autenticado (para logs de auditoría)
const getAdminId = (req: any): string => req.auth?.userId;

/** Valida importes de moneda: entero no negativo (o ausente). */
function parseAmount(raw: unknown): { provided: boolean; valid: boolean; value: number } {
  if (raw === undefined || raw === null || raw === '') {
    return { provided: false, valid: true, value: 0 };
  }
  const parsed = Number(raw);
  const valid = Number.isInteger(parsed) && parsed >= 0 && parsed <= 1_000_000_000;
  return { provided: true, valid, value: valid ? parsed : 0 };
}

// Nunca devolver el hash de contraseña al cliente (ni siquiera al admin).
function withoutPasswordHash<T extends { passwordHash?: unknown }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...safe } = user;
  return safe;
}

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const { search, role, banned } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit, 50, 100);

    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    // Filtro de búsqueda
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Filtro por rol
    if (role) {
      where.role = role;
    }

    // Filtro por estado de baneo
    if (banned !== undefined) {
      where.isBanned = banned === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          stats: true,
          _count: {
            select: { matches: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users: users.map(withoutPasswordHash),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/admin/users/:id - Obtener detalles de un usuario
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        stats: true,
        inventory: true,
        matches: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { matches: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(withoutPasswordHash(user));
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// PUT /api/admin/users/:id/role - Cambiar rol de usuario
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = getAdminId(req);

    if (!['player', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const user = await prisma.$transaction(async (tx) => {
      const previous = await tx.user.findUnique({
        where: { id },
        select: { role: true },
      });

      if (!previous) {
        throw new Error('Usuario no encontrado');
      }

      const updated = await tx.user.update({
        where: { id },
        data: { role },
      });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'change_role',
          targetId: id,
          details: JSON.stringify({ oldRole: previous.role, newRole: role }),
        },
      });

      return updated;
    });

    res.json(withoutPasswordHash(user));
  } catch (error: any) {
    if (error?.message === 'Usuario no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error cambiando rol:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// PUT /api/admin/users/:id/currency - Modificar monedas/gemas
router.put('/users/:id/currency', async (req, res) => {
  try {
    const { id } = req.params;
    const { coins, gems } = req.body;
    const adminId = getAdminId(req);

    const coinsInput = parseAmount(coins);
    const gemsInput = parseAmount(gems);

    if (!coinsInput.valid || !gemsInput.valid) {
      return res.status(400).json({ error: 'Monedas y gemas deben ser enteros no negativos' });
    }

    if (!coinsInput.provided && !gemsInput.provided) {
      return res.status(400).json({ error: 'Debe especificar coins o gems' });
    }

    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          ...(coinsInput.provided && { coins: coinsInput.value }),
          ...(gemsInput.provided && { gems: gemsInput.value }),
        },
      });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'give_currency',
          targetId: id,
          details: JSON.stringify({
            coins: coinsInput.provided ? coinsInput.value : undefined,
            gems: gemsInput.provided ? gemsInput.value : undefined,
          }),
        },
      });

      return updated;
    });

    res.json(withoutPasswordHash(user));
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    console.error('Error modificando monedas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// PUT /api/admin/users/:id/ban - Banear usuario
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, duration } = req.body; // duration en horas, null = permanente
    const adminId = getAdminId(req);

    let bannedUntil: Date | null = null;
    if (duration !== undefined && duration !== null && duration !== '') {
      const hours = Number(duration);
      if (!Number.isFinite(hours) || hours <= 0 || hours > 24 * 365 * 10) {
        return res.status(400).json({ error: 'Duración inválida (horas positivas)' });
      }
      bannedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          isBanned: true,
          bannedUntil,
          banReason: reason || 'Sin razón especificada',
        },
      });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'ban_user',
          targetId: id,
          details: JSON.stringify({ reason, duration, bannedUntil }),
        },
      });

      return updated;
    });

    res.json(withoutPasswordHash(user));
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    console.error('Error baneando usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// PUT /api/admin/users/:id/unban - Desbanear usuario
router.put('/users/:id/unban', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = getAdminId(req);

    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          isBanned: false,
          bannedUntil: null,
          banReason: null,
        },
      });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'unban_user',
          targetId: id,
          details: JSON.stringify({ unbannedAt: new Date() }),
        },
      });

      return updated;
    });

    res.json(withoutPasswordHash(user));
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    console.error('Error desbaneando usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = getAdminId(req);

    // Soft-delete: conserva el historial y evita romper referencias (partidas,
    // inventario, logs). Los repositorios ya excluyen usuarios con deletedAt.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { deletedAt: new Date(), isBanned: false, bannedUntil: null, banReason: null },
      });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'delete_user',
          targetId: id,
          details: JSON.stringify({ deletedAt: new Date() }),
        },
      });
    });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// ESTADÍSTICAS Y ANALÍTICAS
// ============================================

// GET /api/admin/stats - Estadísticas generales
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalMatches,
      activeUsers,
      bannedUsers,
      totalCoins,
      totalGems,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.match.count(),
      prisma.user.count({
        where: {
          deletedAt: null,
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
          },
        },
      }),
      prisma.user.count({ where: { deletedAt: null, isBanned: true } }),
      prisma.user.aggregate({ where: { deletedAt: null }, _sum: { coins: true } }),
      prisma.user.aggregate({ where: { deletedAt: null }, _sum: { gems: true } }),
    ]);

    // Estadísticas de partidas por modo
    const matchesByMode = await prisma.match.groupBy({
      by: ['mode'],
      _count: { mode: true },
    });

    // Top jugadores por puntuación (solo cuentas activas)
    const topPlayers = await prisma.user.findMany({
      where: { deletedAt: null, isBanned: false },
      orderBy: { xp: 'desc' },
      take: 10,
      include: {
        stats: true,
      },
    });

    res.json({
      overview: {
        totalUsers,
        totalMatches,
        activeUsers,
        bannedUsers,
        totalCoins: totalCoins._sum.coins || 0,
        totalGems: totalGems._sum.gems || 0,
      },
      matchesByMode,
      topPlayers: topPlayers.map(withoutPasswordHash),
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/admin/matches - Listar todas las partidas
router.get('/matches', async (req, res) => {
  try {
    const { mode, userId } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit, 50, 100);

    const skip = (page - 1) * limit;
    const where: any = {};

    if (mode) {
      where.mode = mode;
    }

    if (userId) {
      where.userId = userId;
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              level: true,
            },
          },
        },
      }),
      prisma.match.count({ where }),
    ]);

    res.json({
      matches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listando partidas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/admin/banned-users - Listar usuarios baneados
router.get('/banned-users', async (req, res) => {
  try {
    const bannedUsers = await prisma.user.findMany({
      where: { isBanned: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        stats: true,
      },
    });

    res.json(bannedUsers.map(withoutPasswordHash));
  } catch (error) {
    console.error('Error listando usuarios baneados:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// ANUNCIOS
// ============================================

// GET /api/admin/announcements - Listar anuncios
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(announcements);
  } catch (error) {
    console.error('Error listando anuncios:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// POST /api/admin/announcements - Crear anuncio
router.post('/announcements', async (req, res) => {
  try {
    const { title, message, type, expiresAt } = req.body;
    const adminId = getAdminId(req);

    if (!title || !message) {
      return res.status(400).json({ error: 'Título y mensaje requeridos' });
    }

    const announcement = await prisma.$transaction(async (tx) => {
      const created = await tx.announcement.create({
        data: {
          title,
          message,
          type: type || 'info',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
        },
      });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'create_announcement',
          targetId: created.id,
          details: JSON.stringify({ title, type }),
        },
      });

      return created;
    });

    res.json(announcement);
  } catch (error) {
    console.error('Error creando anuncio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// PUT /api/admin/announcements/:id/toggle - Activar/desactivar anuncio
router.put('/announcements/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const adminId = getAdminId(req);

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive debe ser booleano' });
    }

    const announcement = await prisma.$transaction(async (tx) => {
      const updated = await tx.announcement.update({
        where: { id },
        data: { isActive },
      });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'toggle_announcement',
          targetId: id,
          details: JSON.stringify({ isActive }),
        },
      });

      return updated;
    });

    res.json(announcement);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }
    console.error('Error actualizando anuncio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// DELETE /api/admin/announcements/:id - Eliminar anuncio
router.delete('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = getAdminId(req);

    await prisma.$transaction(async (tx) => {
      await tx.announcement.delete({ where: { id } });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'delete_announcement',
          targetId: id,
        },
      });
    });

    res.json({ message: 'Anuncio eliminado correctamente' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }
    console.error('Error eliminando anuncio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// PROMOCIONES
// ============================================

// GET /api/admin/promotions - Listar promociones
router.get('/promotions', async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(promotions);
  } catch (error) {
    console.error('Error listando promociones:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// POST /api/admin/promotions - Crear promoción
router.post('/promotions', async (req, res) => {
  try {
    const { name, description, type, value, startDate, endDate } = req.body;
    const adminId = getAdminId(req);

    if (typeof name !== 'string' || !name.trim() || typeof type !== 'string' || !type.trim()) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return res.status(400).json({ error: 'Valor de promoción inválido' });
    }

    const parsedEnd = new Date(endDate);
    if (!endDate || Number.isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ error: 'Fecha de fin inválida' });
    }

    const parsedStart = startDate ? new Date(startDate) : new Date();
    if (Number.isNaN(parsedStart.getTime())) {
      return res.status(400).json({ error: 'Fecha de inicio inválida' });
    }

    if (parsedEnd <= parsedStart) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior al inicio' });
    }

    const promotion = await prisma.$transaction(async (tx) => {
      const created = await tx.promotion.create({
        data: {
          name: name.trim(),
          description: description || '',
          type: type.trim(),
          value: numericValue,
          startDate: parsedStart,
          endDate: parsedEnd,
          isActive: true,
        },
      });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'create_promotion',
          targetId: created.id,
          details: JSON.stringify({ name: created.name, type: created.type, value: created.value }),
        },
      });

      return created;
    });

    res.json(promotion);
  } catch (error) {
    console.error('Error creando promoción:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// DELETE /api/admin/promotions/:id - Eliminar promoción
router.delete('/promotions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = getAdminId(req);

    await prisma.$transaction(async (tx) => {
      await tx.promotion.delete({ where: { id } });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'delete_promotion',
          targetId: id,
        },
      });
    });

    res.json({ message: 'Promoción eliminada correctamente' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }
    console.error('Error eliminando promoción:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// ANALÍTICAS AVANZADAS
// ============================================

// GET /api/admin/analytics - Analíticas detalladas
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Calcular fecha de inicio según el período
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Nuevos usuarios
    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Partidas jugadas
    const matchesPlayed = await prisma.match.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Usuarios activos
    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: { gte: startDate },
      },
    });

    // Distribución por modo de juego
    const modeDistribution = await prisma.match.groupBy({
      by: ['mode'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { mode: true },
    });

    // Tasa de retención (usuarios que jugaron más de una vez)
    const usersWithMultipleMatches = await prisma.user.findMany({
      where: {
        matches: {
          some: {
            createdAt: { gte: startDate },
          },
        },
      },
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    const retentionRate = usersWithMultipleMatches.filter(u => u._count.matches > 1).length / 
                          (usersWithMultipleMatches.length || 1) * 100;

    // Promedio de partidas por usuario
    const avgMatchesPerUser = matchesPlayed / (activeUsers || 1);

    res.json({
      period,
      startDate,
      endDate: now,
      metrics: {
        newUsers,
        matchesPlayed,
        activeUsers,
        retentionRate: Math.round(retentionRate * 100) / 100,
        avgMatchesPerUser: Math.round(avgMatchesPerUser * 100) / 100,
      },
      modeDistribution,
    });
  } catch (error) {
    console.error('Error obteniendo analíticas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// ACCIONES MASIVAS
// ============================================

// POST /api/admin/give-currency-all - Dar monedas/gemas a todos los usuarios
router.post('/give-currency-all', async (req, res) => {
  try {
    const { coins, gems } = req.body;
    const adminId = getAdminId(req);

    const coinsInput = parseAmount(coins);
    const gemsInput = parseAmount(gems);

    if (!coinsInput.valid || !gemsInput.valid) {
      return res.status(400).json({ error: 'Monedas y gemas deben ser enteros no negativos' });
    }

    // En una entrega masiva el incremento debe ser positivo (0 no aporta nada).
    const coinsToAdd = coinsInput.provided && coinsInput.value > 0 ? coinsInput.value : 0;
    const gemsToAdd = gemsInput.provided && gemsInput.value > 0 ? gemsInput.value : 0;

    if (coinsToAdd === 0 && gemsToAdd === 0) {
      return res.status(400).json({ error: 'Debe especificar una cantidad positiva de coins o gems' });
    }

    const updateData: any = {};
    if (coinsToAdd > 0) updateData.coins = { increment: coinsToAdd };
    if (gemsToAdd > 0) updateData.gems = { increment: gemsToAdd };

    const result = await prisma.$transaction(async (tx) => {
      // Solo cuentas activas: no se premia a baneados ni eliminados.
      const updateResult = await tx.user.updateMany({
        where: { deletedAt: null, isBanned: false },
        data: updateData,
      });

      await tx.adminLog.create({
        data: {
          adminId,
          action: 'give_currency_all',
          details: JSON.stringify({
            coins: coinsToAdd || undefined,
            gems: gemsToAdd || undefined,
            affectedUsers: updateResult.count,
          }),
        },
      });

      return updateResult;
    });

    res.json({
      message: `Monedas otorgadas a ${result.count} usuarios`,
      affectedUsers: result.count,
    });
  } catch (error) {
    console.error('Error dando monedas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/admin/logs - Obtener logs administrativos
router.get('/logs', async (req, res) => {
  try {
    const { action, adminId } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit, 50, 100);

    const skip = (page - 1) * limit;
    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      prisma.adminLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
