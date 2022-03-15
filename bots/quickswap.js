const Web3 = require('web3');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const quickSwapAbi = require('../abi/QuickSwap.json')

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

const quickSwap = () => {
  const web3QuickSwap = new Web3(`${process.env.MAINNET_MATIC}`)
  let parent = '0x34aAfA58894aFf03E137b63275aff64cA3552a3E'
  let contract = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'
  const contractQuickSwap = new web3QuickSwap.eth.Contract(quickSwapAbi, contract)

  // console.log('contractQuickSwap', contractQuickSwap.events);

  contractQuickSwap.events.allEvents()
    .on('connected', nr => console.log('connected'))
    .on('data', quickSwap => {
      // console.log('quickSwap', quickSwap)

      if(quickSwap.event == 'Swap'){

        console.log('quickSwap', quickSwap)
        // bot.sendMessage(
        //   process.env.CHAT_ID,
        //   'quickswap event',
        //   { parse_mode: "Markdown" }
        // );
      }

    })
    .on('changed', changed => console.log('changed', changed))
    .on('error', err => console.log('error', err))
}

quickSwap();
