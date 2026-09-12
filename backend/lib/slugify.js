const COMBINING_ACCENTS = new RegExp('[\\u0300-\\u036f]', 'g');

// "l’ensemble Diva 🍂" -> "lensemble-diva", "Blouse plissée" -> "blouse-plissee"
const slugify = (text) =>
    String(text || '')
        .normalize('NFKD')
        .replace(COMBINING_ACCENTS, '')
        .replace(/['’]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

module.exports = { slugify };
