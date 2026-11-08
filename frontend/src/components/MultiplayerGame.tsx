import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Timer, Trophy, Zap, Crown, Swords,
  Sparkles, RefreshCw, Layers, Shield
} from 'lucide-react';
import type { Room, Player } from '../App';
import socket from '../lib/socket';
import { useEquippedRoomTheme, type RoomThemeDef } from '../lib/roomTheme';

interface MultiplayerGameProps {
  room: Room;
  currentUser: Player;
  onGameEnd: () => void;
  onBackToLobby: () => void;
}

interface CardItem {
  id: string;
  value: string;
  category?: string;
  isFlipped?: boolean;
  isMatched?: boolean;
}

const EMOJI_MAP: Record<string, string> = {
  apple: '🍎',
  banana: '🍌',
  cherry: '🍒',
  dragon: '🐉',
  elephant: '🐘',
  fire: '🔥',
  guitar: '🎸',
  house: '🏠',
  ice: '❄️',
  jungle: '🌴',
  king: '👑',
  lion: '🦁',
  mountain: '⛰️',
  night: '🌙',
  ocean: '🌊',
  planet: '🪐',
  queen: '👸',
  rainbow: '🌈',
  star: '⭐',
  tree: '🌳',
  universe: '🌌',
  volcano: '🌋',
  waterfall: '💧',
  xylophone: '🎵',
  yacht: '⛵',
  zebra: '🦓',
  angel: '👼',
  book: '📖',
  castle: '🏰',
  diamond: '💎',
};

export function MultiplayerGame({ room, currentUser, onGameEnd, onBackToLobby }: MultiplayerGameProps) {
  // Inicializar cartas desde el estado de la sala si ya vino en room.gameState
  const initialCards = room.gameState?.cards || [];
  const initialTurn = room.gameState?.currentTurn || room.hostId || (room.players[0]?.id ?? '');

  const [cards, setCards] = useState<CardItem[]>(initialCards);
  const [currentTurn, setCurrentTurn] = useState<string>(initialTurn);
  const [flippedCards, setFlippedCards] = useState<number[]>(room.gameState?.flippedCards || []);
  const [matchedCards, setMatchedCards] = useState<number[]>(room.gameState?.matchedCards || []);
  const [scores, setScores] = useState<Record<string, number>>(room.gameState?.scores || {});
  const [turnTime, setTurnTime] = useState<number>(30);
  const [notice, setNotice] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const roomTheme = useEquippedRoomTheme();

  const playersList = room.players || [];
  const player1 = playersList[0] || currentUser;
  const player2 = playersList.find((p) => p.id !== player1.id) || playersList[1] || null;

  const isMyTurn = currentTurn === currentUser.id;

  const playSound = (src: string, vol = 0.3) => {
    try {
      const audio = new Audio(src);
      audio.volume = vol;
      audio.play().catch(() => {});
    } catch {
      /* Audio no disponible */
    }
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 2000);
  };

  const getPlayerName = (id: string) => {
    const p = playersList.find((x) => x.id === id);
    if (!p) return 'Jugador';
    return p.name || p.email.split('@')[0];
  };

  // Escucha de eventos de Socket.IO
  useEffect(() => {
    // Si la partida ya arrancó en el servidor, pedir estado
    socket.emit('game:start', { roomId: room.id });

    const handleGameStarted = (payload: any) => {
      playSound('https://actions.google.com/sounds/v1/scifi/sci_fi_pulse.ogg', 0.4);
      if (payload.cards) setCards(payload.cards);
      if (payload.firstTurn || payload.currentTurn) {
        setCurrentTurn(payload.firstTurn || payload.currentTurn);
      }
      if (payload.scores) setScores(payload.scores);
      setFlippedCards([]);
      setMatchedCards([]);
      setIsFinished(false);
      setWinnerId(null);
      showNotice('¡La partida ha comenzado!');
    };

    const handleCardFlipped = (payload: any) => {
      playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.25);
      if (payload.flippedCards) {
        setFlippedCards(payload.flippedCards);
      } else if (typeof payload.cardIndex === 'number') {
        setFlippedCards((prev) => Array.from(new Set([...prev, payload.cardIndex])));
      }
    };

    const handleMatchFound = (payload: any) => {
      playSound('https://actions.google.com/sounds/v1/cartoon/pop.ogg', 0.5);
      if (payload.cardIndexes) {
        setMatchedCards((prev) => Array.from(new Set([...prev, ...payload.cardIndexes])));
      }
      setFlippedCards([]);
      if (payload.scores) {
        setScores(payload.scores);
      } else if (payload.playerId) {
        setScores((prev) => ({
          ...prev,
          [payload.playerId]: (prev[payload.playerId] || 0) + (payload.points || 100),
        }));
      }
      showNotice(`¡Punto para ${getPlayerName(payload.playerId)}! 🎉`);
    };

    const handleNoMatch = (payload: any) => {
      showNotice('No coinciden. Cambio de turno.');
      setTimeout(() => {
        setFlippedCards([]);
        if (payload.currentTurn) {
          setCurrentTurn(payload.currentTurn);
        }
      }, 1200);
    };

    const handleTurnTimeout = (payload: any) => {
      showNotice('¡Tiempo agotado! Cambio de turno.');
      setFlippedCards([]);
      if (payload.currentTurn) {
        setCurrentTurn(payload.currentTurn);
      }
    };

    const handleTurnTick = (payload: any) => {
      if (typeof payload.remaining === 'number') {
        setTurnTime(payload.remaining);
      }
    };

    const handleTurnEnded = (payload: any) => {
      setFlippedCards([]);
      if (payload.currentTurn) {
        setCurrentTurn(payload.currentTurn);
      }
    };

    const handleGameFinished = (payload: any) => {
      playSound('https://actions.google.com/sounds/v1/crowds/applause.ogg', 0.5);
      setIsFinished(true);
      setWinnerId(payload.winnerId);
      if (payload.scores) setScores(payload.scores);
    };

    const handlePlayerLeft = (payload: any) => {
      showNotice(`${payload.playerName || 'Un jugador'} ha abandonado la partida.`);
    };

    socket.on('game:started', handleGameStarted);
    socket.on('game:card-flipped', handleCardFlipped);
    socket.on('game:match-found', handleMatchFound);
    socket.on('game:no-match', handleNoMatch);
    socket.on('game:turn-timeout', handleTurnTimeout);
    socket.on('game:turn-tick', handleTurnTick);
    socket.on('game:turn-ended', handleTurnEnded);
    socket.on('game:finished', handleGameFinished);
    socket.on('room:player-left', handlePlayerLeft);

    return () => {
      socket.off('game:started', handleGameStarted);
      socket.off('game:card-flipped', handleCardFlipped);
      socket.off('game:match-found', handleMatchFound);
      socket.off('game:no-match', handleNoMatch);
      socket.off('game:turn-timeout', handleTurnTimeout);
      socket.off('game:turn-tick', handleTurnTick);
      socket.off('game:turn-ended', handleTurnEnded);
      socket.off('game:finished', handleGameFinished);
      socket.off('room:player-left', handlePlayerLeft);
    };
  }, [room.id]);

  const handleCardClick = (index: number) => {
    if (!isMyTurn) return;
    if (flippedCards.length >= 2 || flippedCards.includes(index) || matchedCards.includes(index)) return;

    socket.emit('game:flip-card', {
      roomId: room.id,
      cardIndex: index,
    });
  };

  const p1Score = scores[player1?.id] || 0;
  const p2Score = player2 ? scores[player2.id] || 0 : 0;

  return (
    <div
      className="min-h-screen text-[#E8E6DF] flex flex-col relative overflow-hidden select-none transition-all duration-700"
      style={{
        backgroundImage: `url('${roomTheme.image}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-[#07090F]/85 backdrop-blur-[2px]" />
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-[130px] opacity-20 pointer-events-none transition-all duration-700"
        style={{ background: roomTheme.accent }}
      />
      <div className="absolute inset-0 pointer-events-none an-grain-overlay" />
      <div className="absolute inset-0 pointer-events-none an-vignette" />

      {/* HEADER SUPERIOR */}
      <header className="relative z-20 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between border-b border-[#1E2836]/70 backdrop-blur-md bg-[#07090F]/80">
        <button
          onClick={onBackToLobby}
          className="an-focusable flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#1E2836] bg-[#0D1119]/80 text-[#9AA3B2] hover:text-[#E8E6DF] hover:border-[#FF4D5E]/50 transition-all font-mono text-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Abandonar</span>
        </button>

        {/* Indicador de Turno Central */}
        <div className="text-center px-2">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <span
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isMyTurn ? 'bg-[#35E0C8] animate-ping' : 'bg-[#E8B54A]'}`}
            />
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest font-bold truncate max-w-[200px] sm:max-w-none" style={{ color: isMyTurn ? '#35E0C8' : '#E8B54A' }}>
              {isMyTurn ? '🎯 ¡TU TURNO!' : `⏳ TURNO DE ${getPlayerName(currentTurn).toUpperCase()}`}
            </span>
          </div>
          <div className="font-mono text-[9px] sm:text-[10px] text-[#9AA3B2] mt-0.5 hidden xs:block">
            {isMyTurn ? 'Elige 2 cartas para encontrar su par' : 'Observa y memoriza los movimientos del rival'}
          </div>
        </div>

        {/* Temporizador */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#1E2836] bg-[#0D1119] font-mono text-xs">
          <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#35E0C8]" />
          <span className="font-bold text-white">{turnTime}s</span>
        </div>
      </header>

      {/* MARCADOR 1V1 (HUD SUPERIOR) */}
      <div className="relative z-10 px-3 sm:px-6 py-2.5 sm:py-4 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 items-center">
          {/* Jugador 1 */}
          <div
            className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
              currentTurn === player1?.id
                ? 'border-[#35E0C8] bg-[#131A26]/90 shadow-[0_0_20px_rgba(53,224,200,0.25)]'
                : 'border-[#1E2836] bg-[#0D1119]/70'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#35E0C8] to-[#2BE08F] text-[#07090F] flex items-center justify-center font-bold font-mono">
                {player1 ? (player1.name || player1.email)[0].toUpperCase() : '1'}
              </div>
              <div>
                <div className="font-serif text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{player1 ? player1.name || player1.email.split('@')[0] : 'Jugador 1'}</span>
                  {player1?.id === currentUser.id && (
                    <span className="text-[9px] font-mono bg-[#35E0C8]/20 text-[#35E0C8] px-1.5 py-0.2 rounded">TÚ</span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-[#9AA3B2]">
                  {currentTurn === player1?.id ? 'En turno' : 'Esperando'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-bold text-[#35E0C8]">{p1Score}</div>
              <div className="font-mono text-[9px] text-[#9AA3B2] uppercase">PTS</div>
            </div>
          </div>

          {/* Jugador 2 */}
          <div
            className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
              player2 && currentTurn === player2.id
                ? 'border-[#E8B54A] bg-[#131A26]/90 shadow-[0_0_20px_rgba(232,181,74,0.25)]'
                : 'border-[#1E2836] bg-[#0D1119]/70'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8B54A] to-[#D49A24] text-[#07090F] flex items-center justify-center font-bold font-mono">
                {player2 ? (player2.name || player2.email)[0].toUpperCase() : '2'}
              </div>
              <div>
                <div className="font-serif text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{player2 ? player2.name || player2.email.split('@')[0] : 'Rival'}</span>
                  {player2?.id === currentUser.id && (
                    <span className="text-[9px] font-mono bg-[#35E0C8]/20 text-[#35E0C8] px-1.5 py-0.2 rounded">TÚ</span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-[#9AA3B2]">
                  {player2 && currentTurn === player2.id ? 'En turno' : 'Esperando'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-bold text-[#E8B54A]">{p2Score}</div>
              <div className="font-mono text-[9px] text-[#9AA3B2] uppercase">PTS</div>
            </div>
          </div>
        </div>

        {/* Notificación Flotante */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 py-1.5 px-4 rounded-full bg-[#131A26]/90 border border-[#35E0C8]/50 text-[#35E0C8] font-mono text-xs text-center max-w-sm mx-auto shadow-md"
            >
              {notice}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TABLERO DE JUEGO */}
      <main className="relative z-10 flex-1 px-4 py-2 max-w-5xl mx-auto w-full flex items-center justify-center overflow-y-auto an-scroll">
        {cards.length === 0 ? (
          <div className="text-center py-12 text-[#9AA3B2] font-mono">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#35E0C8]" />
            <p>Sincronizando tablero del servidor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3.5 max-w-4xl w-full p-1 sm:p-2">
            {cards.map((card, idx) => {
              const isFlipped = flippedCards.includes(idx);
              const isMatched = matchedCards.includes(idx);
              const isRevealed = isFlipped || isMatched;
              const emoji = EMOJI_MAP[card.value] || card.value || '💎';

              return (
                <motion.div
                  key={`${card.id}_${idx}`}
                  whileHover={!isRevealed && isMyTurn ? { scale: 1.05, y: -3 } : {}}
                  whileTap={!isRevealed && isMyTurn ? { scale: 0.95 } : {}}
                  onClick={() => handleCardClick(idx)}
                  className={`aspect-[3/4] rounded-2xl relative cursor-pointer select-none transition-all duration-300 ${
                    !isMyTurn && !isRevealed ? 'cursor-not-allowed opacity-85' : ''
                  }`}
                  style={{ perspective: 1000 }}
                >
                  <div
                    className={`w-full h-full rounded-2xl transition-transform duration-500 relative shadow-lg ${
                      isRevealed
                        ? isMatched
                          ? 'border-2 border-[#2BE08F] bg-[#13221B] shadow-[0_0_15px_rgba(43,224,143,0.3)]'
                          : 'border-2 border-[#35E0C8] bg-[#131A26] shadow-[0_0_15px_rgba(53,224,200,0.3)]'
                        : 'border border-[#1E2836] bg-gradient-to-br from-[#0D1119] to-[#151D2A] hover:border-[#35E0C8]/50'
                    }`}
                  >
                    {isRevealed ? (
                      /* Cara frontal (Revelada) */
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 relative overflow-hidden">
                        <span className="text-3xl sm:text-4xl filter drop-shadow-md animate-in zoom-in-50 duration-300">
                          {emoji}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2] mt-1.5 truncate max-w-full">
                          {card.value}
                        </span>
                        {isMatched && (
                          <div className="absolute top-1.5 right-1.5 text-[#2BE08F]">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Cara posterior (Boca abajo) */
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-[#2C3A4E] relative">
                        <div className="w-8 h-8 rounded-lg border border-[#1E2836] flex items-center justify-center">
                          <Layers className="w-4 h-4 text-[#35E0C8]/40" />
                        </div>
                        <span className="font-mono text-[8px] text-[#5C6675] mt-1 tracking-widest">
                          MEMORIZE
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL DE RESULTADOS FINALES */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0D1119] border-2 border-[#35E0C8] rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E8B54A] to-[#D49A24] text-[#07090F] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(232,181,74,0.4)]">
                <Trophy className="w-10 h-10" />
              </div>

              <h2 className="font-serif text-3xl font-bold text-white mb-1">
                {winnerId === currentUser.id
                  ? '¡VICTORIA ÉPICA!'
                  : winnerId
                  ? '¡FIN DE LA PARTIDA!'
                  : '¡EMPATE TÉCNICO!'}
              </h2>
              <p className="font-mono text-xs text-[#9AA3B2] mb-6">
                {winnerId === currentUser.id
                  ? 'Has superado a tu rival con memoria impecable.'
                  : winnerId
                  ? `El ganador es ${getPlayerName(winnerId)}.`
                  : 'Ambos operadores han obtenido la misma puntuación.'}
              </p>

              {/* Resumen de puntos */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#07090F] border border-[#1E2836] mb-6">
                <div>
                  <div className="font-mono text-xs text-[#9AA3B2] truncate">{getPlayerName(player1?.id)}</div>
                  <div className="font-mono text-2xl font-bold text-[#35E0C8] mt-0.5">{p1Score} pts</div>
                </div>
                <div>
                  <div className="font-mono text-xs text-[#9AA3B2] truncate">{player2 ? getPlayerName(player2.id) : 'Rival'}</div>
                  <div className="font-mono text-2xl font-bold text-[#E8B54A] mt-0.5">{p2Score} pts</div>
                </div>
              </div>

              <button
                onClick={onBackToLobby}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#35E0C8] to-[#2BE08F] text-[#07090F] font-mono text-xs uppercase font-bold tracking-widest hover:brightness-110 shadow-lg cursor-pointer"
              >
                Volver a la Sala
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
