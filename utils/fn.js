const constants = require('./constants')

const botMessage = async(msg, chain, txHash) => {

  let chainLink = ''
  if(chain == 'matic' || chain == 'Polygon Mainnet'){
    chainLink = 'https://polygonscan.com'
    mahaToken = '0xedd6ca8a4202d4a36611e2fff109648c4863ae19'
  }
  if(chain == 'bsc' || chain == 'BSC Mainnet'){
    chainLink = 'https://bscscan.com/'
    mahaToken = '0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b'
  }

  let msgToReturn = `
  ${msg}

  *1 MAHA* = *$${await constants.getMahaPrice()}*
  *1 ETH* = *${await constants.getEthToMahaPrice()} MAHA*

  [MahaDAO](${chainLink}/token/${mahaToken}) *|* [📶 Tx Hash 📶 ](${chainLink}/tx/${txHash})
  `

  return msgToReturn
}

const farmingBotMsg = async(msg, chain, txHash, value, operation) => {
  let chainLink = ''
  let tvl = ''
  let apr = ''

  let tvlApr = await constants.tvlAprFn()

  if(chain == 'Polygon Mainnet'){
    chainLink = 'https://polygonscan.com'
    mahaToken = '0xedd6ca8a4202d4a36611e2fff109648c4863ae19'
    tvl = tvlApr.polygon.tvl
    apr = tvlApr.polygon.apr
  }
  if(chain == 'BSC Mainnet'){
    chainLink = 'https://bscscan.com'
    mahaToken = '0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b'
    tvl = tvlApr.bsc.tvl
    apr = tvlApr.bsc.apr
  }

  let noOfTotalDots = Math.ceil(value / 0.01)
  let dots = ''
  for(let i = 0; i < noOfTotalDots; i++){
    if(operation == 'Staked')
      dots = '🟢 '  + dots;
    else if(operation === 'Withdrawn')
      dots = '🔴 '  + dots;
    else dots = '🟢 '  + dots;
  }

  console.log('dots',noOfTotalDots, dots, dots)

  let msgToReturn = `
${msg}

${dots}

  *1 MAHA* = *$${await constants.getMahaPrice()}*
  *1 ARTH* = *$${await constants.getArthToUSD()}*
  *1 ARTH/MAHA LP Token = $1.00*

  TVL in this pool: *$${tvl}*
  New APR: *${apr}%*

  [📶 Transaction Hash 📶 ](${chainLink}/tx/${txHash})
  `

  return msgToReturn
}

module.exports = {
  botMessage,
  farmingBotMsg
}

