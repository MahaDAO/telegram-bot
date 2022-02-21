const Web3 = require('web3');
const TelegramBot = require('node-telegram-bot-api');
// const twitter = require('twitter-lite');
require('dotenv').config();
const rp = require('request-promise');
const ethers = require('ethers');
const parseUnits = require('ethers')

// const config = require('./config');
const abi = require('./abi/BorrowerOperations.json')


const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

const arthLoans = async() => {

  const web3 = new Web3('wss://bsc-ws-node.nariox.org:443')

  let bscContract = '0xd55555376f9a43229dc92abc856aa93fee617a9a';
  let ploygonContract = '0x240ae60633d340aedde68f57af47d26bf270b8f6'
  var arthLoansContract = new web3.eth.Contract(abi, bscContract);

  // console.log('arthLoansContract', arthLoansContract.events);

  let mahaToUsdPrice = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=usd`);
  let mahaToEthPrice = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=eth`);

  mahaToUsdPrice = Number(JSON.parse(mahaToUsdPrice)['mahadao']['usd']).toPrecision(4)
  let ethToMahaPrice = Number(1 / JSON.parse(mahaToEthPrice)['mahadao']['eth']).toPrecision(6)

  // console.log('testprice', ethers.BigNumber.from('259461424744034720250') / ethers.BigNumber.from('250000000000000000000'))
  // let price = (250000000000000000000 * 146)/(259461424744034720250 * 100)
  // console.log('price', price)

  // operation: '2' - modifying loan - added extra collateral as well as withdrawing collateral

  arthLoansContract.events.TroveUpdated()
    .on('connected', nr => {console.log('connected', nr)})
    .on('data', (event) => {
      console.log('data', event);

      if(event.event === 'TroveUpdated'){

        let debt = ethers.BigNumber.from(`${event.returnValues._debt}`)
        let coll = ethers.BigNumber.from(`${event.returnValues._coll}`)
        let gmu = ethers.utils.parseUnits(`${mahaToUsdPrice}`, 18)
        let ratio = coll.mul(gmu._hex).mul(100).div(debt._hex)
        // let percentRatio = Number( ethers.utils.formatEther( ratio )).toFixed(2)
        let percentRatio = Number((ethers.BigNumber.from(event.returnValues._debt) / ethers.BigNumber.from(event.returnValues._coll)) * 100).toFixed(2)

        let msgTemplate = '';

        if(event.returnValues.operation == '0'){
          msgTemplate = `Loan of *${event.returnValues._debt / 10 ** 18}* Arth is taken by [${event.returnValues._borrower}](https://bscscan.com/address/${event.returnValues._borrower}) with collateral of ${event.returnValues._coll / 10 ** 18} MAHA
where collateral ratio is %.

*1 MAHA* = *$${mahaToUsdPrice}*
*1 ETH* = *${ethToMahaPrice} MAHA*
[MahaDAO](https://polygonscan.com/token/0xedd6ca8a4202d4a36611e2fff109648c4863ae19) *|* [📶 Tx Hash 📶 ](https://polygonscan.com/tx/${event.transactionHash})`

        } else if(event.returnValues.operation == '1') {
          msgTemplate = `Loan of *${event.returnValues._debt / 10 ** 18}* Arth is closed by [${event.returnValues._borrower}](https://bscscan.com/address/${event.returnValues._borrower})

*1 MAHA* = *$${mahaToUsdPrice}*
*1 ETH* = *${ethToMahaPrice} MAHA*
[MahaDAO](https://polygonscan.com/token/0xedd6ca8a4202d4a36611e2fff109648c4863ae19) *|* [📶 Tx Hash 📶 ](https://bscscan.com/tx/${event.transactionHash})`

        }
        bot.sendMessage(
          process.env.CHAT_ID,
          msgTemplate,
          { parse_mode: "Markdown" }
        );
      }
    })
    .on('changed', changed => console.log('changed', changed))
    .on('error', err => console.log('error', err))

}

arthLoans()
