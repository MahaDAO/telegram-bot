const Web3 = require('web3')
// const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const farmingAbi = require('../../abi/BasicStaking.json')
const fn = require('../../utils/fn')
// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

const farming = () => {

  // Matic Mumbai
  const web3Test = new Web3(process.env.TESTNET_MATIC)
  const testStaking = new web3Test.eth.Contract(farmingAbi, `${process.env.MaticTest_MahaStaking}`)

  // console.log('testWMatic', testStaking.events)

  testStaking.events.Staked()
    .on('connected', nr => console.log('connected farming'))
    .on('data', data => {
      console.log('data', data)
    })
    .on('changed', changed => console.log('changed', changed))
    .on('error', err => console.log('error farming', err))

}

farming()
