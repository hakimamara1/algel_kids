const COMBINING_ACCENTS = new RegExp('[\\u0300-\\u036f]', 'g');

// "Prêt à expédier" -> "pretaexpedier", "ReadyToDispatch" -> "readytodispatch"
const normalizeWord = (text) =>
    String(text || '')
        .normalize('NFKD')
        .replace(COMBINING_ACCENTS, '')
        .toLowerCase()
        .replace(/[^a-z]/g, '');

module.exports = { normalizeWord };
