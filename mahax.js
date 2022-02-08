const Web3 = require('web3');
const TelegramBot = require('node-telegram-bot-api');
const twitter = require('twitter-lite');
require('dotenv').config();

const config = require('./config');
const abi = require('./VotingEscrow.json');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

const mahaXBot = async() => {

  const client = new twitter(config);

  // Polygon
  const web3 = new Web3(process.env.MAINNET_MATIC)
  var testContract = new web3.eth.Contract(abi, process.env.MAHA_CONTRACT_ADRS);

  setInterval(() => {
     testContract.events.Deposit({
       filter: {
         type: 2
       }
     })
      .on('data', (event) => {
        // if(event.event === "Deposit"){
        //   console.log('Deposit Event', event);
        //   let messageTemplate = `MAHA locked`

        // Telegram bot
          // bot.sendMessage(
          //   process.env.CHAT_ID,
          //   messageTemplate,
          //   { parse_mode: "Markdown" }
          // );
        // }

        // client.post('statuses/update', { status: 'Hello investors..!' }).then(result => {
        //   console.log('You successfully tweeted this : "' + result.text + '"');
        // }).catch(console.error);
        console.log('Data Event', event);
      })
      .on('changed', changed => console.log('changed', changed))
      .on('connected', nr => {console.log('connected', nr)})
      .on('error', err => console.log('error', err))

    }, 5000)

}
mahaXBot();
