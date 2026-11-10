import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Timer, Trophy, Zap, Crown, Swords,
  Sparkles, RefreshCw, Layers, Shield, Bot
} from 'lucide-react';
import type { Room, Player } from '../App';
import socket, { connectSocket } from '../lib/socket';
import { apiFetch } from '../lib/api';
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

interface MultiplayerCardMeta {
  title: string;
  image: string;
  category: string;
  color: string;
  emoji: string;
}

const MULTIPLAYER_CARDS: Record<string, MultiplayerCardMeta> = {
  apple: { title: 'Abeja Centinela', image: '/cards/triads/eco-abeja.webp', category: 'Ecosistema', color: '#E8B54A', emoji: '🐝' },
  banana: { title: 'Semilla Lumínica', image: '/cards/triads/eco-semilla.webp', category: 'Ecosistema', color: '#2BE08F', emoji: '🌱' },
  cherry: { title: 'Código Genómico', image: '/cards/triads/cie-adn.webp', category: 'Ciencia', color: '#35E0C8', emoji: '🧬' },
  dragon: { title: 'Centella Espectral', image: '/cards/triads/ele-centella.webp', category: 'Elementos', color: '#B79CFF', emoji: '⚡' },
  elephant: { title: 'Matriz de IA', image: '/cards/triads/tec-ia.webp', category: 'Tecnología', color: '#35E0C8', emoji: '🧠' },
  fire: { title: 'Llama Sagrada', image: '/cards/triads/ele-llama.webp', category: 'Elementos', color: '#FF6B35', emoji: '🔥' },
  guitar: { title: 'Néctar Dorado', image: '/cards/triads/eco-miel.webp', category: 'Ecosistema', color: '#E8B54A', emoji: '🍯' },
  house: { title: 'Colonia Marciana', image: '/cards/triads/hum-colonia.webp', category: 'Humanidad', color: '#B79CFF', emoji: '🪐' },
  ice: { title: 'Glaciar Eterno', image: '/cards/triads/ele-glaciar.webp', category: 'Elementos', color: '#35E0C8', emoji: '❄️' },
  jungle: { title: 'Flor de Loto', image: '/cards/triads/eco-flor.webp', category: 'Ecosistema', color: '#FF6B8B', emoji: '🪷' },
  king: { title: 'Coloso de Tierra', image: '/cards/triads/ele-coloso-tierra.webp', category: 'Elementos', color: '#E8B54A', emoji: '🗿' },
  lion: { title: 'Androide Centinela', image: '/cards/triads/tec-androide.webp', category: 'Tecnología', color: '#35E0C8', emoji: '🤖' },
  mountain: { title: 'Monolito Rocoso', image: '/cards/triads/ele-roca.webp', category: 'Elementos', color: '#9AA3B2', emoji: '⛰️' },
  night: { title: 'Agujero Negro', image: '/cards/triads/cie-agujero-negro.webp', category: 'Ciencia', color: '#8A63D2', emoji: '🌌' },
  ocean: { title: 'Masa Oceánica', image: '/cards/triads/eco-oceano.webp', category: 'Ecosistema', color: '#35E0C8', emoji: '🌊' },
  planet: { title: 'Cohete Astral', image: '/cards/triads/hum-cohete.webp', category: 'Humanidad', color: '#35E0C8', emoji: '🚀' },
  queen: { title: 'Mariposa Astral', image: '/cards/triads/eco-mariposa.webp', category: 'Ecosistema', color: '#B79CFF', emoji: '🦋' },
  rainbow: { title: 'Vapor Celeste', image: '/cards/triads/eco-nube.webp', category: 'Ecosistema', color: '#35E0C8', emoji: '☁️' },
  star: { title: 'Sol Primigenio', image: '/cards/triads/eco-sol.webp', category: 'Ecosistema', color: '#FFB800', emoji: '☀️' },
  tree: { title: 'Árbol Ancestral', image: '/cards/triads/eco-arbol.webp', category: 'Ecosistema', color: '#2BE08F', emoji: '🌳' },
  universe: { title: 'Supernova', image: '/cards/triads/cie-supernova.webp', category: 'Ciencia', color: '#FF4D5E', emoji: '✨' },
  volcano: { title: 'Magma Viviente', image: '/cards/triads/ele-inferno.webp', category: 'Elementos', color: '#FF4D5E', emoji: '🌋' },
  waterfall: { title: 'Gota de Cristal', image: '/cards/triads/eco-gota.webp', category: 'Ecosistema', color: '#35E0C8', emoji: '💧' },
  xylophone: { title: 'Microchip Cuántico', image: '/cards/triads/tec-chip.webp', category: 'Tecnología', color: '#2BE08F', emoji: '💾' },
  yacht: { title: 'Locomotora de Vapor', image: '/cards/triads/hum-locomotora.webp', category: 'Humanidad', color: '#E8B54A', emoji: '🚂' },
  zebra: { title: 'Hoz Primitiva', image: '/cards/triads/hum-hoz.webp', category: 'Humanidad', color: '#9AA3B2', emoji: '🌾' },
  angel: { title: 'Génesis Vital', image: '/cards/triads/eco-huevo.webp', category: 'Ecosistema', color: '#2BE08F', emoji: '🥚' },
  book: { title: 'Biblioteca Humana', image: '/cards/triads/hum-biblioteca.webp', category: 'Humanidad', color: '#E8B54A', emoji: '📖' },
  castle: { title: 'Estación Orbital', image: '/cards/triads/hum-estacion.webp', category: 'Humanidad', color: '#35E0C8', emoji: '🛰️' },
  diamond: { title: 'Átomo Cuántico', image: '/cards/triads/cie-atomo.webp', category: 'Ciencia', color: '#35E0C8', emoji: '⚛️' },
};

export function MultiplayerGame({ room, currentUser, onGameEnd, onBackToLobby }: MultiplayerGameProps) {
  const initialCards = room.gameState?.cards || [];
  const initialTurn = room.gameState?.currentTurn || room.hostId || (room.players[0]?.id ?? currentUser.id);
  const initialBotMode = Boolean(
    (room as any).isBotMatch ||
    room.players?.some((p) => p.id === 'bot-rival-1v1')
  );

  const [isBotMatch, setIsBotMatch] = useState<boolean>(initialBotMode);
  const [cards, setCards] = useState<CardItem[]>(initialCards);
  const [currentTurn, setCurrentTurn] = useState<string>(initialTurn);
  const [flippedCards, setFlippedCards] = useState<number[]>(room.gameState?.flippedCards || []);
  const [matchedCards, setMatchedCards] = useState<number[]>(room.gameState?.matchedCards || []);
  const [scores, setScores] = useState<Record<string, number>>(
    room.gameState?.scores && !(room.gameState.scores instanceof Map) ? room.gameState.scores : {}
  );
  const [turnTime, setTurnTime] = useState<number>(30);
  const [notice, setNotice] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const roomTheme = useEquippedRoomTheme();

  const isEvaluatingRef = useRef(false);
  const botMemoryRef = useRef<Map<number, string>>(new Map());
  const cardsRef = useRef<CardItem[]>(cards);
  const matchedRef = useRef<number[]>(matchedCards);
  const scoresRef = useRef<Record<string, number>>(scores);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    matchedRef.current = matchedCards;
  }, [matchedCards]);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  const botFallbackPlayer: Player = {
    id: 'bot-rival-1v1',
    name: 'Nexus-IV (IA)',
    email: 'nexus@memorize.ai',
    teamId: 2,
    level: currentUser.level || 3,
  };

  const playersList = isBotMatch
    ? [currentUser, room.players?.find((p) => p.id !== currentUser.id) || botFallbackPlayer]
    : room.players || [currentUser];

  const player1 = playersList[0] || currentUser;
  const player2 = playersList.find((p) => p.id !== player1.id) || playersList[1] || (isBotMatch ? botFallbackPlayer : null);

  const requiredFlips = room.mode === 'triads' ? 3 : 2;
  const pointsPerMatch = room.mode === 'triads' ? 150 : 100;
  const isMyTurn = currentTurn === currentUser.id;

  const playSound = useCallback((src: string, vol = 0.3) => {
    try {
      const audio = new Audio(src);
      audio.volume = vol;
      audio.play().catch(() => {});
    } catch {
      /* Audio no disponible */
    }
  }, []);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 2000);
  }, []);

  const getPlayerName = useCallback(
    (id: string) => {
      if (id === 'bot-rival-1v1') return 'Nexus-IV (IA)';
      const p = playersList.find((x) => x.id === id);
      if (!p) return id === currentUser.id ? currentUser.name || 'Tú' : 'Rival';
      return p.name || p.email.split('@')[0];
    },
    [playersList, currentUser]
  );

  // Generador de mazo local para Duelo 1v1 contra IA (o revancha)
  const initLocalBotMatch = useCallback(() => {
    const allKeys = Object.keys(MULTIPLAYER_CARDS);
    const groupCount = room.mode === 'triads' ? 5 : 8;
    const copies = room.mode === 'triads' ? 3 : 2;
    const chosenKeys = allKeys.slice(0, groupCount);

    const deckValues: string[] = [];
    chosenKeys.forEach((k) => {
      for (let i = 0; i < copies; i++) deckValues.push(k);
    });

    for (let i = deckValues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deckValues[i], deckValues[j]] = [deckValues[j], deckValues[i]];
    }

    const generated: CardItem[] = deckValues.map((val, idx) => ({
      id: `local_${idx}_${val}`,
      value: val,
    }));

    botMemoryRef.current.clear();
    isEvaluatingRef.current = false;
    cardsRef.current = generated;
    matchedRef.current = [];
    const initialScores = { [currentUser.id]: 0, 'bot-rival-1v1': 0 };
    scoresRef.current = initialScores;

    setCards(generated);
    setFlippedCards([]);
    setMatchedCards([]);
    setScores(initialScores);
    setCurrentTurn(currentUser.id);
    setTurnTime(30);
    setIsFinished(false);
    setWinnerId(null);
    setIsBotMatch(true);
    playSound('https://actions.google.com/sounds/v1/scifi/sci_fi_pulse.ogg', 0.4);
    showNotice('¡Duelo 1v1 iniciado! Tu turno.');
  }, [room.mode, currentUser.id, playSound, showNotice]);

  useEffect(() => {
    if (isBotMatch && cards.length === 0) {
      initLocalBotMatch();
    }
  }, [isBotMatch, cards.length, initLocalBotMatch]);

  // Sincronizar si room.gameState llega después del montaje inicial
  useEffect(() => {
    if (!isBotMatch && room.gameState?.cards?.length && cards.length === 0) {
      setCards(room.gameState.cards);
    }
    if (!isBotMatch && room.gameState?.currentTurn && !currentTurn) {
      setCurrentTurn(room.gameState.currentTurn);
    }
  }, [isBotMatch, room.gameState, cards.length, currentTurn]);

  // Evaluación local de mano (modo Duelo 1v1 vs IA)
  const evaluateLocalTurn = useCallback(
    (chosenIndices: number[], activePlayerId: string) => {
      isEvaluatingRef.current = true;
      const deck = cardsRef.current;
      const firstVal = deck[chosenIndices[0]]?.value;
      const isMatch = Boolean(firstVal && chosenIndices.every((idx) => deck[idx]?.value === firstVal));

      // Guardar en la memoria del bot las cartas reveladas
      chosenIndices.forEach((idx) => {
        if (deck[idx]) {
          botMemoryRef.current.set(idx, deck[idx].value);
        }
      });

      setTimeout(() => {
        if (isMatch) {
          playSound('https://actions.google.com/sounds/v1/cartoon/pop.ogg', 0.5);
          const nextMatched = Array.from(new Set([...matchedRef.current, ...chosenIndices]));
          matchedRef.current = nextMatched;
          setMatchedCards(nextMatched);
          setFlippedCards([]);

          const nextScores = {
            ...scoresRef.current,
            [activePlayerId]: (scoresRef.current[activePlayerId] || 0) + pointsPerMatch,
          };
          scoresRef.current = nextScores;
          setScores(nextScores);
          setTurnTime(30);
          showNotice(`¡Punto para ${getPlayerName(activePlayerId)}! 🎉`);

          // Eliminar cartas acertadas de la memoria del bot
          chosenIndices.forEach((idx) => botMemoryRef.current.delete(idx));

          if (nextMatched.length >= deck.length && deck.length > 0) {
            isEvaluatingRef.current = false;
            playSound('https://actions.google.com/sounds/v1/crowds/applause.ogg', 0.5);
            const myPts = nextScores[currentUser.id] || 0;
            const botPts = nextScores['bot-rival-1v1'] || 0;
            setWinnerId(myPts > botPts ? currentUser.id : botPts > myPts ? 'bot-rival-1v1' : null);
            setIsFinished(true);
            return;
          }

          isEvaluatingRef.current = false;
          // Si el bot acertó, continúa su turno
          if (activePlayerId === 'bot-rival-1v1') {
            setCurrentTurn('bot-rival-1v1');
          }
        } else {
          playSound('https://actions.google.com/sounds/v1/cartoon/slide_whistle_down.ogg', 0.25);
          showNotice('No coinciden. Cambio de turno.');
          setFlippedCards([]);
          setTurnTime(30);
          const nextPlayer = activePlayerId === currentUser.id ? 'bot-rival-1v1' : currentUser.id;
          isEvaluatingRef.current = false;
          setCurrentTurn(nextPlayer);
        }
      }, 1050);
    },
    [currentUser.id, getPlayerName, playSound, pointsPerMatch, showNotice]
  );

  // Turno automático de Nexus-IV (IA) en modo 1v1
  useEffect(() => {
    if (!isBotMatch || isFinished || currentTurn !== 'bot-rival-1v1') return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const startTimer = setTimeout(() => {
      if (isFinished || isEvaluatingRef.current) return;
      const deck = cardsRef.current;
      const matched = matchedRef.current;
      const available = deck
        .map((_, idx) => idx)
        .filter((idx) => !matched.includes(idx));

      if (available.length < requiredFlips) return;

      let chosen: number[] = [];

      // 45% de probabilidad de usar memoria si ya vio un par/tríada completo
      if (Math.random() < 0.45) {
        const byValue = new Map<string, number[]>();
        botMemoryRef.current.forEach((val, idx) => {
          if (available.includes(idx)) {
            byValue.set(val, [...(byValue.get(val) || []), idx]);
          }
        });
        for (const [, indices] of byValue.entries()) {
          if (indices.length >= requiredFlips) {
            chosen = indices.slice(0, requiredFlips);
            break;
          }
        }
      }

      // Si no encontró en memoria, elegir al azar entre las disponibles
      if (chosen.length < requiredFlips) {
        const pool = [...available];
        while (chosen.length < requiredFlips && pool.length > 0) {
          const r = Math.floor(Math.random() * pool.length);
          chosen.push(pool.splice(r, 1)[0]);
        }
      }

      chosen.forEach((cardIdx, step) => {
        const flipTimer = setTimeout(() => {
          playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.25);
          setFlippedCards((prev) => Array.from(new Set([...prev, cardIdx])));

          if (step === chosen.length - 1) {
            evaluateLocalTurn(chosen, 'bot-rival-1v1');
          }
        }, 700 * (step + 1));
        timers.push(flipTimer);
      });
    }, 650);

    timers.push(startTimer);
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isBotMatch, isFinished, currentTurn, requiredFlips, flippedCards.length === 0 ? matchedCards.length : 0, evaluateLocalTurn, playSound]);

  // Temporizador local de 30s cuando se juega contra Rival IA
  useEffect(() => {
    if (!isBotMatch || isFinished) return;
    const interval = setInterval(() => {
      if (isEvaluatingRef.current) return;
      setTurnTime((t) => {
        if (t <= 1) {
          setFlippedCards([]);
          const next = currentTurn === currentUser.id ? 'bot-rival-1v1' : currentUser.id;
          setCurrentTurn(next);
          showNotice('¡Tiempo agotado! Cambio de turno.');
          return 30;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBotMatch, isFinished, currentTurn, currentUser.id, showNotice]);

  // Escucha de eventos de Socket.IO (Modo En Línea Real)
  useEffect(() => {
    if (isBotMatch) return;

    connectSocket();
    socket.emit('room:reconnect', { roomId: room.id });

    // Solo el host solicita iniciar si el mazo aún no fue generado
    const hostId = room.hostId || room.creatorId || room.players?.[0]?.id;
    if (currentUser.id === hostId && (!room.gameState?.cards || room.gameState.cards.length === 0)) {
      socket.emit('game:start', { roomId: room.id });
    }

    const handleRoomState = (payload: any) => {
      const gs = payload?.gameState;
      if (!gs) return;
      if (Array.isArray(gs.cards) && gs.cards.length > 0) {
        setCards(gs.cards);
      }
      if (gs.currentTurn) {
        setCurrentTurn(gs.currentTurn);
      }
      if (Array.isArray(gs.flippedCards)) {
        setFlippedCards(gs.flippedCards);
      }
      if (Array.isArray(gs.matchedCards)) {
        setMatchedCards(gs.matchedCards);
      }
      if (gs.scores && typeof gs.scores === 'object' && !(gs.scores instanceof Map)) {
        setScores(gs.scores);
      }
    };

    const handleGameStarted = (payload: any) => {
      playSound('https://actions.google.com/sounds/v1/scifi/sci_fi_pulse.ogg', 0.4);
      const nextCards = payload.cards || payload.gameState?.cards;
      if (Array.isArray(nextCards) && nextCards.length > 0) setCards(nextCards);
      const nextTurn = payload.firstTurn || payload.currentTurn || payload.gameState?.currentTurn;
      if (nextTurn) {
        setCurrentTurn(nextTurn);
      }
      if (payload.scores && !(payload.scores instanceof Map)) setScores(payload.scores);
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
      if (payload.scores && !(payload.scores instanceof Map) && Object.keys(payload.scores).length > 0) {
        setScores(payload.scores);
      } else if (payload.playerId) {
        setScores((prev) => ({
          ...prev,
          [payload.playerId]: (prev[payload.playerId] || 0) + (payload.points || pointsPerMatch),
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
      if (payload.scores && !(payload.scores instanceof Map) && Object.keys(payload.scores).length > 0) {
        setScores(payload.scores);
      }
    };

    const handlePlayerLeft = (payload: any) => {
      showNotice(`${payload.playerName || 'Un jugador'} ha abandonado la partida.`);
    };

    socket.on('room:state', handleRoomState);
    socket.on('room:joined', handleRoomState);
    socket.on('game:started', handleGameStarted);
    socket.on('game:card-flipped', handleCardFlipped);
    socket.on('game:match-found', handleMatchFound);
    socket.on('game:no-match', handleNoMatch);
    socket.on('game:turn-timeout', handleTurnTimeout);
    socket.on('game:turn-tick', handleTurnTick);
    socket.on('game:turn-ended', handleTurnEnded);
    socket.on('game:finished', handleGameFinished);
    socket.on('room:player-left', handlePlayerLeft);

    // Respaldo HTTP para sincronizar el tablero si el evento de socket no llegó a tiempo
    const syncPoll = setInterval(async () => {
      try {
        const data = await apiFetch<any>(`/api/rooms/${room.id}`);
        if (data?.gameState) {
          handleRoomState(data);
          if (data.status === 'finished' || data.gameState.status === 'finished') {
            setIsFinished(true);
          }
        }
      } catch {
        /* ignorar errores de red puntuales */
      }
    }, 2500);

    return () => {
      clearInterval(syncPoll);
      socket.off('room:state', handleRoomState);
      socket.off('room:joined', handleRoomState);
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
  }, [room.id, isBotMatch, currentUser.id, room.hostId, room.creatorId, room.players, room.gameState, getPlayerName, playSound, pointsPerMatch, showNotice]);

  const handleCardClick = (index: number) => {
    if (!isMyTurn || isEvaluatingRef.current) return;
    if (flippedCards.length >= requiredFlips || flippedCards.includes(index) || matchedCards.includes(index)) return;

    if (isBotMatch) {
      playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.25);
      const nextFlipped = [...flippedCards, index];
      setFlippedCards(nextFlipped);

      if (nextFlipped.length >= requiredFlips) {
        evaluateLocalTurn(nextFlipped, currentUser.id);
      }
      return;
    }

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
            className={`p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-300 flex items-center justify-between gap-1.5 sm:gap-3 min-w-0 ${
              currentTurn === player1?.id
                ? 'border-[#35E0C8] bg-[#131A26]/90 shadow-[0_0_20px_rgba(53,224,200,0.25)] ring-1 ring-[#35E0C8]/40'
                : 'border-[#1E2836] bg-[#0D1119]/70'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#35E0C8] to-[#2BE08F] text-[#07090F] flex items-center justify-center font-bold font-mono text-xs sm:text-base shrink-0 shadow-md">
                {player1 ? (player1.name || player1.email)[0].toUpperCase() : '1'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-xs sm:text-sm font-bold text-white flex items-center gap-1 min-w-0">
                  <span className="truncate">{player1 ? player1.name || player1.email.split('@')[0] : 'Jugador 1'}</span>
                  {player1?.id === currentUser.id && (
                    <span className="text-[8px] sm:text-[9px] font-mono bg-[#35E0C8]/20 text-[#35E0C8] px-1 py-0.2 rounded shrink-0">TÚ</span>
                  )}
                </div>
                <div className="font-mono text-[9px] sm:text-[11px] text-[#9AA3B2] truncate">
                  {currentTurn === player1?.id ? 'En turno' : 'Esperando'}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 pl-1">
              <div className="font-mono text-base sm:text-xl font-bold text-[#35E0C8] leading-none">{p1Score}</div>
              <div className="font-mono text-[8px] sm:text-[9px] text-[#9AA3B2] uppercase mt-0.5">PTS</div>
            </div>
          </div>

          {/* Jugador 2 */}
          <div
            className={`p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-300 flex items-center justify-between gap-1.5 sm:gap-3 min-w-0 ${
              player2 && currentTurn === player2.id
                ? 'border-[#E8B54A] bg-[#131A26]/90 shadow-[0_0_20px_rgba(232,181,74,0.25)] ring-1 ring-[#E8B54A]/40'
                : 'border-[#1E2836] bg-[#0D1119]/70'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#E8B54A] to-[#D49A24] text-[#07090F] flex items-center justify-center font-bold font-mono text-xs sm:text-base shrink-0 shadow-md">
                {player2 ? (player2.name || player2.email)[0].toUpperCase() : '2'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-xs sm:text-sm font-bold text-white flex items-center gap-1 min-w-0">
                  <span className="truncate">{player2 ? player2.name || player2.email.split('@')[0] : 'Rival'}</span>
                  {player2?.id === currentUser.id && (
                    <span className="text-[8px] sm:text-[9px] font-mono bg-[#35E0C8]/20 text-[#35E0C8] px-1 py-0.2 rounded shrink-0">TÚ</span>
                  )}
                </div>
                <div className="font-mono text-[9px] sm:text-[11px] text-[#9AA3B2] truncate">
                  {player2 && currentTurn === player2.id ? 'En turno' : 'Esperando'}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 pl-1">
              <div className="font-mono text-base sm:text-xl font-bold text-[#E8B54A] leading-none">{p2Score}</div>
              <div className="font-mono text-[8px] sm:text-[9px] text-[#9AA3B2] uppercase mt-0.5">PTS</div>
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
          <div className="text-center py-12 text-[#9AA3B2] font-mono flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#35E0C8]" />
            <p>Sincronizando tablero del servidor...</p>
            <button
              onClick={initLocalBotMatch}
              className="px-5 py-2.5 rounded-xl border border-[#B79CFF] bg-[#B79CFF]/20 hover:bg-[#B79CFF]/30 text-white font-mono text-xs uppercase font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <Bot className="w-4 h-4 text-[#B79CFF]" />
              <span>Iniciar Duelo con Rival IA Ahora</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3.5 max-w-4xl w-full p-1 sm:p-2">
            {cards.map((card, idx) => {
              const isFlipped = flippedCards.includes(idx);
              const isMatched = matchedCards.includes(idx);
              const isRevealed = isFlipped || isMatched;
              const meta = MULTIPLAYER_CARDS[card.value] || {
                title: card.value,
                image: '/cards/triads/eco-sol.webp',
                category: 'Especial',
                color: '#35E0C8',
                emoji: '💎',
              };

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
                      /* Cara frontal (Revelada) con Arte Ilustrado Real */
                      <div className="w-full h-full relative rounded-2xl overflow-hidden bg-slate-950">
                        <img
                          src={meta.image}
                          alt={meta.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />

                        {/* Icono de Match si ya se acertó */}
                        {isMatched && (
                          <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10 p-1 rounded-full bg-[#2BE08F] text-black shadow-lg">
                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Cara posterior (Boca abajo) */
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-[#2C3A4E] relative bg-gradient-to-br from-[#0D1119] via-[#121926] to-[#0A0D14]">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center shadow-inner">
                          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#35E0C8]/60" />
                        </div>
                        <span className="font-mono text-[7px] sm:text-[8px] text-[#5C6675] mt-1 tracking-widest uppercase">
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

              <div className="flex flex-col sm:flex-row gap-3">
                {isBotMatch && (
                  <button
                    onClick={initLocalBotMatch}
                    className="flex-1 py-3.5 rounded-xl border border-[#B79CFF] bg-[#B79CFF]/20 hover:bg-[#B79CFF]/30 text-white font-mono text-xs uppercase font-bold tracking-widest transition-all cursor-pointer"
                  >
                    ¡Jugar Revancha!
                  </button>
                )}
                <button
                  onClick={onBackToLobby}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#35E0C8] to-[#2BE08F] text-[#07090F] font-mono text-xs uppercase font-bold tracking-widest hover:brightness-110 shadow-lg cursor-pointer"
                >
                  Volver a la Sala
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
