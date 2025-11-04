const ASIN_REGEX = /(?:dp|gp\/product|ASIN)\/(\w{10})/i;

export const extractAsin = (url) => {
  const match = url.match(ASIN_REGEX);
  return match ? match[1] : null;
};

export const buildAmazonImageFromAsin = (asin) => {
  if (!asin) return null;
  return `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=_SL160_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=`;
};
