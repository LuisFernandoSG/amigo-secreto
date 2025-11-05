const ASIN_REGEX = /(?:dp|gp\/product|ASIN)\/(\w{10})/i;

export const extractAsin = (url) => {
  const match = url.match(ASIN_REGEX);
  return match ? match[1] : null;
};

console.log('ASIN_REGEX', ASIN_REGEX);  

export const buildAmazonImageFromAsin = (asin) => {
  if (!asin) return null;
  return `https://m.media-amazon.com/images/I/${asin}._SL500_.jpg`;
};

export const buildAmazonSearchUrl = (query) => {
  const trimmed = String(query || '').trim();
  if (!trimmed) return 'https://www.amazon.com/';
  return `https://www.amazon.com/s?k=${encodeURIComponent(trimmed)}`;
};