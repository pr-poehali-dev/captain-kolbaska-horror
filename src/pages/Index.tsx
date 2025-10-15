import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Position {
  x: number;
  y: number;
}

interface Bullet {
  id: number;
  position: Position;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  scary: boolean;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 40;
const ENEMY_SIZE = 50;
const BULLET_SIZE = 20;
const PLAYER_SPEED = 5;
const ENEMY_BASE_SPEED = 2;
const BULLETS_TO_WIN = 15;

export default function Index() {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'battle' | 'won' | 'dead'>('menu');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 100, y: 100 });
  const [enemyPos, setEnemyPos] = useState<Position>({ x: GAME_WIDTH - 100, y: GAME_HEIGHT - 100 });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [collectedBullets, setCollectedBullets] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameTime, setGameTime] = useState(0);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [showScreamer, setShowScreamer] = useState(false);
  const [enemySpeed, setEnemySpeed] = useState(ENEMY_BASE_SPEED);
  const [battleShots, setBattleShots] = useState(0);
  const [touchDirection, setTouchDirection] = useState<Position>({ x: 0, y: 0 });
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first-blood', title: '💀 Первая пуля', description: 'Собрал первую пулю... это только начало', icon: '💀', unlocked: false, scary: true },
    { id: 'speed-demon', title: '⚡ Спринтер ужаса', description: 'Пробежал марафон страха за 2 минуты', icon: '⚡', unlocked: false, scary: false },
    { id: 'close-call', title: '😱 На волоске', description: 'Здоровье упало ниже 10%... он почти поймал тебя', icon: '😱', unlocked: false, scary: true },
    { id: 'collector', title: '🎯 Коллекционер', description: 'Собрал 10 пуль! Почти готов к бою', icon: '🎯', unlocked: false, scary: false },
    { id: 'survivor', title: '🏆 Выживший', description: 'Победил Гомикова и остался жив!', icon: '🏆', unlocked: false, scary: false },
    { id: 'screamer-victim', title: '👻 Жертва скримера', description: 'Испугался так, что чуть не выронил мышку', icon: '👻', unlocked: false, scary: true },
  ]);

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const achievement = prev.find(a => a.id === id);
      if (achievement && !achievement.unlocked) {
        const updated = prev.map(a => a.id === id ? { ...a, unlocked: true } : a);
        toast({
          title: `🎖️ Достижение разблокировано!`,
          description: `${achievement.icon} ${achievement.title}`,
        });
        return updated;
      }
      return prev;
    });
  }, [toast]);

  const spawnBullet = useCallback(() => {
    const newBullet: Bullet = {
      id: Date.now(),
      position: {
        x: Math.random() * (GAME_WIDTH - BULLET_SIZE),
        y: Math.random() * (GAME_HEIGHT - BULLET_SIZE),
      },
    };
    setBullets(prev => [...prev, newBullet]);
  }, []);

  const triggerScreamer = useCallback(() => {
    setShowScreamer(true);
    unlockAchievement('screamer-victim');
    setTimeout(() => setShowScreamer(false), 300);
  }, [unlockAchievement]);

  const startGame = () => {
    setGameState('playing');
    setPlayerPos({ x: 100, y: 100 });
    setEnemyPos({ x: GAME_WIDTH - 100, y: GAME_HEIGHT - 100 });
    setCollectedBullets(0);
    setHealth(100);
    setGameTime(0);
    setBullets([]);
    setEnemySpeed(ENEMY_BASE_SPEED);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => spawnBullet(), i * 500);
    }
  };

  const startBattle = useCallback(() => {
    setGameState('battle');
    setBattleShots(0);
    toast({
      title: '⚔️ Финальная битва!',
      description: 'Отстреливайся! Нажимай SPACE для выстрела!',
    });
  }, [toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.key.toLowerCase()));
      
      if (gameState === 'battle' && e.key === ' ') {
        e.preventDefault();
        if (collectedBullets > 0) {
          setCollectedBullets(prev => prev - 1);
          setBattleShots(prev => {
            const newShots = prev + 1;
            if (newShots >= 10) {
              setGameState('won');
              unlockAchievement('survivor');
            }
            return newShots;
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, collectedBullets, unlockAchievement]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setPlayerPos(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (keys.has('w') || keys.has('arrowup')) newY -= PLAYER_SPEED;
        if (keys.has('s') || keys.has('arrowdown')) newY += PLAYER_SPEED;
        if (keys.has('a') || keys.has('arrowleft')) newX -= PLAYER_SPEED;
        if (keys.has('d') || keys.has('arrowright')) newX += PLAYER_SPEED;

        newX += touchDirection.x * PLAYER_SPEED;
        newY += touchDirection.y * PLAYER_SPEED;

        newX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_SIZE, newX));
        newY = Math.max(0, Math.min(GAME_HEIGHT - PLAYER_SIZE, newY));

        return { x: newX, y: newY };
      });

      setEnemyPos(prev => {
        const dx = playerPos.x - prev.x;
        const dy = playerPos.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ENEMY_SIZE) {
          setHealth(h => {
            const newHealth = Math.max(0, h - 5);
            if (newHealth <= 0) {
              setGameState('dead');
            }
            return newHealth;
          });
        }

        const moveX = (dx / distance) * enemySpeed;
        const moveY = (dy / distance) * enemySpeed;

        return {
          x: prev.x + moveX,
          y: prev.y + moveY,
        };
      });

      setBullets(prev => {
        return prev.filter(bullet => {
          const dx = playerPos.x - bullet.position.x;
          const dy = playerPos.y - bullet.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < PLAYER_SIZE) {
            setCollectedBullets(c => {
              const newCount = c + 1;
              if (newCount === 1) unlockAchievement('first-blood');
              if (newCount === 10) unlockAchievement('collector');
              if (newCount >= BULLETS_TO_WIN) {
                setTimeout(startBattle, 1000);
              }
              return newCount;
            });
            return false;
          }
          return true;
        });
      });

      setGameTime(t => t + 1);
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameState, keys, playerPos, enemySpeed, unlockAchievement, startBattle, touchDirection]);

  useEffect(() => {
    if (gameState === 'playing') {
      const spawnInterval = setInterval(spawnBullet, 3000);
      return () => clearInterval(spawnInterval);
    }
  }, [gameState, spawnBullet]);

  useEffect(() => {
    if (gameState === 'playing' && gameTime > 0 && gameTime % 300 === 0) {
      setEnemySpeed(prev => prev + 0.5);
    }
  }, [gameTime, gameState]);

  useEffect(() => {
    if (gameState === 'playing' && Math.random() < 0.005) {
      triggerScreamer();
    }
  }, [gameTime, gameState, triggerScreamer]);

  useEffect(() => {
    if (health <= 10 && health > 0) {
      unlockAchievement('close-call');
    }
  }, [health, unlockAchievement]);

  useEffect(() => {
    if (gameTime === 120) {
      unlockAchievement('speed-demon');
    }
  }, [gameTime, unlockAchievement]);

  const distance = Math.sqrt(
    Math.pow(playerPos.x - enemyPos.x, 2) + Math.pow(playerPos.y - enemyPos.y, 2)
  );
  const dangerLevel = Math.max(0, 100 - (distance / 3));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] flex items-center justify-center p-4">
      {gameState === 'menu' && (
        <Card className="w-full max-w-2xl p-8 bg-[#1A1A1A] border-[#8B0000] border-2 shadow-[0_0_30px_rgba(139,0,0,0.5)]">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-[#8B0000] tracking-wider font-[Montserrat]" style={{ textShadow: '0 0 20px rgba(139,0,0,0.8)' }}>
                КАПИТАН КОЛБАСКА
              </h1>
              <h2 className="text-2xl text-[#FFFFFF] font-[Montserrat]">HORROR CHASE</h2>
            </div>

            <div className="bg-[#2D2D2D] p-6 rounded-lg border border-[#4A0000]">
              <img 
                src="https://cdn.poehali.dev/files/42a66c1a-fac1-4835-9323-b98048f5f313.jpg"
                alt="Капитан Колбаска"
                className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-[#8B0000] shadow-lg"
              />
              <p className="text-[#FFFFFF] mb-4 font-[Roboto]">
                Гомиков преследует тебя. Собери <span className="text-[#8B0000] font-bold">{BULLETS_TO_WIN} пуль</span>, чтобы дать отпор в финальной битве.
              </p>
              <div className="space-y-2 text-sm text-[#FFFFFF] opacity-80">
                <p>🎮 Управление: WASD или стрелки</p>
                <p>⚔️ Битва: SPACE для выстрела</p>
                <p>💀 Не дай ему поймать себя!</p>
              </div>
            </div>

            <Button 
              onClick={startGame}
              className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white text-xl py-6 font-[Montserrat] font-bold shadow-[0_0_20px_rgba(139,0,0,0.6)] transition-all"
            >
              НАЧАТЬ КОШМАР
            </Button>

            <div className="mt-8">
              <h3 className="text-xl text-[#8B0000] font-bold mb-4 font-[Montserrat]">🏆 ДОСТИЖЕНИЯ</h3>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map(achievement => (
                  <div 
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${
                      achievement.unlocked 
                        ? 'bg-[#2D2D2D] border-[#8B0000]' 
                        : 'bg-[#1A1A1A] border-[#4A0000] opacity-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <div className="text-xs text-[#FFFFFF] font-bold">{achievement.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {gameState === 'playing' && (
        <div className="relative">
          <div className="mb-4 flex gap-4 items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Heart" size={20} className="text-[#8B0000]" />
                <span className="text-[#FFFFFF] font-bold">{health}%</span>
              </div>
              <Progress value={health} className="h-3 bg-[#2D2D2D]" />
            </div>
            
            <Badge className="bg-[#8B0000] text-white text-lg px-4 py-2">
              <Icon name="CircleDot" size={20} className="mr-2" />
              {collectedBullets} / {BULLETS_TO_WIN}
            </Badge>

            <div className="text-[#FFFFFF] font-[Roboto]">
              <Icon name="Clock" size={20} className="inline mr-2" />
              {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div 
            className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border-4 border-[#4A0000] rounded-lg overflow-hidden shadow-[0_0_50px_rgba(139,0,0,0.7)]"
            style={{ 
              width: GAME_WIDTH, 
              height: GAME_HEIGHT,
              boxShadow: `0 0 ${dangerLevel}px rgba(139, 0, 0, ${dangerLevel / 100})`
            }}
          >
            <div
              className="absolute bg-gradient-to-br from-[#8B0000] to-[#4A0000] rounded-full shadow-[0_0_20px_rgba(139,0,0,0.8)] transition-all duration-100"
              style={{
                left: playerPos.x,
                top: playerPos.y,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
              }}
            >
              <img 
                src="https://cdn.poehali.dev/files/42a66c1a-fac1-4835-9323-b98048f5f313.jpg"
                alt="Player"
                className="w-full h-full rounded-full object-cover"
              />
            </div>

            <div
              className="absolute bg-gradient-to-br from-[#FFFFFF] to-[#CCCCCC] rounded-full shadow-[0_0_30px_rgba(255,255,255,0.6)] animate-pulse"
              style={{
                left: enemyPos.x,
                top: enemyPos.y,
                width: ENEMY_SIZE,
                height: ENEMY_SIZE,
              }}
            >
              <img 
                src="https://cdn.poehali.dev/files/6ce00014-cf93-4941-8e2e-4eb3c7e6cb8c.jpg"
                alt="Enemy"
                className="w-full h-full rounded-full object-cover"
              />
            </div>

            {bullets.map(bullet => (
              <div
                key={bullet.id}
                className="absolute flex items-center justify-center text-2xl animate-pulse"
                style={{
                  left: bullet.position.x,
                  top: bullet.position.y,
                  width: BULLET_SIZE,
                  height: BULLET_SIZE,
                }}
              >
                💊
              </div>
            ))}

            {showScreamer && (
              <div className="absolute inset-0 bg-red-600 flex items-center justify-center z-50 animate-pulse">
                <img 
                  src="https://cdn.poehali.dev/files/6ce00014-cf93-4941-8e2e-4eb3c7e6cb8c.jpg"
                  alt="Screamer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {dangerLevel > 50 && (
            <div className="mt-4 text-center">
              <Badge variant="destructive" className="bg-[#8B0000] text-white text-lg animate-pulse">
                <Icon name="TriangleAlert" size={20} className="mr-2" />
                ОН БЛИЗКО!
              </Badge>
            </div>
          )}

          <div className="mt-6 grid grid-cols-3 gap-4 max-w-xs mx-auto">
            <div />
            <Button
              onTouchStart={() => setTouchDirection({ x: 0, y: -1 })}
              onTouchEnd={() => setTouchDirection({ x: 0, y: 0 })}
              onMouseDown={() => setKeys(prev => new Set(prev).add('w'))}
              onMouseUp={() => setKeys(prev => { const newKeys = new Set(prev); newKeys.delete('w'); return newKeys; })}
              className="bg-[#8B0000] hover:bg-[#6B0000] h-16 text-2xl"
            >
              <Icon name="ChevronUp" size={32} />
            </Button>
            <div />
            <Button
              onTouchStart={() => setTouchDirection({ x: -1, y: 0 })}
              onTouchEnd={() => setTouchDirection({ x: 0, y: 0 })}
              onMouseDown={() => setKeys(prev => new Set(prev).add('a'))}
              onMouseUp={() => setKeys(prev => { const newKeys = new Set(prev); newKeys.delete('a'); return newKeys; })}
              className="bg-[#8B0000] hover:bg-[#6B0000] h-16 text-2xl"
            >
              <Icon name="ChevronLeft" size={32} />
            </Button>
            <Button
              onTouchStart={() => setTouchDirection({ x: 0, y: 1 })}
              onTouchEnd={() => setTouchDirection({ x: 0, y: 0 })}
              onMouseDown={() => setKeys(prev => new Set(prev).add('s'))}
              onMouseUp={() => setKeys(prev => { const newKeys = new Set(prev); newKeys.delete('s'); return newKeys; })}
              className="bg-[#8B0000] hover:bg-[#6B0000] h-16 text-2xl"
            >
              <Icon name="ChevronDown" size={32} />
            </Button>
            <Button
              onTouchStart={() => setTouchDirection({ x: 1, y: 0 })}
              onTouchEnd={() => setTouchDirection({ x: 0, y: 0 })}
              onMouseDown={() => setKeys(prev => new Set(prev).add('d'))}
              onMouseUp={() => setKeys(prev => { const newKeys = new Set(prev); newKeys.delete('d'); return newKeys; })}
              className="bg-[#8B0000] hover:bg-[#6B0000] h-16 text-2xl"
            >
              <Icon name="ChevronRight" size={32} />
            </Button>
          </div>
        </div>
      )}

      {gameState === 'battle' && (
        <Card className="w-full max-w-2xl p-8 bg-[#1A1A1A] border-[#8B0000] border-4">
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-bold text-[#8B0000] font-[Montserrat]">⚔️ ФИНАЛЬНАЯ БИТВА</h2>
            
            <div className="relative h-64 flex items-center justify-center">
              <img 
                src="https://cdn.poehali.dev/files/6ce00014-cf93-4941-8e2e-4eb3c7e6cb8c.jpg"
                alt="Гомиков"
                className="w-48 h-48 rounded-full animate-pulse border-4 border-[#8B0000]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className="bg-[#8B0000] text-white text-xl px-6 py-3">
                  <Icon name="CircleDot" size={24} className="mr-2" />
                  Пули: {collectedBullets}
                </Badge>
                <Badge className="bg-[#2D2D2D] text-white text-xl px-6 py-3">
                  <Icon name="Target" size={24} className="mr-2" />
                  Попаданий: {battleShots}/10
                </Badge>
              </div>

              <Progress value={(battleShots / 10) * 100} className="h-4 bg-[#2D2D2D]" />

              <div className="space-y-4">
                <p className="text-[#FFFFFF] text-lg">
                  Нажимай <kbd className="px-3 py-1 bg-[#2D2D2D] rounded border border-[#8B0000]">SPACE</kbd> для выстрела!
                </p>
                <Button
                  onClick={() => {
                    if (collectedBullets > 0) {
                      setCollectedBullets(prev => prev - 1);
                      setBattleShots(prev => {
                        const newShots = prev + 1;
                        if (newShots >= 10) {
                          setGameState('won');
                          unlockAchievement('survivor');
                        }
                        return newShots;
                      });
                    }
                  }}
                  className="w-full bg-[#8B0000] hover:bg-[#6B0000] text-white text-2xl py-8 font-bold"
                >
                  🎯 ВЫСТРЕЛИТЬ
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={gameState === 'won'} onOpenChange={() => setGameState('menu')}>
        <DialogContent className="bg-[#1A1A1A] border-[#8B0000] border-2">
          <DialogHeader>
            <DialogTitle className="text-3xl text-[#8B0000] font-[Montserrat]">🏆 ПОБЕДА!</DialogTitle>
            <DialogDescription className="text-[#FFFFFF] text-lg">
              Ты победил Гомикова! Капитан Колбаска остался жив!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-[#2D2D2D] p-4 rounded-lg">
              <p className="text-[#FFFFFF]">⏱️ Время: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</p>
              <p className="text-[#FFFFFF]">💊 Собрано пуль: {collectedBullets}</p>
              <p className="text-[#FFFFFF]">❤️ Здоровье: {health}%</p>
            </div>
            <Button onClick={() => setGameState('menu')} className="w-full bg-[#8B0000] hover:bg-[#6B0000]">
              В МЕНЮ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={gameState === 'dead'} onOpenChange={() => setGameState('menu')}>
        <DialogContent className="bg-[#1A1A1A] border-[#8B0000] border-2">
          <DialogHeader>
            <DialogTitle className="text-3xl text-[#8B0000] font-[Montserrat]">💀 GAME OVER</DialogTitle>
            <DialogDescription className="text-[#FFFFFF] text-lg">
              Гомиков поймал тебя... Попробуй снова!
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setGameState('menu')} className="w-full bg-[#8B0000] hover:bg-[#6B0000]">
            В МЕНЮ
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}