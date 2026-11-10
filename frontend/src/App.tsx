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
import socket, { connectSocket, disconnectSocket } from './lib/socket';
import { saveSession, clearSession, getStoredUser, getToken, apiFetch, type AuthResponse, type AuthUser } from './lib/api';

export type Universe = 'volcania' | 'frostheim' | 'neural' | 'verdalis' | 'lunaris';
export type BossType = 'naturaleza' | 'ciencia' | 'humano' | 'ecosistema' | 'tecnologia' | 'elementos';

export type GameScreen = 'login' | 'register' | 'lobby' | 'roomWaiting' | 'multiplayerGame' | 'finalResults' | 'menu' | 'game' | 'boss' | 'boss-select' | 'reward' | 'classic' | 'classicLevelSelect' | 'loading' | 'infinite' | 'challenge' | 'ai-friends' | 'ai-room-lobby' | 'ai-room-waiting' | 'profile' | 'ranked' | 'tienda' | 'admin';

export type Player = {
  id: string;
  email: string;
  name?: string;
  teamId: number;
  role?: string;
  level?: number;
  xp?: number;
  coins?: number;
  gems?: number;
  isReady?: boolean;
  score?: number;
};

export type Room = {
  id: string;
  name: string;
  code: string;
  players: Player[];
  maxPlayers: number;
  isStarted?: boolean;
  status?: string;
  mode?: string;
  difficulty?: string;
  hostId?: string;
  creatorId?: string;
  gameState?: any;
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
    socket.on('rooms:update', (data: any[]) => {
      setRooms(data);
      setCurrentRoom(prev => {
        if (!prev) return null;
        const found = data.find((r: any) => r.id === prev.id || (r.code && prev.code && r.code === prev.code));
        if (!found) return prev;
        return {
          ...prev,
          ...found,
          isStarted: prev.isStarted || found.isStarted || found.status === 'playing',
          gameState: found.gameState?.cards?.length ? found.gameState : (prev.gameState || found.gameState),
        };
      });
    });

    socket.on('room:joined', (payload: any) => {
      setCurrentRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(payload.room || {}),
          players: payload.players || payload.room?.players || prev.players,
          gameState: payload.gameState?.cards?.length ? payload.gameState : (prev.gameState || payload.gameState),
        };
      });
    });

    socket.on('room:state', (payload: any) => {
      setCurrentRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: payload.players || prev.players,
          gameState: payload.gameState?.cards?.length ? payload.gameState : (prev.gameState || payload.gameState),
        };
      });
    });

    socket.on('room:player-joined', (payload: any) => {
      if (payload.players) {
        setCurrentRoom(prev => prev ? { ...prev, players: payload.players } : prev);
      }
    });

    socket.on('room:player-ready', (payload: any) => {
      if (payload.players) {
        setCurrentRoom(prev => prev ? { ...prev, players: payload.players } : prev);
      }
    });

    socket.on('room:player-left', (payload: any) => {
      if (payload.players) {
        setCurrentRoom(prev => prev ? { ...prev, players: payload.players } : prev);
      }
    });

    socket.on('game:started', (payload: any) => {
      setCurrentRoom(prev => prev ? {
        ...prev,
        isStarted: true,
        gameState: {
          ...(prev.gameState || {}),
          ...(payload.gameState || {}),
          cards: payload.cards || payload.gameState?.cards || prev.gameState?.cards || [],
          currentTurn: payload.firstTurn || payload.currentTurn || payload.gameState?.currentTurn,
        },
      } : prev);
      setCurrentScreen('multiplayerGame');
    });

    socket.on('room:started', (payload: any) => {
      if (payload?.gameState || payload?.cards) {
        setCurrentRoom(prev => prev ? {
          ...prev,
          isStarted: true,
          gameState: {
            ...(prev.gameState || {}),
            ...(payload.gameState || {}),
            cards: payload.cards || payload.gameState?.cards || prev.gameState?.cards || [],
            currentTurn: payload.firstTurn || payload.currentTurn || payload.gameState?.currentTurn,
          },
        } : prev);
      }
      setCurrentScreen('multiplayerGame');
    });

    (async () => {
      try {
        const res = await apiFetch<Room[]>('/api/rooms');
        if (Array.isArray(res)) setRooms(res);
      } catch (err) {
        console.error('Error fetching rooms', err);
      }
    })();

    return () => {
      socket.off('rooms:update');
      socket.off('room:joined');
      socket.off('room:state');
      socket.off('room:player-joined');
      socket.off('room:player-ready');
      socket.off('room:player-left');
      socket.off('game:started');
      socket.off('room:started');
    };
  }, []);

  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);

  /**
   * Restaurar sesión al abrir la app (si hay token guardado y sigue siendo válido).
   */
  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser || !getToken()) return;

    (async () => {
      try {
        const res = await apiFetch<{ hasAccess: boolean }>(`/api/auth/validate/${storedUser.id}`);
        if (!res.hasAccess) {
          throw new Error('Sesión sin acceso');
        }
        setCurrentUser(toPlayer(storedUser));
        connectSocket();
        setPostLoadingScreen('lobby');
        setCurrentScreen('loading');
      } catch {
        // Token inválido/expirado o usuario baneado: limpiar sesión
        clearSession();
      }
    })();
  }, []);

  /**
   * Unirse automáticamente a una sala si la URL contiene ?join=CODIGO (al escanear QR)
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (!joinCode || !currentUser) return;

    (async () => {
      try {
        const room = await apiFetch<any>(`/api/rooms/${joinCode}/join`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        setCurrentRoom(room);
        setCurrentScreen('roomWaiting');
        window.history.replaceState({}, '', window.location.pathname);
      } catch (err) {
        console.error('Error uniéndose a la sala por QR:', err);
      }
    })();
  }, [currentUser]);

  const toPlayer = (user: AuthUser): Player => ({
    id: user.id,
    email: user.email,
    name: user.username || (user.email ? user.email.split('@')[0] : 'Operador'),
    teamId: 0,
    role: user.role,
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    gems: user.gems,
  });

  const handleLoginSuccess = (auth: AuthResponse) => {
    saveSession(auth.token, auth.user);
    setCurrentUser(toPlayer(auth.user));
    connectSocket();
    setPostLoadingScreen('lobby');
    setCurrentScreen('loading');
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
        const updatedRoom = await apiFetch<Room>(`/api/rooms/${currentRoom.id}/team`, {
          method: 'PUT',
          body: JSON.stringify({ teamId }),
        });
        setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
        setCurrentUser(prev => prev ? { ...prev, teamId } : null);
        setCurrentRoom(updatedRoom);
      } catch (err) {
        console.error('Error changing team', err);
      }
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
    clearSession();
    disconnectSocket();
    setCurrentUser(null);
    setCurrentRoom(null);
    setCurrentScreen('login');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('lobby');
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
          currentUser={currentUser}
          onStartMode={(mode) => {
            if (mode === 'classic') {
              setCurrentScreen('classicLevelSelect');
              return;
            } else if (mode === 'infinite') {
              setCurrentScreen('infinite');
              return;
            } else if (mode === 'challenge') {
              setCurrentScreen('challenge');
              return;
            } else if (mode === 'boss') {
              setCurrentScreen('boss-select');
              return;
            } else if (mode === 'ai-friends') {
              setCurrentScreen('ai-room-lobby');
              return;
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
              setCurrentScreen('menu');
              return;
            }
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
          onChangeTeam={handleChangeTeam}
          onBackToLobby={handleBackToLobby}
          onUpdateRoom={(updatedRoom) => setCurrentRoom(updatedRoom)}
          onStartRoomGame={(startedRoom) => {
            setCurrentRoom(startedRoom);
            setCurrentScreen('multiplayerGame');
          }}
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
        selectedBossType === 'ecosistema' || selectedBossType === 'tecnologia' || selectedBossType === 'elementos' || selectedBossType === 'ciencia' || selectedBossType === 'humano' ? (
          <TriadasConexiones
            universe={selectedUniverse}
            modo={selectedBossType}
            onComplete={() => {
              const stats = loadPlayerStats();
              const newStats = addXP(stats, 350);
              savePlayerStats(newStats);
              setCurrentScreen('reward');
            }}
            onBackToMenu={() => setCurrentScreen('boss-select')}
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
            onBackToMenu={() => setCurrentScreen('boss-select')}
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
            setCurrentScreen('classic');
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
          onBackToLobby={() => setCurrentScreen('classicLevelSelect')}
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
          currentUser={currentUser}
          onJoinRealRoom={(room: any) => {
            setCurrentRoom(room);
            setCurrentScreen('roomWaiting');
          }}
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
        <ProfileScreen 
          onBack={() => setCurrentScreen('lobby')} 
          currentUser={currentUser}
          currentRoom={currentRoom}
        />
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
