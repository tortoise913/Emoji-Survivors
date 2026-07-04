import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, Upgrade } from './game';
import { Maximize, Minimize } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  const [uiState, setUiState] = useState({
    state: 'MENU',
    stats: { time: 0, kills: 0, level: 1 },
    options: [] as Upgrade[]
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Touch joystick state
  const [touchActive, setTouchActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickStartRef = useRef({ x: 0, y: 0 });
  const joystickContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("無法啟用全螢幕:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (joystickContainerRef.current) {
        const rect = joystickContainerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        joystickStartRef.current = { x: centerX, y: centerY };
        setTouchActive(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchActive && e.touches.length > 0) {
      const touch = e.touches[0];
      const dx = touch.clientX - joystickStartRef.current.x;
      const dy = touch.clientY - joystickStartRef.current.y;
      const dist = Math.hypot(dx, dy);
      const maxDist = 40; // Joystick max radius

      let normX = dx;
      let normY = dy;
      if (dist > maxDist) {
        normX = (dx / dist) * maxDist;
        normY = (dy / dist) * maxDist;
      }

      setJoystickPos({ x: normX, y: normY });

      if (engineRef.current) {
        engineRef.current.touchDx = normX / maxDist;
        engineRef.current.touchDy = normY / maxDist;
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchActive(false);
    setJoystickPos({ x: 0, y: 0 });
    if (engineRef.current) {
      engineRef.current.touchDx = 0;
      engineRef.current.touchDy = 0;
    }
  };

  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('emoji_survivors_name') || '';
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPlayerName(val);
    localStorage.setItem('emoji_survivors_name', val);
  };

  const prevUiState = useRef(uiState.state);
  useEffect(() => {
    if (uiState.state === 'GAME_OVER' && prevUiState.current !== 'GAME_OVER') {
      // save score
      const newEntry = {
        name: playerName || '無名英雄',
        time: uiState.stats.time,
        kills: uiState.stats.kills,
        level: uiState.stats.level,
        date: new Date().toISOString()
      };
      const boardStr = localStorage.getItem('emoji_survivors_leaderboard');
      let board = [];
      if (boardStr) {
        try { board = JSON.parse(boardStr); } catch(e){}
      }
      board.push(newEntry);
      board.sort((a, b) => b.time - a.time); // Sort by time desc
      board = board.slice(0, 10);
      localStorage.setItem('emoji_survivors_leaderboard', JSON.stringify(board));
    }
    prevUiState.current = uiState.state;
  }, [uiState.state, uiState.stats, playerName]);

  const getLeaderboard = () => {
    const boardStr = localStorage.getItem('emoji_survivors_leaderboard');
    if (boardStr) {
      try { return JSON.parse(boardStr); } catch(e){}
    }
    return [];
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    if (canvasRef.current) {
      const engine = new GameEngine(canvasRef.current, (state) => {
        setUiState(s => ({ ...s, ...state }));
      });
      engineRef.current = engine;
      engine.start();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (engineRef.current) engineRef.current.stop();
    };
  }, []);

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.init();
    }
  };

  const selectUpgrade = (upgrade: Upgrade) => {
    if (engineRef.current) {
      upgrade.apply(engineRef.current.player);
      engineRef.current.resumeFromLevelUp();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-950 font-sans text-white select-none">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      
      {/* Start Menu */}
      {uiState.state === 'MENU' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
          <div className="text-7xl md:text-8xl mb-6 animate-bounce">🧛‍♂️</div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 tracking-tight mb-4 drop-shadow-lg text-center">
            Emoji 倖存者
          </h1>
          <p className="text-zinc-400 mb-8 text-base md:text-xl max-w-md text-center">
            在無盡的屍海中生存。使用 WASD、方向鍵或下方虛擬搖桿移動，自動攻擊敵人並收集寶石。
          </p>
          
          <input
            type="text"
            value={playerName}
            onChange={handleNameChange}
            placeholder="輸入你的名字..."
            className="mb-8 px-6 py-3 bg-zinc-900 border-2 border-zinc-700 rounded-full text-lg md:text-xl text-center text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors w-full max-w-xs"
            maxLength={12}
          />

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md justify-center px-4">
            <button 
              onClick={startGame}
              className="flex-1 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full text-xl md:text-2xl transition-transform hover:scale-105 shadow-xl shadow-red-900/50"
            >
              開始遊戲
            </button>
            <button 
              onClick={() => setUiState(s => ({ ...s, state: 'LEADERBOARD' }))}
              className="flex-1 px-8 py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-full text-xl md:text-2xl transition-transform hover:scale-105 shadow-xl"
            >
              排行榜
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {uiState.state === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center z-50 p-4">
          <h1 className="text-5xl md:text-7xl font-black text-red-500 mb-4 drop-shadow-md text-center">遊戲結束</h1>
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12 text-lg md:text-2xl font-bold bg-black/50 p-4 md:p-6 rounded-2xl border border-red-900/50 text-center">
            <div>
              <div className="text-sm text-zinc-400 mb-1">存活時間</div>
              <div>⏱️ {Math.floor(uiState.stats.time / 60)}:{Math.floor(uiState.stats.time % 60).toString().padStart(2, '0')}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-400 mb-1">擊殺數</div>
              <div>💀 {uiState.stats.kills}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-400 mb-1">達到等級</div>
              <div>⭐ Lv {uiState.stats.level}</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-lg justify-center px-4">
            <button 
              onClick={startGame}
              className="flex-1 px-6 py-4 bg-red-600 text-white hover:bg-red-500 font-bold rounded-full text-lg md:text-xl transition-transform hover:scale-105 shadow-xl"
            >
              再試一次
            </button>
            <button 
              onClick={() => setUiState(s => ({ ...s, state: 'LEADERBOARD' }))}
              className="flex-1 px-6 py-4 bg-yellow-600 text-white hover:bg-yellow-500 font-bold rounded-full text-lg md:text-xl transition-transform hover:scale-105 shadow-xl"
            >
              確認排名
            </button>
            <button 
              onClick={() => {
                if (engineRef.current) engineRef.current.state = 'MENU';
                setUiState(s => ({ ...s, state: 'MENU' }));
              }}
              className="flex-1 px-6 py-4 bg-zinc-700 text-white hover:bg-zinc-600 font-bold rounded-full text-lg md:text-xl transition-transform hover:scale-105 shadow-xl"
            >
              回到標題
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {uiState.state === 'LEADERBOARD' && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4 overflow-y-auto">
          <h2 className="text-4xl md:text-5xl font-black text-yellow-400 mb-6 tracking-widest drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
            排行榜
          </h2>
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl overflow-x-auto mb-8 shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="bg-zinc-800 text-zinc-400">
                <tr>
                  <th className="p-4 w-16 text-center">排名</th>
                  <th className="p-4">名稱</th>
                  <th className="p-4 text-right">存活時間</th>
                  <th className="p-4 text-right">擊殺數</th>
                  <th className="p-4 text-right">等級</th>
                </tr>
              </thead>
              <tbody>
                {getLeaderboard().map((entry: any, i: number) => (
                  <tr key={i} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors text-base md:text-lg">
                    <td className="p-4 text-center font-bold text-zinc-500">{i + 1}</td>
                    <td className="p-4 font-bold text-white max-w-[150px] truncate">{entry.name}</td>
                    <td className="p-4 text-right font-mono text-yellow-400">
                      {Math.floor(entry.time / 60)}:{Math.floor(entry.time % 60).toString().padStart(2, '0')}
                    </td>
                    <td className="p-4 text-right font-mono text-red-400">{entry.kills}</td>
                    <td className="p-4 text-right font-mono text-blue-400">{entry.level}</td>
                  </tr>
                ))}
                {getLeaderboard().length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">尚無紀錄</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button 
            onClick={() => {
              if (engineRef.current) engineRef.current.state = 'MENU';
              setUiState(s => ({ ...s, state: 'MENU' }));
            }}
            className="px-12 py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-full text-lg md:text-xl transition-transform hover:scale-105"
          >
            返回標題
          </button>
        </div>
      )}

      {/* Level Up */}
      {uiState.state === 'LEVEL_UP' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4 overflow-y-auto">
          <h2 className="text-4xl md:text-5xl font-black text-yellow-400 mb-8 md:mb-12 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
            升級！
          </h2>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center w-full max-w-5xl">
            {uiState.options.map((opt, i) => (
              <div 
                key={i} 
                onClick={() => selectUpgrade(opt)}
                className="flex-1 bg-zinc-900/90 border-2 border-zinc-700 rounded-2xl p-6 md:p-8 cursor-pointer hover:border-yellow-400 hover:bg-zinc-800 hover:-translate-y-2 transition-all shadow-2xl group flex flex-col items-center text-center"
              >
                <div className="text-5xl md:text-7xl mb-4 md:mb-6 group-hover:scale-110 transition-transform">{opt.emoji}</div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{opt.name}</h3>
                <p className="text-zinc-400 text-sm md:text-lg">{opt.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Touch Screen Virtual Joystick */}
      {uiState.state === 'PLAYING' && (
        <div 
          className="fixed bottom-6 left-6 z-40 flex flex-col items-center select-none touch-none"
          style={{ touchAction: 'none' }}
        >
          <div 
            ref={joystickContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-28 h-28 bg-zinc-900/40 backdrop-blur-md rounded-full border-2 border-white/20 flex items-center justify-center shadow-2xl cursor-pointer active:border-white/40"
          >
            <div 
              className="w-12 h-12 bg-white/40 backdrop-blur-lg rounded-full border border-white/50 shadow-md transition-transform"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                transition: touchActive ? 'none' : 'transform 0.15s ease-out'
              }}
            />
          </div>
          <span className="text-xs text-white/50 mt-2 tracking-widest pointer-events-none">滑動搖桿移動</span>
        </div>
      )}

      {/* Screen Maximize Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-6 right-6 z-50 p-4 bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
        title={isFullscreen ? "退出全螢幕" : "最大化全螢幕"}
      >
        {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
      </button>
    </div>
  );
}

