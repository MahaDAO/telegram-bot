
const Web3 = require('web3')
const TelegramBot = require('node-telegram-bot-api');
const {Client, Intents, MessageEmbed} = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

require('dotenv').config({path: '../../.env'});
const farmingAbi = require('../../abi/BasicStaking.json')
const fn = require('../../utils/fn')
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
const format = require('../../utils/formatValues');
const constants = require('../../utils/constants')
const sendDiscordMsg = require('../../utils/sendDiscordMsg')

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

const basicStaking = [
  {
    contrat: [
      {
        lpTokenName: 'ARTH.usd+3pool',
        lpTokenAdrs: process.env.MaticMain_BSArthUsd3Pool
      },
      {
        lpTokenName: 'ARTH/USDC LP',
        lpTokenAdrs: process.env.MaticMain_BSArthUsdc
      },
      {
        lpTokenName: 'ARTH/MAHA LP',
        lpTokenAdrs: process.env.MaticMain_BSArthMaha
      }],
    chainWss: process.env.MAINNET_MATIC,
    chainName: 'Polygon Mainnet'
  },
  {
    contrat: [
      {
        lpTokenName: 'ARTH.usd+3eps',
        lpTokenAdrs: process.env.BscMain_BSArthUsd3eps
      },
      {
        lpTokenName: 'ARTH/BUSD LP',
        lpTokenAdrs: process.env.BscMain_BSArthBusdc
      },
      {
        lpTokenName: 'ARTH/MAHA LP',
        lpTokenAdrs: process.env.BscMain_BSArthMaha
      }],
    chainWss: process.env.MAINNET_BSC,
    chainName: 'BSC Mainnet'
  }
]

const farming = async() => {

  basicStaking.map((farm) => {

    farm.contrat.map((cont) => {
      new (new Web3(farm.chainWss)).eth.Contract(farmingAbi, `${cont.lpTokenAdrs}`).events.allEvents()
        .on('connected', nr => console.log(`connected ${farm.chainName} ${cont.lpTokenName}`))
        .on('data', async(data) => {
          console.log('data', data)
          let msgTemplate = 'Hello Investors'
          let baseUrl = ''
          if(farm.chainName == 'Polygon Mainnet') baseUrl = 'https://polygonscan.com'
          if(farm.chainName == 'BSC Mainnet') baseUrl = 'https://bscscan.com'

          if(data.event == 'Staked'){
            // msgTemplate = `*${format.toDisplayNumber(data.returnValues.amount)} ${cont.lpTokenName}* tokens has been staked on *QuickSwap MAHA/ARTH Staking Program* by [${data.returnValues.user}](${baseUrl}/address/${data.returnValues.user})`
            console.log('data', data.returnValues.amount)
            let msg = await fn.farmingTelgramMsg(data, `${farm.chainName}`, cont.lpTokenName, 'Staked')
            console.log('msg', msg)

            bot.sendMessage(
              process.env.CHAT_ID,
              msg,
              { parse_mode: "Markdown", disable_web_page_preview: true }
            )
            let discordMsg = await fn.farmingDiscordMsg(data, `${farm.chainName}`, cont.lpTokenName, 'Staked')
            console.log('discordMsg', discordMsg)
            channel.send({embeds: [discordMsg]})
          }
          if(data.event == 'Withdrawn'){
            console.log('if Withdrawn')
            // msgTemplate = `*${format.toDisplayNumber(data.returnValues.amount)} ARTH/MAHA LP* tokens has been withdrawn from *QuickSwap MAHA/ARTH Staking Program* by [${data.returnValues.user}](${baseUrl}/address/${data.returnValues.user})`
            let msg = await fn.farmingTelgramMsg(data, `${farm.chainName}`, cont.lpTokenName, 'Withdrawn')
            console.log('msg', msg)
            bot.sendMessage(
              process.env.CHAT_ID,
              msg,
              { parse_mode: "Markdown", disable_web_page_preview: true }
            )
            let discordMsg = await fn.farmingDiscordMsg(data, `${farm.chainName}`, cont.lpTokenName,  'Withdrawn')
            console.log('discordMsg', discordMsg)

            channel.send({embeds: [discordMsg]})
          }
          if(data.event == 'RewardPaid'){
            console.log('if RewardPaid')
            // msgTemplate = `*${format.toDisplayNumber(data.returnValues.reward)} MAHA tokens* has been claimed as reward from *QuickSwap MAHA/ARTH Staking Program* by [${data.returnValues.user}](${baseUrl}/address/${data.returnValues.user})`
            let msg = await fn.farmingTelgramMsg(data, `${farm.chainName}`, cont.lpTokenName, 'RewardPaid')

            bot.sendMessage(
              process.env.CHAT_ID,
              msg,
              { parse_mode: "Markdown", disable_web_page_preview: true}
            )
            let discordMsg = await fn.farmingDiscordMsg(data, `${farm.chainName}`, cont.lpTokenName, 'RewardPaid')
            channel.send({embeds: [discordMsg]})

          }
        })
        .on('changed', changed => console.log('changed', changed))
        .on('error', err => console.log('error farming', err))
    })

  })

}

farming()
