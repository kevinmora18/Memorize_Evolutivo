import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { RoomWaiting } from './components/RoomWaiting';
import { MultiplayerGame } from './components/MultiplayerGame';
import { FinalResults } from './components/FinalResults';
import { MainMenu } from './components/MainMenu';
import { GameBoard } from './components/GameBoard';
import { BossFight } from './components/BossFight';
import { BossSelect } from './components/BossSelect';
import { RewardScreen } from './components/RewardScreen';
import { GameScreen } from './components/GameScreen';
import { ClassicLevelSelect } from './components/ClassicLevelSelect';
import { LoadingScreen } from './components/LoadingScreen';
import { InfiniteMode } from './components/InfiniteMode';
import { ChallengeMode } from './components/ChallengeMode';
import { AIFriendsGame } from './components/AIFriendsGame';
import { AIRoomLobby } from './components/AIRoomLobby';
import { AIRoomWaiting } from './components/AIRoomWaiting';
import { ProfileScreen } from './components/ProfileScreen';
import { RankedScreen } from './components/RankedScreen';
import { TiendaScreen } from './components/TiendaScreen';
import { AdminPanel } from './components/AdminPanel';
import { ParejasConexiones } from './components/ParejasConexiones';
import { TriadasConexiones } from './components/TriadasConexiones';
import { loadPlayerStats, savePlayerStats, addXP } from './lib/playerEvolution';
import socket from './lib/socket';

export type Universe = 'volcania' | 'frostheim' | 'neural' | 'verdalis' | 'lunaris';
export type BossType = 'naturaleza' | 'ciencia' | 'humano' | 'ecosistema' | 'tecnologia';

export type GameScreen = 'login' | 'register' | 'lobby' | 'roomWaiting' | 'multiplayerGame' | 'finalResults' | 'menu' | 'game' | 'boss' | 'boss-select' | 'reward' | 'classic' | 'classicLevelSelect' | 'loading' | 'infinite' | 'challenge' | 'ai-friends' | 'ai-room-lobby' | 'ai-room-waiting' | 'profile' | 'ranked' | 'tienda' | 'admin';

export type Player = {
  id: string;
  email: string;
  teamId: number;
  role?: string;
  level?: number;
  xp?: number;
  coins?: number;
  gems?: number;
};

export type Room = {
  id: string;
  name: string;
  code: string;
  players: Player[];
  maxPlayers: number;
  isStarted: boolean;
  currentRound: number;
  currentTeam: number;
  creatorId: string;
};

export default function App() {
  const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:5175';
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('login');
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [classicLevel, setClassicLevel] = useState(1);
  const [postLoadingScreen, setPostLoadingScreen] = useState<GameScreen | null>(null);
  const [selectedBossType, setSelectedBossType] = useState<BossType>('naturaleza');
  
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    socket.on('rooms:update', (data: Room[]) => setRooms(data));
    socket.on('player:joined', (payload: any) => {
      console.log('player joined', payload);
    });
    socket.on('room:started', (payload: any) => {
      console.log('room started', payload);
      setCurrentScreen('multiplayerGame');
    });

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/rooms`);
        if (res.ok) setRooms(await res.json());
      } catch (err) {
        console.error('Error fetching rooms', err);
      }
    })();

    return () => {
      socket.off('rooms:update');
      socket.off('player:joined');
      socket.off('room:started');
    };
  }, []);

  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);

  useEffect(() => {
    if (currentRoom) {
      const updatedRoomData = rooms.find(r => r.id === currentRoom.id);
      setCurrentRoom(updatedRoomData || null);
    }
  }, [rooms]);

  const handleLoginSuccess = (email: string) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          const userData = await res.json();
          const player: Player = { 
            id: userData.id, 
            email: userData.email, 
            teamId: 0,
            role: userData.role,  // ✅ Agregar el role del backend
            level: userData.level,
            xp: userData.xp,
            coins: userData.coins,
            gems: userData.gems
          };
          setCurrentUser(player);
          setPostLoadingScreen('lobby');
          setCurrentScreen('loading');
        } else {
          const player: Player = { id: Date.now().toString(), email, teamId: 0, role: 'player' };
          setCurrentUser(player);
          setPostLoadingScreen('lobby');
          setCurrentScreen('loading');
        }
      } catch (err) {
        console.error('Error en login:', err);
        const player: Player = { id: Date.now().toString(), email, teamId: 0, role: 'player' };
        setCurrentUser(player);
        setPostLoadingScreen('lobby');
        setCurrentScreen('loading');
      }
    })();
  };

  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (rooms.some(r => r.code === code)) {
      return generateRoomCode();
    }
    return code;
  };

  const handleChangeTeam = (teamId: number) => {
    if (!currentUser || !currentRoom) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player: { ...currentUser, teamId }, teamId }),
        });
        if (res.ok) {
          const updatedRoom = await res.json() as Room;
          setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
          setCurrentUser(prev => prev ? { ...prev, teamId } : null);
          setCurrentRoom(updatedRoom);
          return;
        }
      } catch (err) {
        console.error('Error changing team', err);
      }

      setCurrentUser(prevUser => prevUser ? { ...prevUser, teamId } : null);
      setRooms(prevRooms => 
        prevRooms.map(r => {
          if (r.id === currentRoom.id) {
            const updatedPlayers = r.players.map(p => p.id === currentUser.id ? { ...p, teamId } : p);
            return { ...r, players: updatedPlayers };
          }
          return r;
        }));
      setCurrentRoom(prev => prev ? { ...prev, players: prev.players.map(p => p.id === currentUser.id ? { ...p, teamId } : p) } : prev);
    })();
  };

  const handleStartGame = () => {
    if (!currentRoom) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/rooms/${currentRoom.id}/start`, {
          method: 'PUT',
        });
        if (res.ok) {
          const updated = await res.json() as Room;
          setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
          setCurrentScreen('multiplayerGame');
          return;
        }
      } catch (err) {
        console.error('Error starting game', err);
      }

      const updatedRoom = { ...currentRoom, isStarted: true };
      setRooms(prevRooms => prevRooms.map(r => r.id === currentRoom.id ? updatedRoom : r));
      setCurrentScreen('multiplayerGame');
    })();
  };

  const handleBackToLobby = () => {
    if (currentUser && currentRoom) {
      const updatedRoom = {
        ...currentRoom,
        players: currentRoom.players.filter(p => p.id !== currentUser.id),
      };
      setRooms(prevRooms => prevRooms.map(r => r.id === currentRoom.id ? updatedRoom : r));
    }
    setCurrentRoom(null);
    setCurrentScreen('lobby');
  };

  const handleGameEnd = () => {
    setCurrentScreen('finalResults');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRoom(null);
    setCurrentScreen('login');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    setSelectedUniverse(null);
  };

  const handleUniverseSelect = (universe: Universe) => {
    setSelectedUniverse(universe);
    setCurrentScreen('game');
    setCurrentLevel(1);
  };

  const handleLevelComplete = () => {
    if (currentLevel >= 3) {
      setCurrentScreen('boss');
    } else {
      setCurrentLevel(currentLevel + 1);
    }
  };

  const handleReplay = () => {
    setCurrentLevel(1);
    setCurrentScreen('game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden">
      {currentScreen === 'login' && (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess} 
          onRegisterRedirect={() => setCurrentScreen('register')} 
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen 
          onLoginRedirect={() => setCurrentScreen('login')} 
          onRegisterSuccess={handleLoginSuccess}
        />
      )}

      {currentScreen === 'lobby' && currentUser && (
        <LobbyScreen 
          onStartMode={(mode) => {
            if (mode === 'classic') {
              setPostLoadingScreen('classicLevelSelect');
            } else if (mode === 'infinite') {
              setPostLoadingScreen('infinite');
            } else if (mode === 'challenge') {
              setPostLoadingScreen('challenge');
            } else if (mode === 'boss') {
              setPostLoadingScreen('boss-select');
            } else if (mode === 'ai-friends') {
              setPostLoadingScreen('ai-room-lobby');
            } else if (mode === 'profile') {
              setCurrentScreen('profile');
              return;
            } else if (mode === 'ranked') {
              setCurrentScreen('ranked');
              return;
            } else if (mode === 'tienda') {
              setCurrentScreen('tienda');
              return;
            } else if (mode === 'admin') {
              setCurrentScreen('admin');
              return;
            } else {
              setPostLoadingScreen('menu');
            }
            setCurrentScreen('loading');
          }}
          onLogout={handleLogout}
          userRole={currentUser.role}
          userId={currentUser.id}
        />
      )}

      {currentScreen === 'roomWaiting' && currentRoom && currentUser && (
        <RoomWaiting
          room={currentRoom}
          currentUser={currentUser}
          onStartGame={handleStartGame}
          onChangeTeam={handleChangeTeam}
          onBackToLobby={handleBackToLobby}
        />
      )}

      {currentScreen === 'multiplayerGame' && currentRoom && currentUser && (
        <MultiplayerGame
          room={currentRoom}
          currentUser={currentUser}
          onGameEnd={handleGameEnd}
          onBackToLobby={handleBackToLobby}
        />
      )}

      {currentScreen === 'finalResults' && currentRoom && (
        <FinalResults
          room={currentRoom}
          onBackToLobby={handleBackToLobby}
        />
      )}
      
      {currentScreen === 'menu' && (
        <MainMenu 
          onUniverseSelect={handleUniverseSelect}
          unlockedPowers={[]}
          onBackToLobby={handleBackToLobby}
        />
      )}
      
      {currentScreen === 'game' && selectedUniverse && (
        <GameBoard
          universe={selectedUniverse}
          level={currentLevel}
          onLevelComplete={handleLevelComplete}
          onBackToMenu={handleBackToMenu}
        />
      )}
      
      {currentScreen === 'boss-select' && (
        <BossSelect
          onSelectBoss={(bossType: BossType) => {
            setSelectedBossType(bossType);
            setSelectedUniverse('neural'); // Universo por defecto
            setCurrentScreen('boss');
          }}
          onBack={() => setCurrentScreen('lobby')}
        />
      )}
      
      {currentScreen === 'boss' && selectedUniverse && (
        selectedBossType === 'ecosistema' || selectedBossType === 'tecnologia' ? (
          <TriadasConexiones
            universe={selectedUniverse}
            modo={selectedBossType}
            onComplete={() => {
              const stats = loadPlayerStats();
              const newStats = addXP(stats, 350);
              savePlayerStats(newStats);
              setCurrentScreen('reward');
            }}
            onBackToMenu={handleBackToMenu}
          />
        ) : (
          <ParejasConexiones
            universe={selectedUniverse}
            modo={selectedBossType}
            onComplete={() => {
              const stats = loadPlayerStats();
              const newStats = addXP(stats, 250);
              savePlayerStats(newStats);
              setCurrentScreen('reward');
            }}
            onBackToMenu={handleBackToMenu}
          />
        )
      )}

      {currentScreen === 'reward' && selectedUniverse && (
        <RewardScreen
          universe={selectedUniverse}
          onBackToMenu={handleBackToMenu}
          onReplay={handleReplay}
        />
      )}
      
      {currentScreen === 'classicLevelSelect' && (
        <ClassicLevelSelect
          onSelectLevel={(level) => {
            setClassicLevel(level);
            setPostLoadingScreen('classic');
            setCurrentScreen('loading');
          }}
          onBack={() => setCurrentScreen('lobby')}
        />
      )}

      {currentScreen === 'loading' && (
        <LoadingScreen 
          onComplete={() => {
            if (postLoadingScreen) {
              setCurrentScreen(postLoadingScreen);
              setPostLoadingScreen(null);
            } else {
              setCurrentScreen('lobby');
            }
          }}
        />
      )}

      {currentScreen === 'classic' && (
        <GameScreen
          initialLevel={classicLevel}
          onBackToLobby={() => setCurrentScreen('lobby')}
        />
      )}

      {currentScreen === 'infinite' && (
        <InfiniteMode onBackToLobby={() => setCurrentScreen('lobby')} />
      )}

      {currentScreen === 'challenge' && (
        <ChallengeMode onBackToLobby={() => setCurrentScreen('lobby')} />
      )}

      {currentScreen === 'ai-friends' && (
        <AIFriendsGame onBackToLobby={() => setCurrentScreen('ai-room-lobby')} />
      )}

      {currentScreen === 'ai-room-lobby' && (
        <AIRoomLobby 
          onBackToLobby={() => setCurrentScreen('lobby')}
          onStartGame={() => {
            setCurrentScreen('ai-friends');
          }}
        />
      )}

      {currentScreen === 'ai-room-waiting' && (
        <AIRoomWaiting 
          onBack={() => setCurrentScreen('lobby')}
          onStartGame={() => {
            setCurrentScreen('ai-friends');
          }}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen onBack={() => setCurrentScreen('lobby')} />
      )}

      {currentScreen === 'ranked' && (
        <RankedScreen onBack={() => setCurrentScreen('lobby')} />
      )}

      {currentScreen === 'tienda' && (
        <TiendaScreen onBack={() => setCurrentScreen('lobby')} userId={currentUser?.id} />
      )}

      {currentScreen === 'admin' && currentUser && (
        <AdminPanel 
          onBack={() => setCurrentScreen('lobby')} 
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}
