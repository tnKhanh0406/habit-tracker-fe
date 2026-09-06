import {
  Bike,
  BookOpen,
  Brain,
  Coffee,
  Droplets,
  Dumbbell,
  HeartPulse,
  Languages,
  Moon,
  Music,
  PenTool,
  Sprout,
  Sun,
  Utensils,
} from 'lucide-vue-next'

export const HABIT_DIFFICULTIES = ['TRIVIAL', 'EASY', 'MEDIUM', 'HARD', 'EXTREME']

export const HABIT_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#22C55E',
  '#14B8A6',
  '#23A8F2',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#64748B',
]

export const HABIT_ICONS = [
  { key: 'dumbbell', label: 'Exercise', component: Dumbbell },
  { key: 'droplets', label: 'Water', component: Droplets },
  { key: 'book', label: 'Reading', component: BookOpen },
  { key: 'sprout', label: 'Meditation', component: Sprout },
  { key: 'languages', label: 'Language', component: Languages },
  { key: 'moon', label: 'Sleep', component: Moon },
  { key: 'brain', label: 'Focus', component: Brain },
  { key: 'heart-pulse', label: 'Health', component: HeartPulse },
  { key: 'bike', label: 'Bike', component: Bike },
  { key: 'music', label: 'Music', component: Music },
  { key: 'coffee', label: 'Routine', component: Coffee },
  { key: 'sun', label: 'Morning', component: Sun },
  { key: 'utensils', label: 'Meal', component: Utensils },
  { key: 'pen-tool', label: 'Writing', component: PenTool },
]

export const LEGACY_HABIT_ICON_MAP = {
  muscle: 'dumbbell',
  water: 'droplets',
  meditation: 'sprout',
  language: 'languages',
}
