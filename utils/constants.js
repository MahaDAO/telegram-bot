const rp = require('request-promise');

const getMahaPrice = async() => {
  let mahaToUsdPrice = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=usd`);
  let mahaToUsd = Number(JSON.parse(mahaToUsdPrice)['mahadao']['usd']).toPrecision(4)

  return mahaToUsd
}

const getEthToMahaPrice = async() => {
  let mahaToEthPrice = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=eth`);
  let ethToMaha = Number(1 / JSON.parse(mahaToEthPrice)['mahadao']['eth']).toPrecision(6)

  return ethToMaha
}

module.exports = {
  getMahaPrice,
  getEthToMahaPrice,
}

