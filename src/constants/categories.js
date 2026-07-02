export const CATEGORIES = [
    { key: 'personal',      label: 'Kişisel',   icon: 'user' },
    { key: 'career',        label: 'Kariyer',   icon: 'briefcase' },
    { key: 'health',        label: 'Sağlık',    icon: 'activity' },
    { key: 'education',     label: 'Eğitim',    icon: 'book-open' },
    { key: 'finance',       label: 'Finans',    icon: 'dollar-sign' },
    { key: 'relationships', label: 'İlişkiler', icon: 'users' },
    { key: 'hobby',         label: 'Hobi',      icon: 'feather' },
    { key: 'other',         label: 'Diğer',     icon: 'bookmark' },
];

// key → icon  (used in GoalCard, GoalDetailModal)
export const CATEGORY_ICON_MAP = Object.fromEntries(
    CATEGORIES.map(c => [c.key, c.icon])
);

// Turkish label → key  (used ONLY during AsyncStorage v1→v2 migration)
export const TURKISH_LABEL_TO_KEY = Object.fromEntries(
    CATEGORIES.map(c => [c.label, c.key])
);

// key → translated label  (used everywhere for display)
export function getCategoryLabel(key, t) {
    // Migration fallback: if stored value is a Turkish label, remap to key first
    if (TURKISH_LABEL_TO_KEY[key]) {
        return t(`cat.${TURKISH_LABEL_TO_KEY[key]}`);
    }
    return t(`cat.${key}`) ?? key;
}
