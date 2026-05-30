export const SOCIAL_LINKS = {
    instagram: 'https://instagram.com/anhangaviagens',
    facebook: 'https://facebook.com/profile.php?id=61585422494271',
};

export const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' as const },
    }),
};
