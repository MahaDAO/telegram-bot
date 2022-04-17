const Web3 = require('web3');
const TelegramBot = require('node-telegram-bot-api');
const {Client, Intents, MessageEmbed} = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
// const twitter = require('twitter-lite');
require('dotenv').config({path: '../../.env'});
// const rp = require('request-promise');
const ethers = require('ethers');
const troveManagerAbi = require('../../abi/TroveManager.json')
const format = require('../../utils/formatValues')
const constants = require('../../utils/constants')
const fn = require('../../utils/fn')

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

// For Redeem and Liquidate

const commands = [{
  name: 'maha',
  description: 'Replies with DAO!'
}];
const rest = new REST({ version: '9' }).setToken(`${process.env.MAHA_DiscordClientToken}`);
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationGuildCommands(process.env.MAHA_DiscordClientId, process.env.MAHA_GuildId),
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

  channel = client.channels.cache.get(`${process.env.MAHA_DiscordChannel}`)

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

client.login(process.env.MAHA_DiscordClientToken); //login bot using token


const troveContracts = [
  {
    chainName: 'Polygon Mainnet',
    chainWss: process.env.MAINNET_MATIC,
    contracts: [
      {
        poolName: 'Weth',
        poolAdrs: process.env.Matic_TroveM_Weth
      },
      {
        poolName: 'Wdai',
        poolAdrs: process.env.Matic_TroveM_Wdai
      },
      {
        poolName: 'Wmatic',
        poolAdrs: process.env.Matic_TroveM_Wmatic
      },
    ]
  },
  {
    chainName: 'BSC Mainnet',
    chainWss: process.env.MAINNET_BSC,
    contracts: [
      {
        poolName: 'Maha',
        poolAdrs: process.env.Bsc_TroveM_Maha
      },
      {
        poolName: 'Wbnb',
        poolAdrs: process.env.Bsc_TroveM_Wbnb
      },
      {
        poolName: 'Wbusd',
        poolAdrs: process.env.Bsc_TroveM_Wbusd
      },
    ]
  }
]

const maticTroveMContracts = [process.env.Matic_TroveM_Weth, process.env.Matic_TroveM_Wdai, process.env.Matic_TroveM_Wmatic]
const bscTroveContracts = [process.env.Bsc_TroveM_Maha, process.env.Bsc_TroveM_Wbnb, process.env.Bsc_TroveM_Wbusd]

// For Redeem and Liquidate
const troveManage = () => {

  const web3MaticMain = new Web3(`${process.env.MAINNET_MATIC}`)
  const web3BscMain = new Web3(`${process.env.MAINNET_BSC}`)

  troveContracts.map((troveContract) => {
    troveContract.contracts.map((adrs) => {
      new (new Web3(troveContract.chainWss)).eth.Contract(troveManagerAbi, `${adrs.poolAdrs}`).events.allEvents()
        .on('connected', nr => console.log(`connected ${troveContract.chainName} ${adrs.poolName}`))
        .on('data', event => {

          console.log('troveManagerContract', event)
          let telegramMsg = ''
          let discordMsg = ''

          if(event.event == 'TroveLiquidated' || event.event == 'Redemption'){
            telegramMsg = await fn.troveTelegramMsg(event, troveContract.chainName, adrs.poolName, event.event)
            discordMsg = await fn.troveDiscordMsg(event, troveContract.chainName, adrs.poolName, event.event)
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

  // for(let i = 0; i < maticTroveMContracts.length - 1; i++){
  //   new web3MaticMain.eth.Contract(troveManagerAbi, maticTroveMContracts[i]).events.allEvents()
  //     .on('connected', nr => console.log('connected', 'matic-trove', maticTroveMContracts[i]))
  //     .on('data', event => {
  //       console.log('troveManagerContract', event)

  //       let msgTemplate = 'Hello Investors'
  //       if(event.event == 'TroveLiquidated'){
  //         msgTemplate=`${format.toDisplayNumber(event.returnValues._coll)} MAHA has been liquidated with the debt of ${format.toDisplayNumber(event.returnValues._debt)} Arth.`
  //       }if(event.event == 'Redemption'){
  //         msgTemplate = `${format.toDisplayNumber(event.returnValues._actualLUSDAmount)} ARTH has been redeemed for ${format.toDisplayNumber(event.returnValues._ETHSent)} MAHA`
  //       }

  //       bot.sendMessage(
  //         process.env.CHAT_ID,
  //         fn.botMessage(msgTemplate, 'matic', event.transactionHash),
  //         { parse_mode: "Markdown" }
  //       )

  //     })
  //     .on('error', err => console.log('error matic-trove', err))
  // }

  // for(let i = 0; i < bscTroveContracts.length - 1; i++){
  //   new web3BscMain.eth.Contract(troveManagerAbi, bscTroveContracts[i]).events.allEvents()
  //     .on('connected', nr => console.log('bsc-trove', bscTroveContracts[i]))
  //     .on('data', event => {
  //       console.log('troveManagerContract', event)

  //       let msgTemplate = 'Hello Investors'
  //       if(event.event == 'TroveLiquidated'){
  //         msgTemplate=`${format.toDisplayNumber(event.returnValues._coll)} MAHA has been liquidated with the debt of ${format.toDisplayNumber(event.returnValues._debt)} Arth.`
  //       }if(event.event == 'Redemption'){
  //         msgTemplate = `${format.toDisplayNumber(event.returnValues._actualLUSDAmount)} ARTH has been redeemed for ${format.toDisplayNumber(event.returnValues._ETHSent)} MAHA`
  //       }

  //       bot.sendMessage(
  //         process.env.CHAT_ID,
  //         botMessage(msgTemplate, 'bsc', event.transactionHash),
  //         { parse_mode: "Markdown" }
  //       )
  //     })
  //     .on('error', err => console.log('error bsc-trove', err))
  // }
}

troveManage()
