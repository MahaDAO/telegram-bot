const Web3 = require('web3');
const TelegramBot = require('node-telegram-bot-api');
const {Client, Intents, MessageEmbed} = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
// const twitter = require('twitter-lite');
require('dotenv').config();
// const rp = require('request-promise');
const ethers = require('ethers');
// const parseUnits = require('ethers')

const borrowerOperationsAbi = require('../../abi/BorrowerOperations.json')
const troveManagerAbi = require('../../abi/TroveManager.json')
const format = require('../../utils/formatValues')
const constants = require('../../utils/constants')
const fn = require('../../utils/fn')
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

const commands = [{
  name: 'maha',
  description: 'Replies with DAO!'
}];
const rest = new REST({ version: '9' }).setToken(`${process.env.DISCORD_CLIENT_TOKEN}`);
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const client = new Client({ intents:
  [Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
  ],
});

let channel;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  channel = client.channels.cache.get(`${process.env.DISCORD_CHANNEL_ID}`)

});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName == 'maha') {
    await interaction.reply('DAO!');
  }

});

client.on('messageCreate', msg => {
  if (msg.content.toLowerCase() == 'maha') {
    msg.channel.send('DAO')
  }
});

client.login(process.env.DISCORD_CLIENT_TOKEN); //login bot using token

const borrowingContracts = [
  {
    chainName: 'Polygon Mainnet',
    chainWss: process.env.MAINNET_MATIC,
    contract: [
      {
        collName: 'Weth',
        collAdrs: process.env.Matic_Borrow_Weth
      },
      {
        collName: 'Wdai',
        collAdrs: process.env.Matic_Borrow_Wdai
      },
      {
        collName: 'Wmatic',
        collAdrs: process.env.Matic_Borrow_Wmatic
      },
    ],
  },
  {
    chainName: 'BSC Mainnet',
    chainWss: process.env.MAINNET_BSC,
    contract: [
      {
        collName: 'Maha',
        collAdrs: process.env.Bsc_Borrow_Maha
      },
      {
        collName: 'Wbnb',
        collAdrs: process.env.Bsc_Borrow_Wbnb
      },
      {
        collName: 'Wbusd',
        collAdrs: process.env.Bsc_Borrow_Wbusd
      },
    ],

  }
]

// For Create, Update, Close the loan
const maticBorrowContracts = [process.env.Matic_Borrow_Weth, process.env.Matic_Borrow_Wdai, process.env.Matic_Borrow_Wmatic]
const bscBorrowContracts = [process.env.Bsc_Borrow_Maha, process.env.Bsc_Borrow_Wbnb, process.env.Bsc_Borrow_Wbusd]

const borrowingOperations = async() => {

  // Testnet

  const web3MaticTestBorrow = new Web3(`${process.env.TESTNET_MATIC}`)
  const web3BscTestBorrow = new Web3(`${process.env.TESTNET_BSC}`)

  // let bscTestMahaBorrowerOperationContract = '0xABc622cde0175a0E7700C3283c64Cd9D99aa07DF'
  // let bscTestMahaTroveManagerContract = '0x7471466f0409aD3eaA8abE78bc1aE032fBccc618'

  // var borrowerOperationsContract = new web3.eth.Contract(borrowerOperationsAbi, bscTestMahaBorrowerOperationContract)
  // var troveManagerContract = new web3.eth.Contract(troveManagerAbi, bscTestMahaTroveManagerContract);

  // Mainnet
  // At a time only two token addressess get connected on a websocket

  const web3MaticMain = new Web3(`${process.env.MAINNET_MATIC}`)
  const web3BscMain = new Web3(`${process.env.MAINNET_BSC}`)


  borrowingContracts.map((borrowContract) => {
    borrowContract.contract.map((adrs) => {
      new (new Web3(borrowContract.chainWss)).eth.Contract(borrowerOperationsAbi, `${adrs.collAdrs}`).events.allEvents()
        .on('connected', nr => console.log(`connected ${borrowContract.chainName} ${adrs.collName}`))
        .on('data', event => {

          console.log('borrowContract', event)
          let telegramMsg = ''
          let discordMsg = ''

          if(event.event == 'TroveUpdated'){
            telegramMsg = await fn.borrowOpTelegramMsg(event, troveContract.chainName, adrs.collName)
            discordMsg = await fn.borrowOpDiscordMsg(event, troveContract.chainName, adrs.collName)
          }

          bot.sendMessage(
            process.env.CHAT_ID,
            telegramMsg,
            { parse_mode: "Markdown" }
          )
          channel.send({embeds: [discordMsg]})

        })
    })
  })

  // for(let i = 0; i < maticBorrowContracts.length - 1; i++){
  //   new web3MaticMain.eth.Contract(borrowerOperationsAbi, maticBorrowContracts[i]).events.TroveUpdated()
  //     .on('connected', nr => console.log('connected', 'matic-borrow', maticBorrowContracts[i]))
  //     .on('data', (event) => {
  //       let debt = ethers.BigNumber.from(`${event.returnValues._debt}`)
  //       let coll = ethers.BigNumber.from(`${event.returnValues._coll}`)
  //       let gmu = ethers.utils.parseUnits(`${mahaToUsdPrice}`, 18)
  //       let ratio = coll.mul(gmu._hex).mul(100).div(debt._hex)
  //       // let percentRatio = Number( ethers.utils.formatEther( ratio )).toFixed(2)
  //       let percentRatio = Number((ethers.BigNumber.from(event.returnValues._debt) / ethers.BigNumber.from(event.returnValues._coll)) * 100).toFixed(2)
  //       let msgTemplate = `Hello Investors`;

  //       if(event.returnValues.operation == '0'){
  //         msgTemplate = `Loan of *${format.toDisplayNumber(event.returnValues._debt)}* Arth is taken by [${event.returnValues._borrower}](https://polygonscan.com/address/${event.returnValues._borrower}) with collateral of ${format.toDisplayNumber(event.returnValues._coll)} MAHA.`
  //       }
  //       if(event.returnValues.operation == '1'){
  //         msgTemplate = `A Loan has been closed by [${event.returnValues._borrower}](https://polygonscan.com/address/${event.returnValues._borrower})`
  //       }
  //       if(event.returnValues.operation == '2'){
  //         msgTemplate = `A Loan has been modified by [${event.returnValues._borrower}](https://polygonscan.com/address/${event.returnValues._borrower})`
  //       }
  //       bot.sendMessage(
  //         process.env.CHAT_ID,
  //         fn.botMessage(msgTemplate, 'matic', event.transactionHash),
  //         { parse_mode: "Markdown" }
  //       );

  //     })
  //     .on('error', err => console.log('error matic-borrow', err))
  // }

  // for(let i = 0; i < bscBorrowContracts.length - 1; i++){
  //   new web3BscMain.eth.Contract(borrowerOperationsAbi, bscBorrowContracts[i]).events.TroveUpdated()
  //     .on('connected', nr => console.log('connected', 'bsc-borrow', bscBorrowContracts[i]))
  //     .on('data', (event) => {
  //       let debt = ethers.BigNumber.from(`${event.returnValues._debt}`)
  //       let coll = ethers.BigNumber.from(`${event.returnValues._coll}`)
  //       let gmu = ethers.utils.parseUnits(`${mahaToUsdPrice}`, 18)
  //       let ratio = coll.mul(gmu._hex).mul(100).div(debt._hex)
  //       // let percentRatio = Number( ethers.utils.formatEther( ratio )).toFixed(2)
  //       let percentRatio = Number((ethers.BigNumber.from(event.returnValues._debt) / ethers.BigNumber.from(event.returnValues._coll)) * 100).toFixed(2)
  //       let msgTemplate = `Hello Investors`;

  //       if(event.returnValues.operation == '0'){
  //         msgTemplate = `Loan of *${format.toDisplayNumber(event.returnValues._debt)}* Arth is taken by [${event.returnValues._borrower}](https://bscscan.com/address/${event.returnValues._borrower}) with collateral of ${format.toDisplayNumber(event.returnValues._coll)} MAHA.`
  //       }
  //       if(event.returnValues.operation == '1'){
  //         msgTemplate = `A Loan has been closed by [${event.returnValues._borrower}](https://bscscan.com/address/${event.returnValues._borrower})`
  //       }
  //       if(event.returnValues.operation == '2'){
  //         msgTemplate = `A Loan has been modified by [${event.returnValues._borrower}](https://bscscan.com/address/${event.returnValues._borrower})`
  //       }
  //       bot.sendMessage(
  //         process.env.CHAT_ID,
  //         fn.botMessage(msgTemplate, 'matic', event.transactionHash),
  //         { parse_mode: "Markdown" }
  //       );

  //     })
  //     .on('error', err => console.log('error bsc-borrow', err))
  // }

}

borrowingOperations()
