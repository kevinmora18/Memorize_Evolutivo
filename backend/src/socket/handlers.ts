import { Server, Socket } from 'socket.io';
import { rooms } from '../routes/rooms';

interface Player {
  id: string;
  socketId: string;
  name: string;
  level: number;
  isReady: boolean;
  score?: number;
  matches?: number;
  isConnected: boolean;
}

interface GameRoom {
  id: string;
  players: Map<string, Player>;
  gameState: {
    status: 'waiting' | 'playing' | 'finished';
    currentRound: number;
    totalRounds: number;
    cards: any[];
    flippedCards: number[];
    matchedCards: number[];
    currentTurn: string | null;
    scores: Map<string, number>;
  };
}

const gameRooms = new Map<string, GameRoom>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Usuario conectado: ${socket.id}`);

    // ============================================
    // GESTIÓN DE SALAS
    // ============================================

    // Unirse a una sala
    socket.on('room:join', async ({ roomId, userId, userName, userLevel }: {
      roomId: string;
      userId: string;
      userName: string;
      userLevel: number;
    }) => {
      try {
        // Verificar que la sala existe
        const room = rooms.get(roomId);
        if (!room) {
          socket.emit('room:error', { message: 'Sala no encontrada' });
          return;
        }

        // Unirse al room de Socket.IO
        socket.join(roomId);

        // Crear o actualizar game room
        if (!gameRooms.has(roomId)) {
          gameRooms.set(roomId, {
            id: roomId,
            players: new Map(),
            gameState: {
              status: 'waiting',
              currentRound: 0,
              totalRounds: 1,
              cards: [],
              flippedCards: [],
              matchedCards: [],
              currentTurn: null,
              scores: new Map(),
            },
          });
        }

        const gameRoom = gameRooms.get(roomId)!;
        
        // Agregar jugador
        gameRoom.players.set(userId, {
          id: userId,
          socketId: socket.id,
          name: userName,
          level: userLevel,
          isReady: false,
          score: 0,
          matches: 0,
          isConnected: true,
        });

        // Notificar a todos en la sala
        io.to(roomId).emit('room:player-joined', {
          player: {
            id: userId,
            name: userName,
            level: userLevel,
            isReady: false,
          },
          players: Array.from(gameRoom.players.values()),
        });

        // Enviar estado actual al jugador que se unió
        socket.emit('room:joined', {
          roomId,
          players: Array.from(gameRoom.players.values()),
          gameState: gameRoom.gameState,
        });

        console.log(`👤 ${userName} se unió a la sala ${roomId}`);
      } catch (error) {
        console.error('Error en room:join:', error);
        socket.emit('room:error', { message: 'Error al unirse a la sala' });
      }
    });

    // Salir de una sala
    socket.on('room:leave', ({ roomId, userId }: { roomId: string; userId: string }) => {
      try {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom) return;

        const player = gameRoom.players.get(userId);
        if (player) {
          gameRoom.players.delete(userId);
          socket.leave(roomId);

          // Notificar a todos
          io.to(roomId).emit('room:player-left', {
            playerId: userId,
            playerName: player.name,
            players: Array.from(gameRoom.players.values()),
          });

          // Si no quedan jugadores, eliminar sala
          if (gameRoom.players.size === 0) {
            gameRooms.delete(roomId);
            rooms.delete(roomId);
            console.log(`🗑️  Sala ${roomId} eliminada (sin jugadores)`);
          }

          console.log(`👋 ${player.name} salió de la sala ${roomId}`);
        }
      } catch (error) {
        console.error('Error en room:leave:', error);
      }
    });

    // Marcar como listo
    socket.on('room:ready', ({ roomId, userId, isReady }: { roomId: string; userId: string; isReady: boolean }) => {
      try {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom) return;

        const player = gameRoom.players.get(userId);
        if (player) {
          player.isReady = isReady;

          io.to(roomId).emit('room:player-ready', {
            playerId: userId,
            isReady,
            players: Array.from(gameRoom.players.values()),
          });

          console.log(`✅ ${player.name} está ${isReady ? 'listo' : 'no listo'}`);
        }
      } catch (error) {
        console.error('Error en room:ready:', error);
      }
    });

    // ============================================
    // GESTIÓN DE PARTIDA
    // ============================================

    // Iniciar partida
    socket.on('game:start', ({ roomId, cards }: { roomId: string; cards: any[] }) => {
      try {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom) return;

        // Inicializar estado del juego
        gameRoom.gameState = {
          status: 'playing',
          currentRound: 1,
          totalRounds: 1,
          cards: cards || [],
          flippedCards: [],
          matchedCards: [],
          currentTurn: Array.from(gameRoom.players.keys())[0],
          scores: new Map(Array.from(gameRoom.players.keys()).map(id => [id, 0])),
        };

        // Notificar a todos
        io.to(roomId).emit('game:started', {
          gameState: gameRoom.gameState,
          cards: cards,
          firstTurn: gameRoom.gameState.currentTurn,
        });

        console.log(`🎮 Partida iniciada en sala ${roomId}`);
      } catch (error) {
        console.error('Error en game:start:', error);
      }
    });

    // Voltear carta
    socket.on('game:flip-card', ({ roomId, userId, cardIndex }: { roomId: string; userId: string; cardIndex: number }) => {
      try {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom) return;

        const { gameState } = gameRoom;

        // Verificar que es el turno del jugador
        if (gameState.currentTurn !== userId) {
          socket.emit('game:error', { message: 'No es tu turno' });
          return;
        }

        // Verificar que no se han volteado 2 cartas ya
        if (gameState.flippedCards.length >= 2) {
          socket.emit('game:error', { message: 'Ya hay 2 cartas volteadas' });
          return;
        }

        // Verificar que la carta no está ya volteada o emparejada
        if (gameState.flippedCards.includes(cardIndex) || 
            gameState.matchedCards.includes(cardIndex)) {
          socket.emit('game:error', { message: 'Carta no disponible' });
          return;
        }

        // Voltear carta
        gameState.flippedCards.push(cardIndex);

        // Notificar a todos
        io.to(roomId).emit('game:card-flipped', {
          playerId: userId,
          cardIndex,
          flippedCards: gameState.flippedCards,
        });

        // Si se voltearon 2 cartas, verificar match
        if (gameState.flippedCards.length === 2) {
          const [card1Idx, card2Idx] = gameState.flippedCards;
          const card1 = gameState.cards[card1Idx];
          const card2 = gameState.cards[card2Idx];

          setTimeout(() => {
            if (card1.id === card2.id) {
              // Match encontrado
              gameState.matchedCards.push(card1Idx, card2Idx);
              const currentScore = gameState.scores.get(userId) || 0;
              gameState.scores.set(userId, currentScore + 1);

              io.to(roomId).emit('game:match-found', {
                playerId: userId,
                cardIndexes: [card1Idx, card2Idx],
                matchedCards: gameState.matchedCards,
                scores: Object.fromEntries(gameState.scores),
              });

              // Verificar si el juego terminó
              if (gameState.matchedCards.length === gameState.cards.length) {
                gameState.status = 'finished';
                
                // Determinar ganador
                let winnerId = null;
                let maxScore = 0;
                gameState.scores.forEach((score, playerId) => {
                  if (score > maxScore) {
                    maxScore = score;
                    winnerId = playerId;
                  }
                });

                io.to(roomId).emit('game:finished', {
                  winnerId,
                  scores: Object.fromEntries(gameState.scores),
                  players: Array.from(gameRoom.players.values()),
                });

                console.log(`🏆 Partida terminada en sala ${roomId}. Ganador: ${winnerId}`);
              }
            } else {
              // No hay match
              io.to(roomId).emit('game:no-match', {
                cardIndexes: [card1Idx, card2Idx],
              });

              // Cambiar turno
              const playerIds = Array.from(gameRoom.players.keys());
              const currentIndex = playerIds.indexOf(userId);
              const nextIndex = (currentIndex + 1) % playerIds.length;
              gameState.currentTurn = playerIds[nextIndex];

              io.to(roomId).emit('game:turn-changed', {
                currentTurn: gameState.currentTurn,
              });
            }

            // Limpiar cartas volteadas
            gameState.flippedCards = [];
          }, 1500);
        }
      } catch (error) {
        console.error('Error en game:flip-card:', error);
      }
    });

    // Enviar mensaje de chat
    socket.on('chat:message', ({ roomId, userId, userName, message }: { 
      roomId: string; 
      userId: string; 
      userName: string; 
      message: string 
    }) => {
      try {
        io.to(roomId).emit('chat:message', {
          userId,
          userName,
          message,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error en chat:message:', error);
      }
    });

    // Actualizar puntuación en tiempo real
    socket.on('game:update-score', ({ roomId, userId, score, matches }: { 
      roomId: string; 
      userId: string; 
      score: number; 
      matches: number 
    }) => {
      try {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom) return;

        const player = gameRoom.players.get(userId);
        if (player) {
          player.score = score;
          player.matches = matches;

          io.to(roomId).emit('game:score-updated', {
            playerId: userId,
            score,
            matches,
            players: Array.from(gameRoom.players.values()),
          });
        }
      } catch (error) {
        console.error('Error en game:update-score:', error);
      }
    });

    // ============================================
    // DESCONEXIÓN
    // ============================================

    socket.on('disconnect', () => {
      console.log(`🔌 Usuario desconectado: ${socket.id}`);

      // Buscar en qué sala estaba el usuario
      gameRooms.forEach((gameRoom, roomId) => {
        gameRoom.players.forEach((player, userId) => {
          if (player.socketId === socket.id) {
            player.isConnected = false;

            // Notificar desconexión
            io.to(roomId).emit('room:player-disconnected', {
              playerId: userId,
              playerName: player.name,
            });

            // Eliminar después de 30 segundos si no se reconecta
            setTimeout(() => {
              const currentPlayer = gameRoom.players.get(userId);
              if (currentPlayer && !currentPlayer.isConnected) {
                gameRoom.players.delete(userId);
                
                io.to(roomId).emit('room:player-left', {
                  playerId: userId,
                  playerName: player.name,
                  players: Array.from(gameRoom.players.values()),
                });

                // Si no quedan jugadores, eliminar sala
                if (gameRoom.players.size === 0) {
                  gameRooms.delete(roomId);
                  rooms.delete(roomId);
                  console.log(`🗑️  Sala ${roomId} eliminada (sin jugadores)`);
                }
              }
            }, 30000);
          }
        });
      });
    });

    // Reconexión
    socket.on('room:reconnect', ({ roomId, userId }: { roomId: string; userId: string }) => {
      try {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom) return;

        const player = gameRoom.players.get(userId);
        if (player) {
          player.socketId = socket.id;
          player.isConnected = true;
          socket.join(roomId);

          // Notificar reconexión
          io.to(roomId).emit('room:player-reconnected', {
            playerId: userId,
            playerName: player.name,
          });

          // Enviar estado actual
          socket.emit('room:state', {
            roomId,
            players: Array.from(gameRoom.players.values()),
            gameState: gameRoom.gameState,
          });

          console.log(`🔄 ${player.name} se reconectó a la sala ${roomId}`);
        }
      } catch (error) {
        console.error('Error en room:reconnect:', error);
      }
    });
  });

  console.log('✅ Socket.IO handlers configurados');
}

export { gameRooms };
