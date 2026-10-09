import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryCard } from './MemoryCard';
import { ArrowLeft, Timer, Trophy, Zap, Star, Crown } from 'lucide-react';
import type { Room, Player } from '../App';

interface MultiplayerGameProps {
  room: Room;
  currentUser: Player;
  onGameEnd: () => void;
  onBackToLobby: () => void;
}

type CardType = {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
};

type TeamScore = {
  teamId: number;
  score: number;
  consecutiveMatches: number;
};

const roundConfig = [
  { round: 1, cards: 8, timePerTurn: 45, difficulty: 'Fácil' },
  { round: 2, cards: 12, timePerTurn: 40, difficulty: 'Normal' },
  { round: 3, cards: 16, timePerTurn: 35, difficulty: 'Medio' },
  { round: 4, cards: 20, timePerTurn: 30, difficulty: 'Difícil' },
  { round: 5, cards: 24, timePerTurn: 25, difficulty: 'Experto' },
];

const symbols = ['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍑', '🍍', '🥝', '🥭', '🥥', '🍋'];

const teamColors = [
  'from-red-600 to-orange-600',
  'from-blue-600 to-cyan-600',
  'from-green-600 to-emerald-600',
  'from-purple-600 to-pink-600',
  'from-yellow-600 to-amber-600',
];

export function MultiplayerGame({ room, currentUser, onGameEnd, onBackToLobby }: MultiplayerGameProps) {
  const [currentRound, setCurrentRound] = useState(1);
  const [currentTeam, setCurrentTeam] = useState(1);
  const [timeLeft, setTimeLeft] = useState(roundConfig[0].timePerTurn);
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [teamScores, setTeamScores] = useState<TeamScore[]>([1, 2, 3, 4, 5].map(id => ({ teamId: id, score: 0, consecutiveMatches: 0 })));
  const [roundMatches, setRoundMatches] = useState(0);

  const config = roundConfig[currentRound - 1];
  const teams = [1, 2, 3, 4, 5].filter(teamId => room.players.filter((p: any) => p.teamId === teamId).length === 2);
  const isMyTeamTurn = currentUser.teamId === currentTeam;

  useEffect(() => {
    const cardCount = config.cards;
    const symbolsNeeded = cardCount / 2;
    const selectedSymbols = [...symbols].slice(0, symbolsNeeded);
    const duplicatedSymbols = [...selectedSymbols, ...selectedSymbols];
    const shuffled = duplicatedSymbols.sort(() => Math.random() - 0.5).map((symbol, index) => ({ id: index, symbol, isFlipped: false, isMatched: false }));
    setCards(shuffled);
    setFlippedCards([]);
    setRoundMatches(0);
    setTimeLeft(config.timePerTurn);
  }, [currentRound]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleTimeOut();
      return;
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleTimeOut = () => {
    const currentTeamIndex = teams.indexOf(currentTeam);
    const nextTeamIndex = (currentTeamIndex + 1) % teams.length;
    setTeamScores(prev => prev.map(t => t.teamId === currentTeam ? { ...t, consecutiveMatches: 0 } : t));
    setCurrentTeam(teams[nextTeamIndex]);
    setTimeLeft(config.timePerTurn);
    setFlippedCards([]);
  };

  const handleCardClick = (id: number) => {
    if (!isMyTeamTurn) return;
    if (flippedCards.length === 2 || flippedCards.includes(id)) return;
    if (cards[id].isMatched) return;

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].symbol === cards[second].symbol) {
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setRoundMatches(prev => prev + 1);
          setTeamScores(prev => prev.map(t => t.teamId === currentTeam ? { ...t, score: t.score + 10 + ((t.consecutiveMatches) * 5), consecutiveMatches: t.consecutiveMatches + 1 } : t));
          if (roundMatches + 1 >= config.cards / 2) {
            setTimeout(() => {
              if (currentRound >= 5) onGameEnd(); else setCurrentRound(prev => prev + 1);
            }, 1500);
          }
          setRoundMatches(prev => prev + 1);
        }, 800);
      } else {
        setTimeout(() => {
          const unflippedCards = [...cards];
          unflippedCards[first].isFlipped = false;
          unflippedCards[second].isFlipped = false;
          setCards(unflippedCards);
          setFlippedCards([]);
          setTeamScores(prev => prev.map(t => t.teamId === currentTeam ? { ...t, consecutiveMatches: 0 } : t));
          const currentTeamIndex = teams.indexOf(currentTeam);
          const nextTeamIndex = (currentTeamIndex + 1) % teams.length;
          setCurrentTeam(teams[nextTeamIndex]);
          setTimeLeft(config.timePerTurn);
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <motion.div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20" animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBackToLobby} className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Salir</span>
          </button>

          <div className="text-center">
            <h2 className="text-3xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Ronda {currentRound} / 5</h2>
            <p className="text-gray-400 text-sm">{config.difficulty}</p>
          </div>

          <div className="w-24" />
        </div>

        <motion.div key={currentTeam} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`mb-6 p-6 bg-gradient-to-r ${teamColors[currentTeam - 1]} rounded-2xl text-center relative overflow-hidden`}>
          <motion.div className="absolute inset-0 bg-white" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ opacity: 0.1 }} />
          <div className="relative z-10">
            <h3 className="text-2xl mb-2">{isMyTeamTurn ? '¡TU TURNO!' : `Turno del Equipo ${currentTeam}`}</h3>
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2"><Timer className="w-5 h-5" /><span className="text-3xl font-mono">{timeLeft}s</span></div>
              <div className="flex items-center gap-2"><Zap className="w-5 h-5" /><span>Racha: x{teamScores.find(t => t.teamId === currentTeam)?.consecutiveMatches || 0}</span></div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-9">
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(6, Math.ceil(Math.sqrt(config.cards)))}, minmax(0, 1fr))` }}>
              <AnimatePresence>
                {cards.map((card, index) => (
                  <MemoryCard key={card.id} card={card} index={index} glowColor={isMyTeamTurn ? '#00ff88' : '#666'} gradient="from-purple-600/20 via-pink-600/20 to-cyan-600/20" onClick={() => handleCardClick(card.id)} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="col-span-3 space-y-3">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3"><Trophy className="w-5 h-5 text-yellow-400" /><h3 className="text-lg">Puntuación</h3></div>
              <div className="space-y-2">
                {teamScores.filter(t => teams.includes(t.teamId)).sort((a, b) => b.score - a.score).map((team, index) => (
                  <motion.div key={team.teamId} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.1 }} className={`p-3 rounded-lg ${team.teamId === currentTeam ? `bg-gradient-to-r ${teamColors[team.teamId - 1]}` : 'bg-gray-700/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">{index === 0 && <Crown className="w-4 h-4 text-yellow-400" />}<span>Equipo {team.teamId}</span></div>
                      <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /><span className="text-lg">{team.score}</span></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
              <h3 className="text-sm text-gray-400 mb-2">Progreso de Ronda</h3>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500" initial={{ width: 0 }} animate={{ width: `${(roundMatches / (config.cards / 2)) * 100}%` }} transition={{ duration: 0.5 }} /></div>
              <p className="text-xs text-gray-400 mt-2 text-center">{roundMatches} / {config.cards / 2} pares</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
