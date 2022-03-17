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

const getArthToUSD = async() => {
  let arthToUsdPrice = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=arth&vs_currencies=usd`);
  let arthToUsd = Number(JSON.parse(arthToUsdPrice)['arth']['usd']).toPrecision(4)

  return arthToUsd

}

const tvlAprFn = async() => {
  const data = JSON.parse(await rp('https://api.arthcoin.com/apy/loans'))

  let tvlAprObj = {
    bsc: {
      tvl: data.chainSpecificData['56'].tvl.arthMaha.toLocaleString(),
      apr: data.chainSpecificData['56'].apr.arthMaha.toLocaleString()
    },
    polygon: {
      tvl: data.chainSpecificData['137'].tvl.arthMaha.toLocaleString(),
      apr: data.chainSpecificData['137'].apr.arthMaha.toLocaleString()
    }
  }
  return tvlAprObj
}

module.exports = {
  getMahaPrice,
  getEthToMahaPrice,
  getArthToUSD,
  tvlAprFn
}

