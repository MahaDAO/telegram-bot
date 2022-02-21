const Web3 = require('web3');
const TelegramBot = require('node-telegram-bot-api');
const twitter = require('twitter-lite');
require('dotenv').config();
const rp = require('request-promise');
const moment =  require('moment')

const config = require('./config');
const abi = require('./abi/VotingEscrow.json');
const { messageTypes } = require('node-telegram-bot-api/src/telegram');
const mahaImg = './MahaDAO.png'

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

const mahaXBot = async() => {

  const client = new twitter(config);

  // Polygon
  const web3 = new Web3(process.env.MAINNET_MATIC1)
  var mahaxContract = new web3.eth.Contract(abi, '0x8F2C37D2F8AE7Bce07aa79c768CC03AB0E5ae9aE');

  let mahaToUsdPrice = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=usd`);
  let mahaToEthPrice = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=eth`);

  mahaToUsdPrice = Number(JSON.parse(mahaToUsdPrice)['mahadao']['usd']).toPrecision(4)
  let ethToMahaPrice = Number(1 / JSON.parse(mahaToEthPrice)['mahadao']['eth']).toPrecision(6)

  mahaxContract.events.allEvents({address: '0x8F2C37D2F8AE7Bce07aa79c768CC03AB0E5ae9aE'}, function(error, event){ })
  .on('connected', nr => {console.log('connected', nr)})
  .on('data', (event) => {
    console.log('event', event);
    let msgTemplate = '';

    if(event.event == 'Deposit' ){
      if(event.returnValues.type == 1 || event.returnValues.type == 2){
        let noOfGreenDots = Math.ceil(Number(event.returnValues.value / 10**18) / 0.001)

        let greenDots = ''
        for(let i = 0; i < noOfGreenDots; i++){
          greenDots = '🟢 '  + greenDots;
        }

        msgTemplate = `
        🚀  *${event.returnValues.value / 10**18} MAHA* has been locked till *${moment(event.returnValues.locktime * 1000).format('DD MMM YYYY')}* by [${event.returnValues.provider}](https://polygonscan.com/address/${event.returnValues.provider})

${greenDots}

*1 MAHA* = *$${mahaToUsdPrice}*
*1 ETH* = *${ethToMahaPrice} MAHA*
[MahaDAO](https://polygonscan.com/token/0xedd6ca8a4202d4a36611e2fff109648c4863ae19) *|* [📶 Tx Hash 📶 ](https://polygonscan.com/tx/${event.transactionHash})
`
      }else if(event.returnValues.type == 3){
        msgTemplate = `
        🚀  The locking period is extended till *${moment(event.returnValues.locktime * 1000).format('DD MMM YYYY')}* by [${event.returnValues.provider}](https://polygonscan.com/address/${event.returnValues.provider})

*1 MAHA* = *$${mahaToUsdPrice}*
*1 ETH* = *${ethToMahaPrice} MAHA*
[MahaDAO](https://polygonscan.com/token/0xedd6ca8a4202d4a36611e2fff109648c4863ae19) *|* [📶 Tx Hash 📶 ](https://polygonscan.com/tx/${event.transactionHash})
        `
      }
      else{
        let noOfRedDots = Math.ceil(Number(event.returnValues.value / 10**18) / 0.001)

        let redDots = ''
        for(let i = 0; i < noOfRedDots; i++){
          redDots = '🔴 '  + redDots;
        }

        msgTemplate = `
        🚀  *${event.returnValues.value / 10**18} MAHA* has been withdrawn by [${event.returnValues.provider}](https://polygonscan.com/address/${event.returnValues.provider})

*1 MAHA* = *$${mahaToUsdPrice}*
*1 ETH* = *${ethToMahaPrice} MAHA*
[MahaDAO](https://polygonscan.com/token/0xedd6ca8a4202d4a36611e2fff109648c4863ae19) *|* [📶 Tx Hash 📶 ](https://polygonscan.com/tx/${event.transactionHash})
        `
      }

      bot.sendMessage(
        process.env.CHAT_ID,
        msgTemplate,
        { parse_mode: "Markdown" }
      );

      // console.log('msgTemplate', msgTemplate);
    }
  })
  .on('changed', changed => console.log('changed', changed))
  .on('error', err => console.log('error', err))


}
mahaXBot();
