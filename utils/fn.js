const Numeral = require('numeral');
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

const troveTelegramMsg = async(data, chain, poolName, operation) => {
  let chainLink = ''
  let tvl = ''
  let apr = ''
  let msg = ''
  let poolLPVal = 0
  let swapName

  let tvlApr = await constants.tvlAprFn()
  let lpPoolValObj = await constants.poolTokenVal()

  if(chain == 'Polygon Mainnet'){
    chainLink = 'https://polygonscan.com'
    mahaToken = '0xedd6ca8a4202d4a36611e2fff109648c4863ae19'
    tvl = tvlApr.polygon.tvl
    apr = tvlApr.polygon.apr
    swapName = 'QuickSwap'

    // if(poolName == 'Weth')
    //   poolLPVal = lpPoolValObj.arthUsdc3Polygon
    // if(poolName === 'Wdai')
    //   poolLPVal = lpPoolValObj.arthUsdcPolygon
    // if(poolName === 'Wmatic')
    //   poolLPVal = lpPoolValObj.arthMahaPolygon
  }
  if(chain == 'BSC Mainnet'){
    chainLink = 'https://bscscan.com'
    mahaToken = '0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b'
    tvl = tvlApr.bsc.tvl
    apr = tvlApr.bsc.apr
    swapName = 'PanCakeSwap'

    // if(poolName == 'Maha')
    //   poolLPVal = lpPoolValObj.arthUsdc3Bsc
    // if(poolName === 'Wbnb')
    //   poolLPVal = lpPoolValObj.arthBusdBsc
    // if(poolName === 'Wbusd')
    //   poolLPVal = lpPoolValObj.arthMahaBsc
  }

  let farmVal
  let farmingUser = data.returnValues.user
  let url = `${chainLink}/address/${farmingUser}`

  if(data.event == 'TroveLiquidated'){
    farmVal = format.toDisplayNumber(data.returnValues._coll)
    msg = `${farmVal} MAHA has been liquidated with the debt of ${format.toDisplayNumber(data.returnValues._debt)} Arth.`
  }
  if(data.event == 'Redemption'){
    farmVal = format.toDisplayNumber(data.returnValues._actualLUSDAmount)
    msg = `${farmVal} ARTH has been redeemed for ${format.toDisplayNumber(data.returnValues._ETHSent)} MAHA`
  }

  let noOfTotalDots = Math.ceil(farmVal / 100)
  let dots = ''
  for(let i = 0; i < noOfTotalDots; i++){
    if(operation == 'TroveLiquidated' || operation == 'Redemption')
      dots = '🟢 '  + dots;
    else dots = ''  + dots;
  }

  let msgToReturn = `
🚀  Arth Loan is in swing...

${msg}

${
  dots.length ? dots : ''
}

*1 MAHA* = *$${await constants.getMahaPrice()}*
*1 ARTH* = *$${await constants.getArthToUSD()}*

[📶 Transaction Hash 📶 ](${chainLink}/tx/${data.transactionHash})
  `

  return msgToReturn

}

const troveDiscordMsg = async(data, chain, poolName, operation) => {
  let chainLink = ''
  let tvl = ''
  let apr = ''
  let msg = ''
  let poolLPVal = 0
  let poolLPName = poolName
  let swapName

  let tvlApr = await constants.tvlAprFn()
  let lpPoolValObj = await constants.poolTokenVal()

  if(chain == 'Polygon Mainnet'){
    chainLink = 'https://polygonscan.com'
    mahaToken = '0xedd6ca8a4202d4a36611e2fff109648c4863ae19'
    tvl = tvlApr.polygon.tvl
    apr = tvlApr.polygon.apr
    swapName = 'QuickSwap'

    // if(poolName == 'Weth')
    //   poolLPVal = lpPoolValObj.arthUsdc3Polygon
    // if(poolName === 'Wdai')
    //   poolLPVal = lpPoolValObj.arthUsdcPolygon
    // if(poolName === 'Wmatic')
    //   poolLPVal = lpPoolValObj.arthMahaPolygon
  }
  if(chain == 'BSC Mainnet'){
    chainLink = 'https://bscscan.com'
    mahaToken = '0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b'
    tvl = tvlApr.bsc.tvl
    apr = tvlApr.bsc.apr
    swapName = 'PanCakeSwap'

    // if(poolName == 'Maha')
    //   poolLPVal = lpPoolValObj.arthUsdc3Bsc
    // if(poolName === 'Wbnb')
    //   poolLPVal = lpPoolValObj.arthBusdBsc
    // if(poolName === 'Wbusd')
    //   poolLPVal = lpPoolValObj.arthMahaBsc
  }

  let farmVal
  let farmingUser = data.returnValues.user
  let url = `${chainLink}/address/${farmingUser}`


  if(data.event == 'TroveLiquidated'){
    msg = `${format.toDisplayNumber(data.returnValues._coll)} MAHA has been liquidated with the debt of ${format.toDisplayNumber(data.returnValues._debt)} Arth.`
  }
  if(data.event == 'Redemption'){
    msg = `${format.toDisplayNumber(data.returnValues._actualLUSDAmount)} ARTH has been redeemed for ${format.toDisplayNumber(data.returnValues._ETHSent)} MAHA`
  }

  let noOfTotalDots = Math.ceil(farmVal / 100)
  let dots = ''
  for(let i = 0; i < noOfTotalDots; i++){
    if(operation == 'TroveLiquidated' || operation == 'Redemption')
      dots = '🟢 '  + dots;
    else dots = ''  + dots;
  }

  let msgToReturn = `
${msg}

${
  dots.length ? dots : ''
}

*1 MAHA* = *$${await constants.getMahaPrice()}*
*1 ARTH* = *$${await constants.getArthToUSD()}*

[📶 Transaction Hash 📶 ](${chainLink}/tx/${data.transactionHash})
  `

  const exampleEmbed = new MessageEmbed()
    .setColor('#F07D55')
    .setTitle('🚀  Arth Loan is in swing...')
    .setDescription(msgToReturn)

  return exampleEmbed


}

const borrowOpTelegramMsg = async(data, chain, collName) => {
  let chainLink = ''
  let tvl = ''
  let apr = ''
  let msg = ''
  let poolLPVal = 0
  let swapName

  let tvlApr = await constants.tvlAprFn()
  let lpPoolValObj = await constants.poolTokenVal()

  if(chain == 'Polygon Mainnet'){
    chainLink = 'https://polygonscan.com'
    mahaToken = '0xedd6ca8a4202d4a36611e2fff109648c4863ae19'
    tvl = tvlApr.polygon.tvl
    apr = tvlApr.polygon.apr
    swapName = 'QuickSwap'

    // if(poolName == 'Weth')
    //   poolLPVal = lpPoolValObj.arthUsdc3Polygon
    // if(poolName === 'Wdai')
    //   poolLPVal = lpPoolValObj.arthUsdcPolygon
    // if(poolName === 'Wmatic')
    //   poolLPVal = lpPoolValObj.arthMahaPolygon
  }
  if(chain == 'BSC Mainnet'){
    chainLink = 'https://bscscan.com'
    mahaToken = '0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b'
    tvl = tvlApr.bsc.tvl
    apr = tvlApr.bsc.apr
    swapName = 'PanCakeSwap'

    // if(poolName == 'Maha')
    //   poolLPVal = lpPoolValObj.arthUsdc3Bsc
    // if(poolName === 'Wbnb')
    //   poolLPVal = lpPoolValObj.arthBusdBsc
    // if(poolName === 'Wbusd')
    //   poolLPVal = lpPoolValObj.arthMahaBsc
  }

  let farmVal
  let farmingUser = data.returnValues.user
  let url = `${chainLink}/address/${farmingUser}`

  if(data.returnValues.operation == '0'){
    msg = `Loan of *${format.toDisplayNumber(data.returnValues._debt)}* Arth is taken by [${data.returnValues._borrower}](https://polygonscan.com/address/${data.returnValues._borrower}) with collateral of ${format.toDisplayNumber(data.returnValues._coll)} ${collName}.`
  }
  if(data.returnValues.operation == '1'){
    msg = `A Loan has been closed by [${data.returnValues._borrower}](https://polygonscan.com/address/${data.returnValues._borrower})`
  }
  if(data.returnValues.operation == '2'){
    msg = `A Loan has been modified by [${data.returnValues._borrower}](https://polygonscan.com/address/${data.returnValues._borrower})`
  }

  // let noOfTotalDots = Math.ceil(farmVal / 100)
  // let dots = ''
  // for(let i = 0; i < noOfTotalDots; i++){
  //   if(operation == 'TroveLiquidated' || operation == 'Redemption')
  //     dots = '🟢 '  + dots;
  //   else dots = ''  + dots;
  // }

  let msgToReturn = `
🚀  Arth Loan is in swing...

${msg}

*1 MAHA* = *$${await constants.getMahaPrice()}*
*1 ARTH* = *$${await constants.getArthToUSD()}*

[📶 Transaction Hash 📶 ](${chainLink}/tx/${data.transactionHash})
  `

  return msgToReturn

}

const borrowOpDiscordMsg = async(data, chain, collName) => {

  let chainLink = ''
  let tvl = ''
  let apr = ''
  let msg = ''
  let poolLPVal = 0
  let swapName

  let tvlApr = await constants.tvlAprFn()
  let lpPoolValObj = await constants.poolTokenVal()

  if(chain == 'Polygon Mainnet'){
    chainLink = 'https://polygonscan.com'
    mahaToken = '0xedd6ca8a4202d4a36611e2fff109648c4863ae19'
    tvl = tvlApr.polygon.tvl
    apr = tvlApr.polygon.apr
    swapName = 'QuickSwap'

    // if(poolName == 'Weth')
    //   poolLPVal = lpPoolValObj.arthUsdc3Polygon
    // if(poolName === 'Wdai')
    //   poolLPVal = lpPoolValObj.arthUsdcPolygon
    // if(poolName === 'Wmatic')
    //   poolLPVal = lpPoolValObj.arthMahaPolygon
  }
  if(chain == 'BSC Mainnet'){
    chainLink = 'https://bscscan.com'
    mahaToken = '0xCE86F7fcD3B40791F63B86C3ea3B8B355Ce2685b'
    tvl = tvlApr.bsc.tvl
    apr = tvlApr.bsc.apr
    swapName = 'PanCakeSwap'

    // if(poolName == 'Maha')
    //   poolLPVal = lpPoolValObj.arthUsdc3Bsc
    // if(poolName === 'Wbnb')
    //   poolLPVal = lpPoolValObj.arthBusdBsc
    // if(poolName === 'Wbusd')
    //   poolLPVal = lpPoolValObj.arthMahaBsc
  }

  let farmVal
  let farmingUser = data.returnValues.user
  let url = `${chainLink}/address/${farmingUser}`

  if(data.returnValues.operation == '0'){
    msg = `Loan of *${format.toDisplayNumber(data.returnValues._debt)}* Arth is taken by [${data.returnValues._borrower}](https://polygonscan.com/address/${data.returnValues._borrower}) with collateral of ${format.toDisplayNumber(data.returnValues._coll)} ${collName}.`
  }
  if(data.returnValues.operation == '1'){
    msg = `A Loan has been closed by [${data.returnValues._borrower}](https://polygonscan.com/address/${data.returnValues._borrower})`
  }
  if(data.returnValues.operation == '2'){
    msg = `A Loan has been modified by [${data.returnValues._borrower}](https://polygonscan.com/address/${data.returnValues._borrower})`
  }

  // let noOfTotalDots = Math.ceil(farmVal / 100)
  // let dots = ''
  // for(let i = 0; i < noOfTotalDots; i++){
  //   if(operation == 'TroveLiquidated' || operation == 'Redemption')
  //     dots = '🟢 '  + dots;
  //   else dots = ''  + dots;
  // }

  let msgToReturn = `
🚀  Arth Loan is in swing...

${msg}

*1 MAHA* = *$${await constants.getMahaPrice()}*
*1 ARTH* = *$${await constants.getArthToUSD()}*

[📶 Transaction Hash 📶 ](${chainLink}/tx/${data.transactionHash})
  `

  const exampleEmbed = new MessageEmbed()
    .setColor('#F07D55')
    .setTitle('🚀  Arth Loan is in swing...')
    .setDescription(msgToReturn)

  return exampleEmbed

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
    if(lpTokenName === 'ARTH/USDC LP') farmVal = format.toDisplayNumber(data.returnValues.amount * 1000000)
    else farmVal = format.toDisplayNumber(data.returnValues.amount)
    msg = `*${farmVal} ${poolLPName} ($${Numeral(farmVal * poolLPVal).format('0.000')})* tokens has been staked on **${swapName} ${poolLPName} Staking Program** by [${farmingUser}](${url})}`
  }
  if(operation === 'Withdrawn'){
    if(lpTokenName === 'ARTH/USDC LP') farmVal = format.toDisplayNumber(data.returnValues.amount * 1000000)
    else farmVal = format.toDisplayNumber(data.returnValues.amount)
    msg = `*${farmVal} ${poolLPName} ($${Numeral(farmVal * poolLPVal).format('0.000')})* tokens has been withdrawn from **${swapName} ${poolLPName} Staking Program** by [${farmingUser}](${url})`
  }
  if(operation == 'RewardPaid'){
    farmVal = format.toDisplayNumber(data.returnValues.reward)
    console.log('RewardPaid', farmVal, data.returnValues.reward)
    msg = `*${farmVal} MAHA* tokens has been claimed as reward from **${swapName} ${poolLPName} Staking Program** by [${farmingUser}](${url})`
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
*1 ${poolLPName} Token = $${Numeral(poolLPVal).format('0.000')}*

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
    if(lpTokenName === 'ARTH/USDC LP') farmVal = format.toDisplayNumber(data.returnValues.amount * 1000000)
    else farmVal = format.toDisplayNumber(data.returnValues.amount)
    msg = `**${farmVal} ${poolLPName} ($${Numeral(farmVal * poolLPVal).format('0.000')})** tokens has been staked on **${swapName} ${poolLPName} Staking Program** by ${hyperlink(`${farmingUser}`, url)}`
  }
  if(operation == 'Withdrawn'){
    if(lpTokenName === 'ARTH/USDC LP') farmVal = format.toDisplayNumber(data.returnValues.amount * 1000000)
    else farmVal = format.toDisplayNumber(data.returnValues.amount)
    msg = `**${farmVal} ${poolLPName} ($${Numeral(farmVal * poolLPVal).format('0.000')})** tokens has been withdrawn from **${swapName} ${poolLPName} Staking Program** by ${hyperlink(`${farmingUser}`, url)}`
  }
  if(operation == 'RewardPaid'){
    farmVal = format.toDisplayNumber(data.returnValues.reward)
    msg = `**${farmVal} MAHA** tokens has been claimed as reward from **${swapName} ${poolLPName} Staking Program** by ${hyperlink(`${farmingUser}`, url)}`
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
**1 ${poolLPName} Token = $${Numeral(poolLPVal).format('0.000')}**

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
  farmingDiscordMsg,
  troveTelegramMsg,
  troveDiscordMsg,
  borrowOpTelegramMsg,
  borrowOpDiscordMsg
}

