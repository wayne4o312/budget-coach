export type SceneId =
  | 'breakfast'
  | 'coffee'
  | 'commute'
  | 'lunch'
  | 'dinner'
  | 'bedtime';

export type SceneTemplate = {
  id: SceneId;
  title: string;
  icon: 'utensils' | 'coffee' | 'train' | 'notebook-pen';
  defaultCategory: string;
  suggestedAmounts: number[];
};

export const DEFAULT_SCENES: SceneTemplate[] = [
  {
    id: 'breakfast',
    title: '早餐',
    icon: 'utensils',
    defaultCategory: '餐饮',
    suggestedAmounts: [8, 12, 18, 25],
  },
  {
    id: 'coffee',
    title: '咖啡/奶茶',
    icon: 'coffee',
    defaultCategory: '餐饮',
    suggestedAmounts: [12, 18, 25, 35],
  },
  {
    id: 'commute',
    title: '通勤',
    icon: 'train',
    defaultCategory: '交通',
    suggestedAmounts: [2, 4, 6, 10],
  },
  {
    id: 'lunch',
    title: '午饭',
    icon: 'utensils',
    defaultCategory: '餐饮',
    suggestedAmounts: [15, 25, 35, 50],
  },
  {
    id: 'dinner',
    title: '晚饭',
    icon: 'utensils',
    defaultCategory: '餐饮',
    suggestedAmounts: [20, 35, 50, 80],
  },
  {
    id: 'bedtime',
    title: '睡前补记',
    icon: 'notebook-pen',
    defaultCategory: '其他',
    suggestedAmounts: [10, 20, 50, 100],
  },
];

