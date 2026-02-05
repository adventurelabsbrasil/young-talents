/**
 * Converte um link de compartilhamento do Google Drive para um link de visualização direta (UC).
 * Suporta formatos:
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/uc?id=FILE_ID
 */
export const photoDisplayUrl = (url) => {
    if (!url || typeof url !== 'string') return null;

    // Limpar espaços e extras
    const cleanUrl = url.trim();

    // Se já for um link de visualização direta corrigido, retorna ele
    if (cleanUrl.includes('drive.google.com/uc?export=view&id=')) return cleanUrl;

    const m = cleanUrl.match(/drive\.google\.com\/open\?id=([^&\s]+)/i) ||
        cleanUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/i) ||
        cleanUrl.match(/drive\.google\.com\/uc\?id=([^&\s]+)/i);

    if (m && m[1]) {
        return `https://drive.google.com/uc?export=view&id=${m[1]}`;
    }

    return cleanUrl;
};
