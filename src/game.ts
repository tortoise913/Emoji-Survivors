export type GameState = 'MENU' | 'PLAYING' | 'LEVEL_UP' | 'GAME_OVER' | 'LEADERBOARD';

export interface Weapon {
  id: string;
  level: number;
  cooldownTimer: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lastDirX: number;
  lastDirY: number;
  speed: number;
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  xpToNext: number;
  pickupRange: number;
  damageMult: number;
  invulnTimer: number;
  weapons: Weapon[];
  radius: number;
  emoji: string;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  emoji: string;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  radius: number;
  emoji: string;
  pierce: number;
  hitEnemies: Set<number>;
  gravity?: number;
  rotSpeed?: number;
}

export interface Gem {
  x: number;
  y: number;
  exp: number;
}

export interface Effect {
  x: number;
  y: number;
  radius?: number;
  targetX?: number;
  targetY?: number;
  life: number;
  type: string;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  vy: number;
  color: string;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  emoji: string;
  canApply: (player: Player) => boolean;
  apply: (player: Player) => void;
}

export const UPGRADES: Upgrade[] = [
  { id: 'spd', name: '跑鞋', description: '移動速度增加 20%。', emoji: '👟', canApply: p => p.speed < 400, apply: p => p.speed *= 1.2 },
  { id: 'hp', name: '活力', description: '最大生命值 +50。', emoji: '❤️', canApply: () => true, apply: p => { p.maxHp += 50; p.hp += 50; } },
  { id: 'dmg', name: '菠菜', description: '傷害增加 20%。', emoji: '🥬', canApply: () => true, apply: p => p.damageMult += 0.2 },
  { id: 'magnet', name: '磁鐵', description: '拾取範圍增加 50%。', emoji: '🧲', canApply: () => true, apply: p => p.pickupRange *= 1.5 },
  { id: 'heal', name: '烤雞', description: '恢復 50 點生命值。', emoji: '🍗', canApply: p => p.hp < p.maxHp, apply: p => p.hp = Math.min(p.maxHp, p.hp + 50) },
];

const weaponsConfig = [
  { id: 'wand', name: '魔法杖', emoji: '🪄', descFirst: '攻擊最近的敵人。', descUpgrade: '提升攻擊速度與投射物數量。' },
  { id: 'garlic', name: '大蒜', emoji: '🧅', descFirst: '對周圍敵人造成傷害。', descUpgrade: '提升傷害半徑與每秒傷害。' },
  { id: 'knife', name: '飛刀', emoji: '🔪', descFirst: '朝移動方向投擲飛刀，可貫通敵人。', descUpgrade: '縮短冷卻時間並增加投擲數量。' },
  { id: 'lightning', name: '閃電', emoji: '⚡', descFirst: '隨機電擊並連鎖敵人。', descUpgrade: '增加連鎖次數與電擊傷害。' },
  { id: 'axe', name: '飛斧', emoji: '🪓', descFirst: '向上拋出 1 把旋轉飛斧，大範圍拋物線攻擊。', descUpgrade: '多加 1 把旋轉拋射飛斧，並微幅提升傷害。' }
];

for (const wConfig of weaponsConfig) {
  // Level 1
  UPGRADES.push({
    id: `${wConfig.id}_1`,
    name: wConfig.name,
    description: wConfig.descFirst,
    emoji: wConfig.emoji,
    canApply: p => !p.weapons.find(w => w.id === wConfig.id),
    apply: p => p.weapons.push({ id: wConfig.id, level: 1, cooldownTimer: 0 })
  });

  // Levels 2 to 10
  for (let lvl = 2; lvl <= 10; lvl++) {
    let desc = wConfig.descUpgrade;
    if (wConfig.id === 'axe') {
      desc = `增加 1 把斧頭（共 ${lvl} 把），並提升基礎傷害。`;
    } else {
      desc = `${wConfig.descUpgrade}（Lv${lvl}）`;
    }
    UPGRADES.push({
      id: `${wConfig.id}_${lvl}`,
      name: `${wConfig.name} Lv${lvl}`,
      description: desc,
      emoji: wConfig.emoji,
      canApply: p => p.weapons.find(w => w.id === wConfig.id)?.level === lvl - 1,
      apply: p => {
        const weapon = p.weapons.find(w => w.id === wConfig.id);
        if (weapon) weapon.level++;
      }
    });
  }
}

const ENEMY_TYPES = [
  { emoji: '🦇', hp: 10, speed: 85, damage: 5, radius: 12, tier: 1 },
  { emoji: '🕷️', hp: 15, speed: 110, damage: 6, radius: 10, tier: 1 },
  { emoji: '🧟', hp: 35, speed: 45, damage: 10, radius: 15, tier: 2 },
  { emoji: '👻', hp: 25, speed: 65, damage: 8, radius: 15, tier: 2 },
  { emoji: '💀', hp: 50, speed: 55, damage: 12, radius: 14, tier: 3 },
  { emoji: '🐺', hp: 60, speed: 95, damage: 14, radius: 14, tier: 3 },
  { emoji: '🎃', hp: 90, speed: 50, damage: 16, radius: 18, tier: 4 },
  { emoji: '🧙‍♂️', hp: 110, speed: 60, damage: 20, radius: 16, tier: 4 },
  { emoji: '👹', hp: 250, speed: 70, damage: 25, radius: 22, tier: 5 },
  { emoji: '🐉', hp: 600, speed: 45, damage: 35, radius: 30, tier: 5 },
  { emoji: '🧛', hp: 1200, speed: 65, damage: 45, radius: 25, tier: 6 },
];

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  onStateChange: (state: any) => void;
  
  state: GameState = 'MENU';
  paused: boolean = false;
  lastTime: number = 0;
  animationFrameId: number = 0;
  
  player!: Player;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  gems: Gem[] = [];
  effects: Effect[] = [];
  floatingTexts: FloatingText[] = [];
  
  keys: Record<string, boolean> = {};
  touchDx: number = 0;
  touchDy: number = 0;
  
  time: number = 0;
  spawnTimer: number = 0;
  enemyIdCounter: number = 0;
  stats = { kills: 0 };
  
  constructor(canvas: HTMLCanvasElement, onStateChange: (state: any) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.loop = this.loop.bind(this);
  }
  
  init() {
    this.player = {
      x: 0, y: 0, vx: 0, vy: 0, lastDirX: 1, lastDirY: 0,
      speed: 150, hp: 100, maxHp: 100, xp: 0, level: 1, xpToNext: 100,
      pickupRange: 80, damageMult: 1.0, invulnTimer: 0,
      weapons: [{ id: 'wand', level: 1, cooldownTimer: 0 }],
      radius: 15, emoji: '🧙‍♂️'
    };
    this.enemies = [];
    this.projectiles = [];
    this.gems = [];
    this.effects = [];
    this.floatingTexts = [];
    this.time = 0;
    this.spawnTimer = 0;
    this.touchDx = 0;
    this.touchDy = 0;
    this.stats = { kills: 0 };
    this.state = 'PLAYING';
    this.paused = false;
    this.notifyState();
  }
  
  start() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }
  
  stop() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    cancelAnimationFrame(this.animationFrameId);
  }
  
  handleKeyDown(e: KeyboardEvent) { this.keys[e.key.toLowerCase()] = true; }
  handleKeyUp(e: KeyboardEvent) { this.keys[e.key.toLowerCase()] = false; }
  
  notifyState(options?: Upgrade[]) {
    this.onStateChange({
      state: this.state,
      stats: { time: this.time, kills: this.stats.kills, level: this.player?.level || 1 },
      options: options || null
    });
  }
  
  resumeFromLevelUp() {
    this.state = 'PLAYING';
    this.paused = false;
    this.lastTime = performance.now(); // Reset time to prevent huge dt
    this.notifyState();
  }
  
  triggerGameOver() {
    this.state = 'GAME_OVER';
    this.paused = true;
    this.notifyState();
  }
  
  triggerLevelUp() {
    this.player.xp -= this.player.xpToNext;
    this.player.level++;
    this.player.xpToNext = Math.floor(this.player.xpToNext * 1.5);
    this.state = 'LEVEL_UP';
    this.paused = true;
    
    let available = UPGRADES.filter(u => u.canApply(this.player));
    if (available.length < 3) {
      available = [...available, ...UPGRADES.filter(u => u.id === 'hp' || u.id === 'heal')];
    }
    // Shuffle and pick 3 unique
    const shuffled = available.sort(() => 0.5 - Math.random());
    const picked = Array.from(new Set(shuffled)).slice(0, 3);
    
    this.notifyState(picked);
  }
  
  addExp(amount: number) {
    this.player.xp += amount;
    if (this.player.xp >= this.player.xpToNext) {
      this.triggerLevelUp();
    }
  }
  
  damageEnemy(e: Enemy, amount: number) {
    e.hp -= amount;
    this.floatingTexts.push({ x: e.x, y: e.y - 20, text: Math.floor(amount).toString(), life: 0.5, vy: -30, color: 'white' });
    if (e.hp <= 0) {
      const idx = this.enemies.indexOf(e);
      if (idx !== -1) {
        this.enemies.splice(idx, 1);
        this.gems.push({ x: e.x, y: e.y, exp: e.maxHp });
        this.stats.kills++;
      }
    }
  }
  
  loop(now: number) {
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.1) dt = 0.1; // Cap dt for physics stability
    
    if (!this.paused && this.state === 'PLAYING') {
      this.update(dt);
    }
    
    if (this.state !== 'MENU') {
      this.draw();
    }
    
    this.animationFrameId = requestAnimationFrame(this.loop);
  }
  
  update(dt: number) {
    this.time += dt;
    
    // Player movement
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;
    
    // Check touch/joystick input if no keyboard input is present
    if (dx === 0 && dy === 0) {
      dx = this.touchDx;
      dy = this.touchDy;
    }
    
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      this.player.lastDirX = dx;
      this.player.lastDirY = dy;
    }
    
    this.player.x += dx * this.player.speed * dt;
    this.player.y += dy * this.player.speed * dt;
    if (this.player.invulnTimer > 0) this.player.invulnTimer -= dt;
    
    // Spawning enemies
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.12, 1.0 - this.time / 180); // Gets faster
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(this.canvas.width, this.canvas.height) / 2 + 100;
      const ex = this.player.x + Math.cos(angle) * dist;
      const ey = this.player.y + Math.sin(angle) * dist;
      
      // Determine which tier of enemies can spawn based on elapsed time
      let allowedTiers: number[] = [1];
      if (this.time > 20) allowedTiers.push(2);
      if (this.time > 50) allowedTiers.push(3);
      if (this.time > 90) allowedTiers.push(4);
      if (this.time > 150) allowedTiers.push(5);
      if (this.time > 240) allowedTiers.push(6);

      const candidateTypes = ENEMY_TYPES.filter(type => allowedTiers.includes(type.tier));
      
      let type = candidateTypes[0];
      if (candidateTypes.length > 1) {
        const r = Math.random();
        if (r < 0.4) {
          const highestTier = allowedTiers[allowedTiers.length - 1];
          const highestCandidates = candidateTypes.filter(c => c.tier === highestTier);
          type = highestCandidates[Math.floor(Math.random() * highestCandidates.length)];
        } else {
          type = candidateTypes[Math.floor(Math.random() * candidateTypes.length)];
        }
      }
      
      const scaledHp = type.hp * (1 + this.time / 100);
      const scaledSpeed = type.speed * (1 + Math.min(0.5, this.time / 300));
      this.enemies.push({ 
        id: this.enemyIdCounter++, 
        x: ex, 
        y: ey, 
        emoji: type.emoji,
        hp: scaledHp, 
        maxHp: scaledHp,
        speed: scaledSpeed,
        damage: type.damage,
        radius: type.radius
      });
    }
    
    // Update enemies
    for (const e of this.enemies) {
      const ex = this.player.x - e.x;
      const ey = this.player.y - e.y;
      const dist = Math.hypot(ex, ey);
      if (dist > 0) {
        e.x += (ex/dist) * e.speed * dt;
        e.y += (ey/dist) * e.speed * dt;
      }
      // Collision with player
      if (dist < this.player.radius + e.radius) {
        if (this.player.invulnTimer <= 0) {
          this.player.hp -= e.damage;
          this.player.invulnTimer = 0.5;
          this.floatingTexts.push({ x: this.player.x, y: this.player.y - 20, text: `-${e.damage}`, life: 0.8, vy: -20, color: 'red' });
          if (this.player.hp <= 0) this.triggerGameOver();
        }
      }
    }
    
    // Update weapons
    for (const w of this.player.weapons) {
      w.cooldownTimer -= dt;
      if (w.cooldownTimer <= 0) {
        this.fireWeapon(w);
      }
    }
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity !== undefined) p.vy += p.gravity * dt;
      p.life -= dt;
      
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }
      
      // Collision with enemies
      for (const e of this.enemies) {
        if (!p.hitEnemies.has(e.id) && Math.hypot(e.x - p.x, e.y - p.y) < p.radius + e.radius) {
          this.damageEnemy(e, p.damage);
          p.hitEnemies.add(e.id);
          if (p.hitEnemies.size > p.pierce) {
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
    
    // Update Gems (Magnet)
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const dist = Math.hypot(g.x - this.player.x, g.y - this.player.y);
      if (dist < this.player.pickupRange) {
        const speed = 400 * (1 - dist / this.player.pickupRange) + 100;
        g.x += ((this.player.x - g.x) / dist) * speed * dt;
        g.y += ((this.player.y - g.y) / dist) * speed * dt;
        if (dist < this.player.radius) {
          this.addExp(g.exp);
          this.gems.splice(i, 1);
        }
      }
    }
    
    // Update Effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      this.effects[i].life -= dt;
      if (this.effects[i].life <= 0) this.effects.splice(i, 1);
    }
    
    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }
  
  fireWeapon(w: Weapon) {
    const p = this.player;
    if (w.id === 'wand') {
      w.cooldownTimer = Math.max(0.4, 1.5 - w.level * 0.1);
      let nearest = null;
      let minDist = Infinity;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < minDist) { minDist = d; nearest = e; }
      }
      if (nearest) {
        const numProj = Math.floor(1 + w.level / 3);
        for (let i = 0; i < numProj; i++) {
          const spread = i === 0 ? 0 : (Math.random() - 0.5) * 0.6;
          const angle = Math.atan2(nearest.y - p.y, nearest.x - p.x) + spread;
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(angle) * 350, vy: Math.sin(angle) * 350,
            life: 2, damage: (15 + w.level * 3) * p.damageMult, radius: 10, emoji: '✨', pierce: 0, hitEnemies: new Set()
          });
        }
      }
    } else if (w.id === 'garlic') {
      w.cooldownTimer = Math.max(0.5, 1.1 - w.level * 0.05);
      const range = 40 + w.level * 10;
      const damage = (4 + w.level * 1.5) * p.damageMult;
      this.effects.push({ x: p.x, y: p.y, radius: range, life: 0.3, type: 'garlic' });
      for (const e of this.enemies) {
        if (Math.hypot(e.x - p.x, e.y - p.y) <= range + e.radius) {
          this.damageEnemy(e, damage);
        }
      }
    } else if (w.id === 'knife') {
      w.cooldownTimer = Math.max(0.2, 0.85 - w.level * 0.06);
      const angle = Math.atan2(p.lastDirY, p.lastDirX);
      const knifeCount = Math.floor(1 + (w.level - 1) / 3);
      for (let i = 0; i < knifeCount; i++) {
        const spreadAngle = angle + (i - (knifeCount - 1) / 2) * 0.15;
        this.projectiles.push({
          x: p.x, y: p.y, vx: Math.cos(spreadAngle) * 450, vy: Math.sin(spreadAngle) * 450,
          life: 1.5, damage: (8 + w.level * 1.5) * p.damageMult, radius: 12, emoji: '🔪', pierce: Infinity, hitEnemies: new Set()
        });
      }
    } else if (w.id === 'lightning') {
      w.cooldownTimer = Math.max(0.6, 2.0 - w.level * 0.12);
      const damage = (8 + w.level * 3.5) * p.damageMult;
      const bounces = w.level + 1;
      
      let currentTarget = null;
      let minDist = Infinity;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < minDist) { minDist = d; currentTarget = e; }
      }

      if (currentTarget) {
        let hitCount = 0;
        let source = { x: p.x, y: p.y };
        let alreadyHit = new Set<number>();
        
        while (currentTarget && hitCount < bounces) {
          this.damageEnemy(currentTarget, damage);
          alreadyHit.add(currentTarget.id);
          this.effects.push({ x: source.x, y: source.y, targetX: currentTarget.x, targetY: currentTarget.y, life: 0.3, type: 'lightning' });
          hitCount++;
          
          source = { x: currentTarget.x, y: currentTarget.y };
          
          let nextTarget = null;
          let nextMinDist = Infinity;
          for (const e of this.enemies) {
            if (alreadyHit.has(e.id)) continue;
            const d = Math.hypot(e.x - source.x, e.y - source.y);
            if (d < 200 && d < nextMinDist) { nextMinDist = d; nextTarget = e; }
          }
          currentTarget = nextTarget;
        }
      }
    } else if (w.id === 'axe') {
      w.cooldownTimer = Math.max(0.8, 1.9 - w.level * 0.1);
      const count = w.level; // Exactly Level count of axes
      const baseDamage = (10 + w.level * 2) * p.damageMult; // Lower damage
      
      for (let i = 0; i < count; i++) {
        // Base direction: up, influenced by player movement
        const moveBonusX = p.lastDirX * 150;
        const moveBonusY = Math.min(0, p.lastDirY * 100);
        
        // Randomize upward arc
        const vx = moveBonusX + (Math.random() - 0.5) * 250;
        const vy = -380 + moveBonusY + (Math.random() - 0.5) * 120;
        
        this.projectiles.push({
          x: p.x, y: p.y, vx: vx, vy: vy,
          life: 3.0, damage: baseDamage, radius: 15, emoji: '🪓', pierce: Infinity, hitEnemies: new Set(),
          gravity: 450, rotSpeed: 8 * (Math.random() > 0.5 ? 1 : -1) // Slow rotation
        });
      }
    }
  }
  
  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.player;
    
    // Offsets to keep player in center
    const ox = w / 2 - p.x;
    const oy = h / 2 - p.y;
    
    // Clear background
    ctx.fillStyle = '#18181b'; // zinc-900
    ctx.fillRect(0, 0, w, h);
    
    // Draw Grid
    const gridSize = 100;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const startX = (ox % gridSize) - gridSize;
    const startY = (oy % gridSize) - gridSize;
    for (let x = startX; x < w; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = startY; y < h; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw Gems
    ctx.font = '16px Arial';
    for (const g of this.gems) {
      ctx.fillText('💎', Math.floor(g.x + ox), Math.floor(g.y + oy));
    }
    
    // Draw Effects
    for (const ef of this.effects) {
      if (ef.type === 'garlic') {
        const maxLife = 0.3;
        const progress = 1 - (ef.life / maxLife);
        const currentRadius = ef.radius! * progress;
        ctx.strokeStyle = `rgba(255, 255, 100, ${ef.life * 3})`;
        ctx.lineWidth = 8 * (1 - progress);
        ctx.beginPath();
        ctx.arc(ef.x + ox, ef.y + oy, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ef.type === 'lightning') {
        ctx.strokeStyle = `rgba(100, 200, 255, ${ef.life * 3.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ef.x + ox, ef.y + oy);
        
        // Add some jitter to lightning
        if (ef.targetX !== undefined && ef.targetY !== undefined) {
          const midX = (ef.x + ef.targetX) / 2 + (Math.random() - 0.5) * 30;
          const midY = (ef.y + ef.targetY) / 2 + (Math.random() - 0.5) * 30;
          ctx.lineTo(midX + ox, midY + oy);
          ctx.lineTo(ef.targetX + ox, ef.targetY + oy);
        }
        
        ctx.stroke();
      }
    }
    
    // Draw Enemies
    ctx.fillStyle = 'white';
    for (const e of this.enemies) {
      ctx.font = `${e.radius * 2}px Arial`;
      ctx.fillText(e.emoji, Math.floor(e.x + ox), Math.floor(e.y + oy));
    }
    
    // Draw Projectiles
    for (const proj of this.projectiles) {
      ctx.font = `${proj.radius * 2}px Arial`;
      ctx.save();
      ctx.translate(proj.x + ox, proj.y + oy);
      if (proj.emoji === '🔪') {
        ctx.rotate(this.time * 20); // Fast rotation for knife
      } else if (proj.emoji === '🪓') {
        const rotSpeed = proj.rotSpeed || 10;
        ctx.rotate(this.time * rotSpeed);
      }
      ctx.fillText(proj.emoji, 0, 0);
      ctx.restore();
    }
    
    // Draw Player
    ctx.font = '32px Arial';
    ctx.globalAlpha = p.invulnTimer > 0 && Math.floor(this.time * 10) % 2 === 0 ? 0.5 : 1.0;
    ctx.fillText(p.emoji, Math.floor(p.x + ox), Math.floor(p.y + oy));
    ctx.globalAlpha = 1.0;
    
    // Player HP Bar (World space)
    const hpx = p.x + ox - 20;
    const hpy = p.y + oy + 25;
    ctx.fillStyle = '#ef4444'; ctx.fillRect(hpx, hpy, 40, 6);
    ctx.fillStyle = '#22c55e'; ctx.fillRect(hpx, hpy, 40 * (Math.max(0, p.hp) / p.maxHp), 6);
    
    // Draw Floating Text
    ctx.font = 'bold 16px sans-serif';
    for (const ft of this.floatingTexts) {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.min(1, ft.life * 2);
      ctx.fillText(ft.text, Math.floor(ft.x + ox), Math.floor(ft.y + oy));
    }
    ctx.globalAlpha = 1.0;
    
    // --- Overlay UI ---
    // XP Bar
    ctx.fillStyle = '#333'; ctx.fillRect(0, 0, w, 12);
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(0, 0, w * (p.xp / p.xpToNext), 12);
    
    // Top Info Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right'; ctx.fillText(`等級 ${p.level}`, w - 20, 36);
    
    const mins = Math.floor(this.time / 60);
    const secs = Math.floor(this.time % 60).toString().padStart(2, '0');
    ctx.textAlign = 'center'; ctx.fillText(`${mins}:${secs}`, w / 2, 36);
    
    ctx.textAlign = 'left'; ctx.fillText(`💀 ${this.stats.kills}`, 20, 36);
  }
}
