const _ = require('underscore');
const rp = require('request-promise');


/**
 * Get's the coin gecko's identifier coin-id for a coin from Coin Gecko API.
 * @param {string} coinSymbol
 */
const getCoinIdFromGecko = async (coinSymbol) => {
  const coinList = JSON.parse(await rp(
    `https://api.coingecko.com/api/v3/coins/list`
  ));

  const token = _.filter(coinList, (list) => list.symbol.toLowerCase() === coinSymbol.toLowerCase())

  if (token.length > 1) throw Error('There are more than 1 token with same symbol');

  return token[0].id;
}


/**
 * Get's the price in req. currency from Coin Gecko API.
 * @param {string} coinId
 * @param {string} currency
 */
const getPriceFromGecko = async (coinId = 'mahadao', currency = 'usd') => {
  try {
    const priceInJsonString = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,eth`);

    if (!priceInJsonString.includes(coinId)) return null;

    return JSON.parse(priceInJsonString)[coinId][currency];
  } catch (e) {
    return null;
  }
}


module.exports = {
  getCoinIdFromGecko,
  getPriceFromGecko
}
