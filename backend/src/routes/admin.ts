import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Middleware para verificar rol de admin
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'ID de administrador requerido' });
    }

    const user = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
    }

    req.admin = user;
    next();
  } catch (error) {
    console.error('Error verificando admin:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role, banned } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

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
        take: Number(limit),
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
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
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

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// PUT /api/admin/users/:id/role - Cambiar rol de usuario
router.put('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, adminId } = req.body;

    if (!['player', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    // Registrar acción en logs
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'change_role',
        targetId: id,
        details: JSON.stringify({ oldRole: user.role, newRole: role }),
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error cambiando rol:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// PUT /api/admin/users/:id/currency - Modificar monedas/gemas
router.put('/users/:id/currency', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { coins, gems, adminId } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(coins !== undefined && { coins }),
        ...(gems !== undefined && { gems }),
      },
    });

    // Registrar acción en logs
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'give_currency',
        targetId: id,
        details: JSON.stringify({ coins, gems }),
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error modificando monedas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// PUT /api/admin/users/:id/ban - Banear usuario
router.put('/users/:id/ban', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, duration, adminId } = req.body; // duration en horas, null = permanente

    let bannedUntil = null;
    if (duration) {
      bannedUntil = new Date();
      bannedUntil.setHours(bannedUntil.getHours() + duration);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        bannedUntil,
        banReason: reason || 'Sin razón especificada',
      },
    });

    // Registrar acción en logs
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'ban_user',
        targetId: id,
        details: JSON.stringify({ reason, duration, bannedUntil }),
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error baneando usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// PUT /api/admin/users/:id/unban - Desbanear usuario
router.put('/users/:id/unban', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      },
    });

    // Registrar acción en logs
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'unban_user',
        targetId: id,
        details: JSON.stringify({ unbannedAt: new Date() }),
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error desbaneando usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    await prisma.user.delete({
      where: { id },
    });

    // Registrar acción en logs
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'delete_user',
        targetId: id,
        details: JSON.stringify({ deletedAt: new Date() }),
      },
    });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
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
      prisma.user.count(),
      prisma.match.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
          },
        },
      }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.aggregate({ _sum: { coins: true } }),
      prisma.user.aggregate({ _sum: { gems: true } }),
    ]);

    // Estadísticas de partidas por modo
    const matchesByMode = await prisma.match.groupBy({
      by: ['mode'],
      _count: { mode: true },
    });

    // Top jugadores por puntuación
    const topPlayers = await prisma.user.findMany({
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
      topPlayers,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/admin/matches - Listar todas las partidas
router.get('/matches', async (req, res) => {
  try {
    const { page = 1, limit = 50, mode, userId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
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
        take: Number(limit),
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
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
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

    res.json(bannedUsers);
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
router.post('/announcements', requireAdmin, async (req, res) => {
  try {
    const { title, message, type, expiresAt, adminId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Título y mensaje requeridos' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        type: type || 'info',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    // Registrar acción en logs
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'create_announcement',
        targetId: announcement.id,
        details: JSON.stringify({ title, type }),
      },
    });

    res.json(announcement);
  } catch (error) {
    console.error('Error creando anuncio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// PUT /api/admin/announcements/:id/toggle - Activar/desactivar anuncio
router.put('/announcements/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: { isActive },
    });

    res.json(announcement);
  } catch (error) {
    console.error('Error actualizando anuncio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// DELETE /api/admin/announcements/:id - Eliminar anuncio
router.delete('/announcements/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.announcement.delete({
      where: { id },
    });

    res.json({ message: 'Anuncio eliminado correctamente' });
  } catch (error) {
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
router.post('/promotions', requireAdmin, async (req, res) => {
  try {
    const { name, description, type, value, startDate, endDate, adminId } = req.body;

    if (!name || !type || !value || !endDate) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const promotion = await prisma.promotion.create({
      data: {
        name,
        description: description || '',
        type,
        value,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: new Date(endDate),
        isActive: true,
      },
    });

    // Registrar acción en logs
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'create_promotion',
        targetId: promotion.id,
        details: JSON.stringify({ name, type, value }),
      },
    });

    res.json(promotion);
  } catch (error) {
    console.error('Error creando promoción:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// DELETE /api/admin/promotions/:id - Eliminar promoción
router.delete('/promotions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.promotion.delete({
      where: { id },
    });

    res.json({ message: 'Promoción eliminada correctamente' });
  } catch (error) {
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
router.post('/give-currency-all', requireAdmin, async (req, res) => {
  try {
    const { coins, gems, adminId } = req.body;

    if (!coins && !gems) {
      return res.status(400).json({ error: 'Debe especificar coins o gems' });
    }

    const updateData: any = {};
    if (coins) {
      updateData.coins = { increment: coins };
    }
    if (gems) {
      updateData.gems = { increment: gems };
    }

    const result = await prisma.user.updateMany({
      data: updateData,
    });

    // Registrar acción en logs
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'give_currency_all',
        details: JSON.stringify({ coins, gems, affectedUsers: result.count }),
      },
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
    const { page = 1, limit = 50, action, adminId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
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
        take: Number(limit),
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
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
