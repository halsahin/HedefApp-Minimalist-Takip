export const CATEGORIES = [
    { label: 'Kişisel', icon: '🌱' },
    { label: 'Kariyer', icon: '💼' },
    { label: 'Sağlık', icon: '💪' },
    { label: 'Eğitim', icon: '📚' },
    { label: 'Finans', icon: '💰' },
    { label: 'İlişkiler', icon: '❤️' },
    { label: 'Hobi', icon: '🎨' },
    { label: 'Diğer', icon: '📌' },
];

export const CATEGORY_MAP = Object.fromEntries(
    CATEGORIES.map(c => [c.label, c.icon])
);
