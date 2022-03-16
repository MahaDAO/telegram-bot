const Web3 = require('web3');
const TelegramBot = require('node-telegram-bot-api');
// const twitter = require('twitter-lite');
require('dotenv').config();
// const rp = require('request-promise');
const ethers = require('ethers');
const troveManagerAbi = require('../../abi/TroveManager.json')
const format = require('../../utils/formatValues')
const constants = require('../../utils/constants')
const fn = require('../../utils/fn')

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

// For Redeem and Liquidate
const maticTroveMContracts = [process.env.Matic_TroveM_Weth, process.env.Matic_TroveM_Wdai, process.env.Matic_TroveM_Wmatic]
const bscTroveContracts = [process.env.Bsc_TroveM_Maha, process.env.Bsc_TroveM_Wbnb, process.env.Bsc_TroveM_Wbusd]

// For Redeem and Liquidate
const troveManage = () => {

  const web3MaticMain = new Web3(`${process.env.MAINNET_MATIC}`)
  const web3BscMain = new Web3(`${process.env.MAINNET_BSC}`)

  for(let i = 0; i < maticTroveMContracts.length - 1; i++){
    new web3MaticMain.eth.Contract(troveManagerAbi, maticTroveMContracts[i]).events.allEvents()
      .on('connected', nr => console.log('connected', 'matic-trove', maticTroveMContracts[i]))
      .on('data', event => {
        console.log('troveManagerContract', event)

        let msgTemplate = 'Hello Investors'
        if(event.event == 'TroveLiquidated'){
          // console.log('TroveLiquidated', event)

          msgTemplate=`${format.toDisplayNumber(event.returnValues._coll)} MAHA has been liquidated with the debt of ${format.toDisplayNumber(event.returnValues._debt)} Arth.`

          bot.sendMessage(
            process.env.CHAT_ID,
            fn.botMessage(msgTemplate, 'matic', event.transactionHash),
            { parse_mode: "Markdown" }
          )
        }if(event.event == 'Redemption'){
          // console.log('Redemption', event)

          msgTemplate = `${format.toDisplayNumber(event.returnValues._actualLUSDAmount)} ARTH has been redeemed for ${format.toDisplayNumber(event.returnValues._ETHSent)} MAHA`

          bot.sendMessage(
            process.env.CHAT_ID,
            fn.botMessage(msgTemplate, 'matic', event.transactionHash),
            { parse_mode: "Markdown" }
          )
        }
      })
      .on('error', err => console.log('error matic-trove', err))
  }

  for(let i = 0; i < bscTroveContracts.length - 1; i++){
    new web3BscMain.eth.Contract(troveManagerAbi, bscTroveContracts[i]).events.allEvents()
      .on('connected', nr => console.log('bsc-trove', bscTroveContracts[i]))
      .on('data', event => {
        console.log('troveManagerContract', event)

        let msgTemplate = 'Hello Investors'
        if(event.event == 'TroveLiquidated'){
          // console.log('TroveLiquidated', event)

          msgTemplate=`${format.toDisplayNumber(event.returnValues._coll)} MAHA has been liquidated with the debt of ${format.toDisplayNumber(event.returnValues._debt)} Arth.`

          bot.sendMessage(
            process.env.CHAT_ID,
            botMessage(msgTemplate, 'bsc', event.transactionHash),
            { parse_mode: "Markdown" }
          )
        }if(event.event == 'Redemption'){
          // console.log('Redemption', event)

          msgTemplate = `${format.toDisplayNumber(event.returnValues._actualLUSDAmount)} ARTH has been redeemed for ${format.toDisplayNumber(event.returnValues._ETHSent)} MAHA`

          bot.sendMessage(
            process.env.CHAT_ID,
            botMessage(msgTemplate, 'bsc', event.transactionHash),
            { parse_mode: "Markdown" }
          )
        }
      })
      .on('error', err => console.log('error bsc-trove', err))
  }
}

troveManage()
