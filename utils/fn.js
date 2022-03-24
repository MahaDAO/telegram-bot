const { MessageEmbed } = require('discord.js');
const { hyperlink, hideLinkEmbed } = require('@discordjs/builders');

const constants = require('./constants')
const format = require('../utils/formatValues')

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

const farmingTelgramMsg = async(data, chain, lpTokenName, operation) => {
  let chainLink = ''
  let tvl = ''
  let apr = ''
  let msg = ''
  let poolLPVal = 0
  let poolLPName = lpTokenName
  let swapName

  let tvlApr = await constants.tvlAprFn()
  let lpPoolValObj = await constants.poolTokenVal()

  if(chain == 'Polygon Mainnet'){
    chainLink = 'https://polygonscan.com'
    mahaToken = '0xedd6ca8a4202d4a36611e2fff109648c4863ae19'
    tvl = tvlApr.polygon.tvl
    apr = tvlApr.polygon.apr
    swapName = 'QuickSwap'

    if(lpTokenName == 'ARTH.usd+3pool')
      poolLPVal = lpPoolValObj.arthUsdc3Polygon
    if(lpTokenName === 'ARTH/USDC LP')
      poolLPVal = lpPoolValObj.arthUsdcPolygon
    if(lpTokenName === 'ARTH/MAHA LP')
      poolLPVal = lpPoolValObj.arthMahaPolygon
  }
  if(chain == 'BSC Mainnet'){
    chainLink = 'https://bscscan.com'
    mahaToken = '0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b'
    tvl = tvlApr.bsc.tvl
    apr = tvlApr.bsc.apr
    swapName = 'PanCakeSwap'

    if(lpTokenName == 'ARTH.usd+3eps')
      poolLPVal = lpPoolValObj.arthUsdc3Bsc
    if(lpTokenName === 'ARTH/BUSD LP')
      poolLPVal = lpPoolValObj.arthBusdBsc
    if(lpTokenName === 'ARTH/MAHA LP')
      poolLPVal = lpPoolValObj.arthMahaBsc
  }

  let farmVal
  let farmingUser = data.returnValues.user
  let url = `${chainLink}/address/${farmingUser}`

  if(operation == 'Staked'){
    farmVal = format.toDisplayNumber(data.returnValues.amount)
    msg = `*${farmVal} ${poolLPName} ($${(farmVal * poolLPVal).toFixed(2)})* tokens has been staked on *QuickSwap MAHA/ARTH Staking Program* by [${farmingUser}](${url})}`
  }
  if(operation === 'Withdrawn'){
    farmVal = format.toDisplayNumber(data.returnValues.amount)
    msg = `*${farmVal} ${poolLPName} ($${(farmVal * poolLPVal).toFixed(2)})* tokens has been withdrawn from *QuickSwap MAHA/ARTH Staking Program* by [${farmingUser}](${url})`
  }
  if(operation == 'RewardPaid'){
    farmVal = format.toDisplayNumber(data.returnValues.reward)
    msg = `*${format.toDisplayNumber(data.returnValues.reward)} MAHA* tokens has been claimed as reward from *QuickSwap MAHA/ARTH Staking Program* by [${farmingUser}](${url})`
  }

  let noOfTotalDots = Math.ceil((farmVal * poolLPVal) / 100)
  let dots = ''
  for(let i = 0; i < noOfTotalDots; i++){
    if(operation == 'Staked' || operation == 'RewardPaid')
      dots = '🟢 '  + dots;
    else if(operation === 'Withdrawn')
      dots = '🔴 '  + dots;
    else dots = ''  + dots;
  }

  let msgToReturn = `
🚀  Farming is in swing...

${msg}

${
  dots.length ? dots : ''
}

*1 MAHA* = *$${await constants.getMahaPrice()}*
*1 ARTH* = *$${await constants.getArthToUSD()}*
*1 ${poolLPName} Token = $${poolLPVal.toFixed(2)}*

TVL in this pool: *$${tvl}*
New APR: *${apr}%*

[📶 Transaction Hash 📶 ](${chainLink}/tx/${data.transactionHash})
  `

  return msgToReturn

}

const farmingDiscordMsg = async (data, chain, lpTokenName, operation) => {
  let chainLink = ''
  let tvl = ''
  let apr = ''
  let msg = ''
  let poolLPVal = 0
  let poolLPName = lpTokenName
  let swapName

  let tvlApr = await constants.tvlAprFn()
  let lpPoolValObj = await constants.poolTokenVal()

  if(chain == 'Polygon Mainnet'){
    chainLink = 'https://polygonscan.com'
    mahaToken = '0xedd6ca8a4202d4a36611e2fff109648c4863ae19'
    tvl = tvlApr.polygon.tvl || 1
    apr = tvlApr.polygon.apr || 1
    swapName = 'QuickSwap'

    if(lpTokenName == 'ARTH.usd+3pool')
      poolLPVal = lpPoolValObj.arthUsdc3Polygon
    if(lpTokenName === 'ARTH/USDC LP')
      poolLPVal = lpPoolValObj.arthUsdcPolygon
    if(lpTokenName === 'ARTH/MAHA LP')
      poolLPVal = lpPoolValObj.arthMahaPolygon
  }
  if(chain == 'BSC Mainnet'){
    chainLink = 'https://bscscan.com'
    mahaToken = '0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b'
    tvl = tvlApr.bsc.tvl
    apr = tvlApr.bsc.apr
    swapName = 'PanCakeSwap'

    if(lpTokenName == 'ARTH.usd+3eps')
      poolLPVal = lpPoolValObj.arthUsdc3Bsc
    if(lpTokenName === 'ARTH/BUSD LP')
      poolLPVal = lpPoolValObj.arthBusdBsc
    if(lpTokenName === 'ARTH/MAHA LP')
      poolLPVal = lpPoolValObj.arthMahaBsc
  }

  let farmVal
  let farmingUser = data.returnValues.user
  let url = `${chainLink}/address/${farmingUser}`

  if(operation == 'Staked'){
    console.log('farmVal * poolLPVal', farmVal * poolLPVal, data.returnValues.amount)
    farmVal = format.toDisplayNumber(data.returnValues.amount)
    msg = `**${farmVal} ${poolLPName} ($${(farmVal * poolLPVal).toFixed(2)})** tokens has been staked on **${swapName} ${poolLPName} Staking Program** by ${hyperlink(`${farmingUser}`, url)}`
  }
  if(operation == 'Withdrawn'){
    farmVal = format.toDisplayNumber(data.returnValues.amount)
    msg = `**${farmVal} ${poolLPName} ($${(farmVal * poolLPVal).toFixed(2)})** tokens has been withdrawn from **${swapName} ${poolLPName} Staking Program** by ${hyperlink(`${farmingUser}`, url)}`
  }
  if(operation == 'RewardPaid'){
    farmVal = format.toDisplayNumber(data.returnValues.reward)
    msg = `**${format.toDisplayNumber(data.returnValues.reward)} MAHA** tokens has been claimed as reward from **${swapName} ${poolLPName} Staking Program** by ${hyperlink(`${farmingUser}`, url)}`
  }

  let noOfTotalDots = Math.ceil((farmVal * poolLPVal) / 100)
  let dots = ''
  for(let i = 0; i < noOfTotalDots; i++){
    if(operation == 'Staked' || operation == 'RewardPaid')
      dots = '🟢 '  + dots;
    else if(operation === 'Withdrawn')
      dots = '🔴 '  + dots;
    else dots = ''  + dots;
  }

  console.log('farmVal', farmVal, poolLPName)
  console.log('poolLPVal', poolLPVal, )
  console.log('dots',noOfTotalDots, dots)

  let msgToReturn = `
${msg}

${
  dots.length ? dots : ''
}

**1 MAHA** = **$${await constants.getMahaPrice()}**
**1 ARTH** = **$${await constants.getArthToUSD()}**
**1 ${poolLPName} Token = $${poolLPVal.toFixed(2)}**

TVL in this pool: **$${tvl}**
New APR: **${apr}%**

[📶 Transaction Hash 📶 ](${chainLink}/tx/${data.transactionHash})
    `

  const exampleEmbed = new MessageEmbed()
    .setColor('#F07D55')
    .setTitle('🚀  Farming is in swing...')
    .setDescription(msgToReturn)

    return exampleEmbed
}

module.exports = {
  botMessage,
  farmingTelgramMsg,
  farmingDiscordMsg
}

