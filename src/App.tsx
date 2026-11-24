import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap,
  Gem,
  Shield,
  Sword,
  Cpu,
  User,
  Home,
  ShoppingBag,
  ArrowUpCircle,
  Sparkles,
  Battery,
  Activity,
  Award,
  RotateCcw,
  Check,
  Lock,
  TrendingUp,
  Layers,
  Crosshair,
  Gauge,
} from 'lucide-react';

// ==========================================
// 1. ТИПЫ ДАННЫХ (types/game.ts)
// ==========================================

export type TabType =
  | 'home'
  | 'character'
  | 'equipment'
  | 'upgrades'
  | 'profile';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type SlotType = 'head' | 'body' | 'weapon' | 'core' | 'implant';

export interface ItemBonuses {
  power?: number;
  speed?: number;
  defense?: number;
  energyCapacity?: number;
  production?: number;
  clickPower?: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: SlotType;
  rarity: Rarity;
  description: string;
  bonuses: ItemBonuses;
}

export type UpgradeId =
  | 'production'
  | 'clickPower'
  | 'energyCapacity'
  | 'characterPower';

export interface UpgradeConfig {
  id: UpgradeId;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  bonusPerLevel: number;
  statLabel: string;
}

export interface GameState {
  nickname: string;
  energy: number;
  totalEnergyEarned: number;
  gems: number;
  xp: number;
  level: number;
  reputation: number;
  upgradeLevels: Record<UpgradeId, number>;
  equipped: Record<SlotType, string | null>;
  inventoryIds: string[];
  lastSavedAt: number;
}

export interface CalculatedStats {
  power: number;
  speed: number;
  defense: number;
  energyCapacity: number;
  production: number;
  clickPower: number;
}

// ==========================================
// 2. MOCK-ДАННЫЕ И КОНФИГУРАЦИЯ (data/mockData.ts)
// ==========================================

export const RARITY_CONFIG: Record<
  Rarity,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  common: {
    label: 'Обычный',
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.35)',
    glow: 'none',
  },
  rare: {
    label: 'Редкий',
    color: '#00D9FF',
    bg: 'rgba(0, 217, 255, 0.12)',
    border: 'rgba(0, 217, 255, 0.45)',
    glow: '0 0 12px rgba(0, 217, 255, 0.25)',
  },
  epic: {
    label: 'Эпический',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.14)',
    border: 'rgba(168, 85, 247, 0.5)',
    glow: '0 0 15px rgba(168, 85, 247, 0.3)',
  },
  legendary: {
    label: 'Легендарный',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.55)',
    glow: '0 0 18px rgba(245, 158, 11, 0.35)',
  },
};

export const SLOT_LABELS: Record<SlotType, string> = {
  head: 'Голова',
  body: 'Броня',
  weapon: 'Оружие',
  core: 'Ядро',
  implant: 'Имплант',
};

export const UPGRADE_CONFIGS: UpgradeConfig[] = [
  {
    id: 'production',
    name: 'Генерация энергии',
    description: 'Увеличивает пассивный синтез энергии в секунду.',
    baseCost: 25,
    costMultiplier: 1.45,
    bonusPerLevel: 2,
    statLabel: '+2 ЭН/сек',
  },
  {
    id: 'clickPower',
    name: 'Сила клика',
    description: 'Усиливает ручной импульс извлечения при каждом нажатии.',
    baseCost: 20,
    costMultiplier: 1.5,
    bonusPerLevel: 2,
    statLabel: '+2 за клик',
  },
  {
    id: 'energyCapacity',
    name: 'Ёмкость аккумулятора',
    description: 'Расширяет максимальный объём хранилища энергии.',
    baseCost: 40,
    costMultiplier: 1.4,
    bonusPerLevel: 150,
    statLabel: '+150 макс. ЭН',
  },
  {
    id: 'characterPower',
    name: 'Мощность оперативника',
    description: 'Повышает боевую мощь и тактические показатели экзокостюма.',
    baseCost: 50,
    costMultiplier: 1.55,
    bonusPerLevel: 8,
    statLabel: '+8 Силы',
  },
];
export const MOCK_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'head_visor_01',
    name: 'Визор «Скаут Mk-I»',
    slot: 'head',
    rarity: 'common',
    description: 'Базовый тактический монокуляр с подсветкой контуров.',
    bonuses: { speed: 4, clickPower: 1 },
  },
  {
    id: 'head_neural_02',
    name: 'Нейрошлем «Кироши»',
    slot: 'head',
    rarity: 'epic',
    description: 'Предиктивный интерфейс наведения, ускоряющий реакцию.',
    bonuses: { speed: 14, power: 10, clickPower: 4 },
  },
  {
    id: 'body_jacket_01',
    name: 'Синтекожаная куртка',
    slot: 'body',
    rarity: 'common',
    description: 'Лёгкая кевларовая подкладка для защиты от осколков.',
    bonuses: { defense: 6, energyCapacity: 50 },
  },
  {
    id: 'body_exo_02',
    name: 'Экзокаркас «Призрак»',
    slot: 'body',
    rarity: 'rare',
    description: 'Композитная броня со встроенными конденсаторами.',
    bonuses: { defense: 18, energyCapacity: 200, power: 6 },
  },
  {
    id: 'weapon_blade_01',
    name: 'Виброклинок «Игла»',
    slot: 'weapon',
    rarity: 'rare',
    description: 'Высокочастотное лезвие, прорезающее лёгкую броню.',
    bonuses: { power: 15, speed: 6 },
  },
  {
    id: 'weapon_rail_02',
    name: 'Рельсотрон «Валькирия»',
    slot: 'weapon',
    rarity: 'legendary',
    description: 'Экспериментальный ускоритель с плазменным сердечником.',
    bonuses: { power: 42, clickPower: 8, speed: 10 },
  },
  {
    id: 'core_cell_01',
    name: 'Ячейка «Изотоп-4»',
    slot: 'core',
    rarity: 'common',
    description: 'Стандартный микрореактор для поддержания систем.',
    bonuses: { production: 3, energyCapacity: 100 },
  },
  {
    id: 'core_singularity_02',
    name: 'Ядро «Сингулярность»',
    slot: 'core',
    rarity: 'legendary',
    description: 'Квантовый генератор нулевой точки с колоссальной отдачей.',
    bonuses: { production: 18, energyCapacity: 600, power: 15 },
  },
  {
    id: 'implant_reflex_01',
    name: 'Бустер рефлексов',
    slot: 'implant',
    rarity: 'rare',
    description: 'Спинальный ускоритель синаптической проводимости.',
    bonuses: { speed: 12, clickPower: 3 },
  },
  {
    id: 'implant_overdrive_02',
    name: 'Чип «Овердрайв X9»',
    slot: 'implant',
    rarity: 'epic',
    description: 'Снимает ограничители с энергоканалов оперативника.',
    bonuses: { production: 9, power: 16, defense: 8 },
  },
];

export const INITIAL_GAME_STATE: GameState = {
  nickname: 'КиберРаннер_01',
  energy: 120,
  totalEnergyEarned: 120,
  gems: 15,
  xp: 35,
  level: 1,
  reputation: 140,
  upgradeLevels: {
    production: 1,
    clickPower: 1,
    energyCapacity: 1,
    characterPower: 1,
  },
  equipped: {
    head: 'head_visor_01',
    body: 'body_jacket_01',
    weapon: 'weapon_blade_01',
    core: 'core_cell_01',
    implant: null,
  },
  inventoryIds: MOCK_EQUIPMENT.map((item) => item.id),
  lastSavedAt: Date.now(),
};

// ==========================================
// 3. ИГРОВАЯ ЛОГИКА И ФОРМУЛЫ (utils/gameLogic.ts)
// ==========================================

export function formatNumber(num: number): string {
  if (num < 1000) return Math.floor(num).toString();
  if (num < 1_000_000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (num < 1_000_000_000)
    return `${(num / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  return `${(num / 1_000_000_000).toFixed(2)}B`;
}

export function getXpForNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.35, level - 1));
}

export function getUpgradeCost(
  config: UpgradeConfig,
  currentLevel: number
): number {
  return Math.floor(
    config.baseCost * Math.pow(config.costMultiplier, currentLevel - 1)
  );
}

export function calculateStats(state: GameState): CalculatedStats {
  const basePower = 15 + (state.level - 1) * 4;
  const baseSpeed = 12 + (state.level - 1) * 2;
  const baseDefense = 10 + (state.level - 1) * 3;
  const baseCapacity = 250;
  const baseProduction = 1;
  const baseClick = 2;
  const prodUpgrade = (state.upgradeLevels.production - 1) * 2;
  const clickUpgrade = (state.upgradeLevels.clickPower - 1) * 2;
  const capUpgrade = (state.upgradeLevels.energyCapacity - 1) * 150;
  const powerUpgrade = (state.upgradeLevels.characterPower - 1) * 8;

  let equipPower = 0;
  let equipSpeed = 0;
  let equipDefense = 0;
  let equipCapacity = 0;
  let equipProduction = 0;
  let equipClick = 0;

  Object.values(state.equipped).forEach((itemId) => {
    if (!itemId) return;
    const item = MOCK_EQUIPMENT.find((eq) => eq.id === itemId);
    if (!item) return;
    equipPower += item.bonuses.power || 0;
    equipSpeed += item.bonuses.speed || 0;
    equipDefense += item.bonuses.defense || 0;
    equipCapacity += item.bonuses.energyCapacity || 0;
    equipProduction += item.bonuses.production || 0;
    equipClick += item.bonuses.clickPower || 0;
  });

  return {
    power: basePower + powerUpgrade + equipPower,
    speed: baseSpeed + equipSpeed,
    defense: baseDefense + equipDefense,
    energyCapacity: baseCapacity + capUpgrade + equipCapacity,
    production: baseProduction + prodUpgrade + equipProduction,
    clickPower: baseClick + clickUpgrade + equipClick,
  };
}

// ==========================================
// 4. TELEGRAM MINI APPS SDK ХЕЛПЕР
// ==========================================

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        initDataUnsafe?: {
          user?: {
            first_name?: string;
            username?: string;
          };
        };
        HapticFeedback?: {
          impactOccurred: (
            style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
          ) => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
      };
    };
  }
}

function triggerHaptic(type: 'light' | 'medium' | 'success' = 'light') {
  try {
    const hf = window.Telegram?.WebApp?.HapticFeedback;
    if (!hf) return;
    if (type === 'success') {
      hf.notificationOccurred('success');
    } else {
      hf.impactOccurred(type);
    }
  } catch {
    // Игнорируем вне среды Telegram
  }
}

// ==========================================
// 5. КОМПОНЕНТЫ ИНТЕРФЕЙСА
// ==========================================

const CyberOperative: React.FC<{ isPulsing: boolean; level: number }> = ({
  isPulsing,
  level,
}) => {
  return (
    <div className={`operative-wrapper ${isPulsing ? 'pulse-hit' : ''}`}>
      <div className="operative-aura" />
      <svg
        viewBox="0 0 240 280"
        className="operative-svg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="armorGrad"
            x1="40"
            y1="30"
            x2="200"
            y2="250"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#080B12" />
          </linearGradient>
          <linearGradient id="neonCyan" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
          <linearGradient id="neonPurple" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <filter id="glowCyan" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowPurple" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Голографический круг на фоне */}
        <circle
          cx="120"
          cy="135"
          r="94"
          stroke="url(#neonCyan)"
          strokeWidth="1"
          strokeDasharray="8 6"
          opacity="0.35"
          className="spin-slow"
        />
        <circle
          cx="120"
          cy="135"
          r="76"
          stroke="url(#neonPurple)"
          strokeWidth="1.5"
          strokeDasharray="24 12"
          opacity="0.4"
          className="spin-reverse"
        />

        {/* Наплечники */}
        <path
          d="M52 108 L80 94 L85 135 L46 142 Z"
          fill="url(#armorGrad)"
          stroke="#00D9FF"
          strokeWidth="1.5"
        />
        <path
          d="M188 108 L160 94 L155 135 L194 142 Z"
          fill="url(#armorGrad)"
          stroke="#00D9FF"
          strokeWidth="1.5"
        />
        <line
          x1="54"
          y1="118"
          x2="77"
          y2="108"
          stroke="#A855F7"
          strokeWidth="2"
          filter="url(#glowPurple)"
        />
        <line
          x1="186"
          y1="118"
          x2="163"
          y2="108"
          stroke="#A855F7"
          strokeWidth="2"
          filter="url(#glowPurple)"
        />

        {/* Торс и бронепластины */}
        <path
          d="M78 96 L162 96 L172 175 L146 235 L94 235 L68 175 Z"
          fill="url(#armorGrad)"
          stroke="#334155"
          strokeWidth="2"
        />
        <path
          d="M84 104 L156 104 L150 158 L120 174 L90 158 Z"
          fill="#111827"
          stroke="#00D9FF"
          strokeWidth="1.2"
          opacity="0.9"
        />

        {/* Энергетическое ядро в груди */}
        <polygon
          points="120,116 135,131 120,146 105,131"
          fill="#080B12"
          stroke="#00D9FF"
          strokeWidth="2"
          filter="url(#glowCyan)"
        />
        <circle
          cx="120"
          cy="131"
          r="6"
          fill="#22D3EE"
          filter="url(#glowCyan)"
          className="core-beat"
        />

        {/* Энергоканалы торса */}
        <path
          d="M95 168 L112 182 L112 222"
          stroke="#00D9FF"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <path
          d="M145 168 L128 182 L128 222"
          stroke="#00D9FF"
          strokeWidth="1.5"
          opacity="0.7"
        />

        {/* Шея и воротник */}
        <path
          d="M96 86 L144 86 L152 100 L88 100 Z"
          fill="#0F172A"
          stroke="#A855F7"
          strokeWidth="1.5"
        />

        {/* Шлем оперативника */}
        <path
          d="M88 52 C88 30, 152 30, 152 52 L156 80 L138 94 L102 94 L84 80 Z"
          fill="url(#armorGrad)"
          stroke="#00D9FF"
          strokeWidth="1.8"
        />
        {/* Неоновый визор */}
        <path
          d="M92 60 L148 60 L143 74 L126 71 L120 75 L114 71 L97 74 Z"
          fill="#00D9FF"
          fillOpacity="0.88"
          filter="url(#glowCyan)"
        />
        {/* Антенны связи */}
        <line
          x1="86"
          y1="56"
          x2="80"
          y2="32"
          stroke="#A855F7"
          strokeWidth="2"
        />
        <circle
          cx="80"
          cy="30"
          r="2.5"
          fill="#A855F7"
          filter="url(#glowPurple)"
        />
        <line
          x1="154"
          y1="56"
          x2="160"
          y2="32"
          stroke="#A855F7"
          strokeWidth="2"
        />
        <circle
          cx="160"
          cy="30"
          r="2.5"
          fill="#A855F7"
          filter="url(#glowPurple)"
        />

        {/* Плазменный клинок в правой руке */}
        <path
          d="M46 144 L36 205 L44 252 L52 205 L56 144 Z"
          fill="url(#neonPurple)"
          opacity="0.85"
          filter="url(#glowPurple)"
        />
        <line
          x1="44"
          y1="155"
          x2="44"
          y2="244"
          stroke="#F8FAFC"
          strokeWidth="1.5"
          opacity="0.9"
        />
      </svg>

      <div className="operative-tag">
        <span>ОПЕРАТИВНИК // УР.{level}</span>
      </div>
    </div>
  );
};

// ==========================================
// 6. ГЛАВНОЕ ПРИЛОЖЕНИЕ (App.tsx)
// ==========================================

const STORAGE_KEY = 'rival_tma_save_v1';

interface FloatingGain {
  id: number;
  amount: number;
  x: number;
  y: number;
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<
    SlotType | 'all'
  >('all');
  const [isHarvestAnimating, setIsHarvestAnimating] = useState(false);
  const [floatingGains, setFloatingGains] = useState<FloatingGain[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const nextFloatingId = useRef(1);

  // Загрузка состояния из localStorage + интеграция с Telegram SDK
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameState;
        return { ...INITIAL_GAME_STATE, ...parsed };
      }
    } catch {
      // Fallback на стартовые данные
    }
    return INITIAL_GAME_STATE;
  });

  // Инициализация Telegram Mini App
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.('#080B12');
      tg.setBackgroundColor?.('#080B12');

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser && (tgUser.username || tgUser.first_name)) {
        setGameState((prev) => ({
          ...prev,
          nickname: tgUser.username
            ? `@${tgUser.username}`
            : tgUser.first_name || prev.nickname,
        }));
      }
    }
  }, []);

  // Сохранение в localStorage при каждом изменении
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...gameState, lastSavedAt: Date.now() })
      );
    } catch {
      // Игнорируем переполнение хранилища
    }
  }, [gameState]);

  const stats = useMemo(() => calculateStats(gameState), [gameState]);
  const xpRequired = useMemo(
    () => getXpForNextLevel(gameState.level),
    [gameState.level]
  );
  const xpPercent = Math.min(
    100,
    Math.round((gameState.xp / xpRequired) * 100)
  );
  const energyPercent = Math.min(
    100,
    Math.round((gameState.energy / stats.energyCapacity) * 100)
  );

  // Пассивная добыча энергии (раз в секунду)
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState((prev) => {
        const currentStats = calculateStats(prev);
        if (prev.energy >= currentStats.energyCapacity) return prev;

        const gain = Math.min(
          currentStats.production,
          currentStats.energyCapacity - prev.energy
        );
        if (gain <= 0) return prev;

        return {
          ...prev,
          energy: prev.energy + gain,
          totalEnergyEarned: prev.totalEnergyEarned + gain,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Ручная добыча энергии по нажатию
  const handleHarvest = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHaptic('light');
    setIsHarvestAnimating(true);
    setTimeout(() => setIsHarvestAnimating(false), 180);

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const clickY = e.clientY ? e.clientY - rect.top : 10;

    const gainAmount = stats.clickPower;
    const id = nextFloatingId.current++;

    setFloatingGains((prev) => [
      ...prev.slice(-6),
      { id, amount: gainAmount, x: clickX, y: clickY },
    ]);
    setTimeout(() => {
      setFloatingGains((prev) => prev.filter((item) => item.id !== id));
    }, 850);

    setGameState((prev) => {
      const currentStats = calculateStats(prev);
      const actualEnergyGain = Math.min(
        currentStats.clickPower,
        Math.max(0, currentStats.energyCapacity - prev.energy)
      );

      let newXp = prev.xp + 4;
      let newLevel = prev.level;
      let newReputation = prev.reputation + 1;
      let req = getXpForNextLevel(newLevel);

      while (newXp >= req) {
        newXp -= req;
        newLevel += 1;
        newReputation += 25;
        req = getXpForNextLevel(newLevel);
      }
      return {
        ...prev,
        energy: prev.energy + actualEnergyGain,
        totalEnergyEarned: prev.totalEnergyEarned + actualEnergyGain,
        xp: newXp,
        level: newLevel,
        reputation: newReputation,
      };
    });
  };

  // Покупка улучшения
  const handleBuyUpgrade = (config: UpgradeConfig) => {
    const currentLvl = gameState.upgradeLevels[config.id];
    const cost = getUpgradeCost(config, currentLvl);
    if (gameState.energy < cost) return;

    triggerHaptic('success');

    setGameState((prev) => {
      const lvl = prev.upgradeLevels[config.id];
      const price = getUpgradeCost(config, lvl);
      if (prev.energy < price) return prev;

      let newXp = prev.xp + 15;
      let newLevel = prev.level;
      let req = getXpForNextLevel(newLevel);
      while (newXp >= req) {
        newXp -= req;
        newLevel += 1;
        req = getXpForNextLevel(newLevel);
      }

      return {
        ...prev,
        energy: prev.energy - price,
        xp: newXp,
        level: newLevel,
        reputation: prev.reputation + 10,
        upgradeLevels: {
          ...prev.upgradeLevels,
          [config.id]: lvl + 1,
        },
      };
    });
  };

  // Экипировка / снятие предмета
  const handleToggleEquip = (item: EquipmentItem) => {
    triggerHaptic('medium');
    setGameState((prev) => {
      const isCurrentlyEquipped = prev.equipped[item.slot] === item.id;
      return {
        ...prev,
        equipped: {
          ...prev.equipped,
          [item.slot]: isCurrentlyEquipped ? null : item.id,
        },
      };
    });
  };

  // Сброс прогресса
  const handleResetProgress = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    triggerHaptic('success');
    localStorage.removeItem(STORAGE_KEY);
    setGameState(INITIAL_GAME_STATE);
    setConfirmReset(false);
  };

  const totalUpgradesCount = Object.values(gameState.upgradeLevels).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="rival-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@600;700;800;900&display=swap');

        * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        body {
          margin: 0;
          padding: 0;
          background-color: #080B12;
          color: #F8FAFC;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }

        .rival-app {
          min-height: 100vh;
          max-width: 480px;
          margin: 0 auto;
          background:
            radial-gradient(circle at 50% 0%, rgba(0, 217, 255, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.1) 0%, transparent 40%),
            #080B12;
          display: flex;
          flex-direction: column;
          position: relative;
          padding-bottom: 84px;
        }

        .font-cyber {
          font-family: 'Orbitron', sans-serif;
          letter-spacing: 0.06em;
        }

        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 10px;
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(8, 11, 18, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 217, 255, 0.14);
        }

        .brand-title {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: 20px;
          letter-spacing: 0.14em;
          background: linear-gradient(90deg, #00D9FF 0%, #22D3EE 50%, #A855F7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 20px rgba(0, 217, 255, 0.35);
        }

        .level-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(168, 85, 247, 0.16);
          border: 1px solid rgba(168, 85, 247, 0.45);
          color: #E9D5FF;
          font-size: 12px;
          font-weight: 700;
        }

        .currency-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 12px 16px 6px;
        }

        .currency-card {
          background: rgba(17, 24, 39, 0.72);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }

        .currency-card.energy {
          border-color: rgba(0, 217, 255, 0.3);
          box-shadow: inset 0 0 18px rgba(0, 217, 255, 0.06);
        }

        .currency-card.gems {
          border-color: rgba(168, 85, 247, 0.3);
          box-shadow: inset 0 0 18px rgba(168, 85, 247, 0.06);
        }

        .currency-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .currency-icon.energy {
          background: rgba(0, 217, 255, 0.14);
          color: #00D9FF;
          box-shadow: 0 0 12px rgba(0, 217, 255, 0.25);
        }

        .currency-icon.gems {
          background: rgba(168, 85, 247, 0.16);
          color: #A855F7;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.25);
        }

        .progress-section {
          padding: 6px 16px;
        }

        .progress-card {
          background: rgba(17, 24, 39, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 10px 12px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94A3B8;
          margin-bottom: 6px;
          font-weight: 600;
        }

        .progress-track {
          width: 100%;
          height: 6px;
          background: rgba(8, 11, 18, 0.9);
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill-xp {
          height: 100%;
          background: linear-gradient(90deg, #A855F7, #00D9FF);
          border-radius: 999px;
          transition: width 0.25s ease;
          box-shadow: 0 0 10px rgba(0, 217, 255, 0.5);
        }

        .progress-fill-energy {
          height: 100%;
          background: linear-gradient(90deg, #00D9FF, #22D3EE);
          border-radius: 999px;
          transition: width 0.2s ease;
        }

        .hero-stage {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          position: relative;
        }

        .passive-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.85);
          border: 1px solid rgba(34, 211, 238, 0.35);
          font-size: 12px;
          color: #22D3EE;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          margin-bottom: 6px;
        }

        .operative-wrapper {
          position: relative;
          width: 220px;
          height: 245px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .operative-wrapper.pulse-hit {
          transform: scale(0.95);
        }

        .operative-aura {
          position: absolute;
          width: 170px;
          height: 170px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 217, 255, 0.22) 0%, rgba(168, 85, 247, 0.08) 55%, transparent 75%);
          filter: blur(10px);
          pointer-events: none;
        }

        .operative-svg {
          width: 210px;
          height: 240px;
          z-index: 2;
          filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.65));
        }

        .operative-tag {
          position: absolute;
          bottom: 4px;
          z-index: 3;
          background: rgba(8, 11, 18, 0.9);
          border: 1px solid rgba(0, 217, 255, 0.4);
          padding: 3px 10px;
          border-radius: 6px;
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #00D9FF;
        }

        .harvest-btn-wrap {
          width: 100%;
          padding: 8px 16px 14px;
          position: relative;
        }

        .harvest-btn {
          width: 100%;
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid #00D9FF;
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.22) 0%, rgba(168, 85, 247, 0.24) 100%);
          color: #F8FAFC;
          font-family: 'Orbitron', sans-serif;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.08em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow:
            0 0 24px rgba(0, 217, 255, 0.28),
            inset 0 0 16px rgba(0, 217, 255, 0.18);
          transition: transform 0.1s ease, box-shadow 0.15s ease;
          position: relative;
          overflow: hidden;
        }

        .harvest-btn:active {
          transform: scale(0.97);
          box-shadow: 0 0 32px rgba(0, 217, 255, 0.5);
        }

        .floating-gain {
          position: absolute;
          pointer-events: none;
          font-family: 'Orbitron', sans-serif;
          font-weight: 800;
          font-size: 15px;
          color: #22D3EE;
          text-shadow: 0 0 10px rgba(0, 217, 255, 0.85);
          animation: floatUp 0.85s ease-out forwards;
          z-index: 30;
        }

        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translate(-50%, 0) scale(0.95);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -56px) scale(1.15);
          }
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .spin-slow {
          transform-origin: 120px 135px;
          animation: spinSlow 24s linear infinite;
        }

        .spin-reverse {
          transform-origin: 120px 135px;
          animation: spinReverse 18s linear infinite;
        }

        .screen-container {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #F8FAFC;
          letter-spacing: 0.08em;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .glass-panel {
          background: rgba(17, 24, 39, 0.72);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 14px;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .stat-card {
          background: rgba(17, 24, 39, 0.78);
          border: 1px solid rgba(0, 217, 255, 0.16);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }

        .slot-box {
          background: rgba(17, 24, 39, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .slot-box.active {
          border-color: #00D9FF;
          background: rgba(0, 217, 255, 0.12);
        }

        .filter-pills {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .filter-pill {
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94A3B8;
          cursor: pointer;
        }

        .filter-pill.active {
          background: rgba(0, 217, 255, 0.18);
          border-color: #00D9FF;
          color: #F8FAFC;
        }

        .action-btn {
          padding: 9px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #00D9FF;
          background: rgba(0, 217, 255, 0.16);
          color: #00D9FF;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .action-btn:active:not(:disabled) {
          transform: scale(0.96);
        }

        .action-btn.equipped {
          border-color: #A855F7;
          background: rgba(168, 85, 247, 0.2);
          color: #E9D5FF;
        }

        .action-btn:disabled {
          opacity: 0.4;
          border-color: rgba(148, 163, 184, 0.3);
          background: rgba(15, 23, 42, 0.6);
          color: #64748B;
          cursor: not-allowed;
        }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          background: rgba(8, 11, 18, 0.94);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(0, 217, 255, 0.2);
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          padding: 8px 4px 12px;
          z-index: 40;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: none;
          border: none;
          color: #64748B;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 0;
          transition: color 0.15s ease;
        }

        .nav-item.active {
          color: #00D9FF;
        }

        .nav-icon-box {
          padding: 5px 12px;
          border-radius: 10px;
          transition: all 0.15s ease;
        }

        .nav-item.active .nav-icon-box {
          background: rgba(0, 217, 255, 0.14);
          box-shadow: 0 0 12px rgba(0, 217, 255, 0.25);
        }
      `}</style>

      <header className="top-bar">
        <div
          style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}
        >
          <div className="brand-title">RIVAL</div>
          <div
            style={{
              fontSize: 10,
              color: '#94A3B8',
              marginTop: 2,
              letterSpacing: '0.04em',
            }}
          >
            made by xyn
          </div>
        </div>
        <div className="level-pill">
          <Sparkles size={13} color="#A855F7" />
          <span>Ур. {gameState.level}</span>
        </div>
      </header>

      <div className="currency-row">
        <div className="currency-card energy">
          <div className="currency-icon energy">
            <Zap size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
              ЭНЕРГИЯ
            </div>
            <div
              className="font-cyber"
              style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}
            >
              {formatNumber(gameState.energy)}
              <span style={{ fontSize: 10, color: '#64748B' }}>
                /{formatNumber(stats.energyCapacity)}
              </span>
            </div>
          </div>
        </div>

        <div className="currency-card gems">
          <div className="currency-icon gems">
            <Gem size={18} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
              ГЕМЫ
            </div>
            <div
              className="font-cyber"
              style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}
            >
              {formatNumber(gameState.gems)}
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'home' && (
        <>
          <div className="progress-section">
            <div className="progress-card">
              <div className="progress-header">
                <span>ПРОГРЕСС УРОВНЯ {gameState.level}</span>
                <span style={{ color: '#22D3EE' }}>
                  {gameState.xp} / {xpRequired} XP ({xpPercent}%)
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill-xp"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>

          <main className="hero-stage">
            <div className="passive-badge">
              <Activity size={14} />
              <span>
                Производство: +{formatNumber(stats.production)} ЭН/сек
              </span>
            </div>

            <CyberOperative
              isPulsing={isHarvestAnimating}
              level={gameState.level}
            />

            <div style={{ width: '100%', maxWidth: 260, marginTop: 8 }}>
              <div className="progress-header" style={{ marginBottom: 4 }}>
                <span>Заряд аккумулятора</span>
                <span>{energyPercent}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill-energy"
                  style={{ width: `${energyPercent}%` }}
                />
              </div>
            </div>
          </main>

          <div className="harvest-btn-wrap">
            {floatingGains.map((fg) => (
              <div
                key={fg.id}
                className="floating-gain"
                style={{ left: `${fg.x}px`, top: `${fg.y - 12}px` }}
              >
                +{fg.amount} ЭН
              </div>
            ))}

            <button className="harvest-btn" onClick={handleHarvest}>
              <Zap size={20} fill="#00D9FF" />
              <span>ДОБЫТЬ ЭНЕРГИЮ (+{stats.clickPower})</span>
            </button>
          </div>
        </>
      )}

      {activeTab === 'character' && (
        <div className="screen-container">
          <div className="section-title">
            <span>ХАРАКТЕРИСТИКИ</span>
            <span style={{ fontSize: 12, color: '#00D9FF' }}>
              УРОВЕНЬ {gameState.level}
            </span>
          </div>

          <div
            className="glass-panel"
            style={{ display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'rgba(0, 217, 255, 0.1)',
                border: '1px solid rgba(0, 217, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Cpu size={32} color="#00D9FF" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {gameState.nickname}
              </div>
              <div className="progress-header" style={{ marginBottom: 4 }}>
                <span>Опыт (XP)</span>
                <span>
                  {gameState.xp} / {xpRequired}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill-xp"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
          <div className="stat-grid">
            <div className="stat-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#94A3B8',
                  fontSize: 12,
                }}
              >
                <Sword size={15} color="#A855F7" />
                <span>Сила</span>
              </div>
              <div
                className="font-cyber"
                style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}
              >
                {stats.power}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Боевая эффективность
              </div>
            </div>

            <div className="stat-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#94A3B8',
                  fontSize: 12,
                }}
              >
                <Gauge size={15} color="#00D9FF" />
                <span>Скорость</span>
              </div>
              <div
                className="font-cyber"
                style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}
              >
                {stats.speed}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Реакция и маневренность
              </div>
            </div>

            <div className="stat-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#94A3B8',
                  fontSize: 12,
                }}
              >
                <Shield size={15} color="#22D3EE" />
                <span>Защита</span>
              </div>
              <div
                className="font-cyber"
                style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}
              >
                {stats.defense}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Сопротивление урону
              </div>
            </div>

            <div className="stat-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#94A3B8',
                  fontSize: 12,
                }}
              >
                <Battery size={15} color="#00D9FF" />
                <span>Ёмкость энергии</span>
              </div>
              <div
                className="font-cyber"
                style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC' }}
              >
                {formatNumber(stats.energyCapacity)}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Лимит аккумулятора
              </div>
            </div>

            <div className="stat-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#94A3B8',
                  fontSize: 12,
                }}
              >
                <Activity size={15} color="#22D3EE" />
                <span>Производство</span>
              </div>
              <div
                className="font-cyber"
                style={{ fontSize: 20, fontWeight: 800, color: '#22D3EE' }}
              >
                +{stats.production}/с
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Пассивный синтез
              </div>
            </div>

            <div className="stat-card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#94A3B8',
                  fontSize: 12,
                }}
              >
                <Crosshair size={15} color="#A855F7" />
                <span>Сила клика</span>
              </div>
              <div
                className="font-cyber"
                style={{ fontSize: 20, fontWeight: 800, color: '#A855F7' }}
              >
                +{stats.clickPower}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Ручная добыча ЭН
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="screen-container">
          <div className="section-title">
            <span>СНАРЯЖЕНИЕ</span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>5 СЛОТОВ</span>
          </div>

          <div className="slots-grid">
            {(Object.keys(SLOT_LABELS) as SlotType[]).map((slot) => {
              const equippedId = gameState.equipped[slot];
              const equippedItem = MOCK_EQUIPMENT.find(
                (i) => i.id === equippedId
              );
              const rarityStyle = equippedItem
                ? RARITY_CONFIG[equippedItem.rarity]
                : null;

              return (
                <div
                  key={slot}
                  className={`slot-box ${
                    selectedSlotFilter === slot ? 'active' : ''
                  }`}
                  style={
                    rarityStyle
                      ? {
                          borderColor: rarityStyle.border,
                          boxShadow: rarityStyle.glow,
                        }
                      : undefined
                  }
                  onClick={() =>
                    setSelectedSlotFilter((prev) =>
                      prev === slot ? 'all' : slot
                    )
                  }
                >
                  <span
                    style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700 }}
                  >
                    {SLOT_LABELS[slot].toUpperCase()}
                  </span>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: rarityStyle
                        ? rarityStyle.bg
                        : 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: rarityStyle ? rarityStyle.color : '#475569',
                    }}
                  >
                    <Layers size={15} />
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      color: rarityStyle ? rarityStyle.color : '#475569',
                      fontWeight: 600,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {equippedItem ? equippedItem.name.split(' ')[0] : 'Пусто'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="filter-pills">
            <button
              className={`filter-pill ${
                selectedSlotFilter === 'all' ? 'active' : ''
              }`}
              onClick={() => setSelectedSlotFilter('all')}
            >
              Все ({MOCK_EQUIPMENT.length})
            </button>
            {(Object.keys(SLOT_LABELS) as SlotType[]).map((slot) => (
              <button
                key={slot}
                className={`filter-pill ${
                  selectedSlotFilter === slot ? 'active' : ''
                }`}
                onClick={() => setSelectedSlotFilter(slot)}
              >
                {SLOT_LABELS[slot]}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MOCK_EQUIPMENT.filter(
              (item) =>
                selectedSlotFilter === 'all' || item.slot === selectedSlotFilter
            ).map((item) => {
              const r = RARITY_CONFIG[item.rarity];
              const isEquipped = gameState.equipped[item.slot] === item.id;

              return (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    borderColor: isEquipped ? '#00D9FF' : r.border,
                    boxShadow: isEquipped
                      ? '0 0 16px rgba(0, 217, 255, 0.2)'
                      : r.glow,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 6,
                            background: r.bg,
                            color: r.color,
                            border: `1px solid ${r.border}`,
                          }}
                        >
                          {r.label}
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                          • {SLOT_LABELS[item.slot]}
                        </span>
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: '#F8FAFC',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}
                      >
                        {item.description}
                      </div>
                    </div>

                    <button
                      className={`action-btn ${isEquipped ? 'equipped' : ''}`}
                      onClick={() => handleToggleEquip(item)}
                    >
                      {isEquipped ? (
                        <>
                          <Check size={14} />
                          <span>Надето</span>
                        </>
                      ) : (
                        <span>Надеть</span>
                      )}
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      marginTop: 10,
                    }}
                  >
                    {item.bonuses.power && (
                      <span
                        className="filter-pill"
                        style={{ color: '#E2E8F0', fontSize: 11 }}
                      >
                        +{item.bonuses.power} Сила
                      </span>
                    )}
                    {item.bonuses.speed && (
                      <span
                        className="filter-pill"
                        style={{ color: '#E2E8F0', fontSize: 11 }}
                      >
                        +{item.bonuses.speed} Скорость
                      </span>
                    )}
                    {item.bonuses.defense && (
                      <span
                        className="filter-pill"
                        style={{ color: '#E2E8F0', fontSize: 11 }}
                      >
                        +{item.bonuses.defense} Защита
                      </span>
                    )}
                    {item.bonuses.energyCapacity && (
                      <span
                        className="filter-pill"
                        style={{ color: '#22D3EE', fontSize: 11 }}
                      >
                        +{item.bonuses.energyCapacity} Ёмкость
                      </span>
                    )}
                    {item.bonuses.production && (
                      <span
                        className="filter-pill"
                        style={{ color: '#22D3EE', fontSize: 11 }}
                      >
                        +{item.bonuses.production} ЭН/с
                      </span>
                    )}
                    {item.bonuses.clickPower && (
                      <span
                        className="filter-pill"
                        style={{ color: '#A855F7', fontSize: 11 }}
                      >
                        +{item.bonuses.clickPower} Клик
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'upgrades' && (
        <div className="screen-container">
          <div className="section-title">
            <span>УЛУЧШЕНИЯ СИСТЕМ</span>
            <span style={{ fontSize: 11, color: '#22D3EE' }}>
              ВСЕГО УР.: {totalUpgradesCount}
            </span>
          </div>

          {UPGRADE_CONFIGS.map((cfg) => {
            const currentLvl = gameState.upgradeLevels[cfg.id];
            const cost = getUpgradeCost(cfg, currentLvl);
            const canAfford = gameState.energy >= cost;

            return (
              <div
                key={cfg.id}
                className="glass-panel"
                style={{
                  borderColor: canAfford
                    ? 'rgba(0, 217, 255, 0.35)'
                    : 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <TrendingUp size={17} color="#00D9FF" />
                    <span style={{ fontWeight: 700, fontSize: 15 }}>
                      {cfg.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 8,
                      background: 'rgba(168, 85, 247, 0.16)',
                      color: '#D8B4FE',
                    }}
                  >
                    Ур. {currentLvl}
                  </span>
                </div>

                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: 12,
                    color: '#94A3B8',
                    lineHeight: 1.4,
                  }}
                >
                  {cfg.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{ fontSize: 12, color: '#22D3EE', fontWeight: 600 }}
                  >
                    Бонус: {cfg.statLabel}
                  </div>

                  <button
                    className="action-btn"
                    disabled={!canAfford}
                    onClick={() => handleBuyUpgrade(cfg)}
                  >
                    {canAfford ? <Zap size={14} /> : <Lock size={13} />}
                    <span>Улучшить • {formatNumber(cost)} ЭН</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="screen-container">
          <div className="section-title">
            <span>ПРОФИЛЬ ОПЕРАТИВНИКА</span>
            <span style={{ fontSize: 11, color: '#A855F7' }}>ID #8492</span>
          </div>

          <div
            className="glass-panel"
            style={{ display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00D9FF, #A855F7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: 900,
                fontSize: 20,
                color: '#080B12',
              }}
            >
              {gameState.nickname.replace('@', '').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>
                {gameState.nickname}
              </div>
              <div style={{ fontSize: 12, color: '#22D3EE', marginTop: 2 }}>
                Кибер-наёмник • Уровень {gameState.level}
              </div>
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat-card">
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                Всего добыто Энергии
              </div>
              <div
                className="font-cyber"
                style={{ fontSize: 18, fontWeight: 700, color: '#00D9FF' }}
              >
                {formatNumber(gameState.totalEnergyEarned)}
              </div>
            </div>

            <div className="stat-card">
              <div
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Award size={13} color="#A855F7" />
                <span>Репутация</span>
              </div>
              <div
                className="font-cyber"
                style={{ fontSize: 18, fontWeight: 700, color: '#A855F7' }}
              >
                {formatNumber(gameState.reputation)}
              </div>
            </div>

            <div className="stat-card">
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                Уровень улучшений
              </div>
              <div
                className="font-cyber"
                style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}
              >
                {totalUpgradesCount}
              </div>
            </div>

            <div className="stat-card">
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                Предметов в арсенале
              </div>
              <div
                className="font-cyber"
                style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}
              >
                {gameState.inventoryIds.length}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ marginTop: 4 }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>
              Прогресс автоматически сохраняется локально на устройстве.
            </div>
            <button
              className="action-btn"
              style={{
                width: '100%',
                borderColor: confirmReset
                  ? '#EF4444'
                  : 'rgba(239, 68, 68, 0.45)',
                background: confirmReset
                  ? 'rgba(239, 68, 68, 0.25)'
                  : 'rgba(239, 68, 68, 0.1)',
                color: '#FCA5A5',
              }}
              onClick={handleResetProgress}
            >
              <RotateCcw size={14} />
              <span>
                {confirmReset
                  ? 'Нажмите ещё раз для подтверждения'
                  : 'Сбросить тестовый прогресс'}
              </span>
            </button>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <div className="nav-icon-box">
            <Home size={19} />
          </div>
          <span>Главная</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'character' ? 'active' : ''}`}
          onClick={() => setActiveTab('character')}
        >
          <div className="nav-icon-box">
            <Cpu size={19} />
          </div>
          <span>Персонаж</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          <div className="nav-icon-box">
            <ShoppingBag size={19} />
          </div>
          <span>Снаряжение</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'upgrades' ? 'active' : ''}`}
          onClick={() => setActiveTab('upgrades')}
        >
          <div className="nav-icon-box">
            <ArrowUpCircle size={19} />
          </div>
          <span>Улучшения</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <div className="nav-icon-box">
            <User size={19} />
          </div>
          <span>Профиль</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
