
const Web3 = require('web3')
const TelegramBot = require('node-telegram-bot-api');
const {Client, Intents, MessageEmbed} = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const rp = require('request-promise');

require('dotenv').config({path: '../../.env'});
const leverageAbi = require('../../abi/ILeverageStrategy.json')
const fn = require('../../utils/fn')
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
const format = require('../../utils/formatValues');
const constants = require('../../utils/constants');
const formatValues = require('../../utils/formatValues');

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


const leverageObj = [
  // {
  //   contract: '0x7b8b7f1a6e555f9c1e357b5ffe4879fe6e563e55',
  //   chainWss: process.env.MAINNET_MATIC,
  //   chainName: 'Polygon Mainnet'
  // },
  {
    contract: [
      {
        lpName: 'BUSD/USDC ApeSwap',
        lpAdrs: '0x3F893bc356eC4932A1032588846F4c5e3BC670Dc'
      },
      {
        lpName: 'BUSD/USDT ApeSwap',
        lpAdrs: '0x78DE5b23734EEbF408CEe5c06E51827e03bCD98d'
      }
    ],
    chainWss: process.env.MAINNET_BSC,
    chainName: 'BSC Mainnet'
  }
]

const leverage = async() => {

  leverageObj.map((lev) => {

    lev.contract.map((cont) => {

      new (new Web3(lev.chainWss)).eth.Contract(leverageAbi, cont.lpAdrs).events.allEvents()
      .on('connected', nr => console.log('connected', lev.chainName, cont.lpName))
      .on('data', async(data) => {
        console.log('data', data)
        let telegramMsg = ''
        let discordMsg = ''

        if(data.event == 'PositionOpened' || data.event == 'PositionClosed'){
          telegramMsg = await fn.leverageTeleMsg(data, lev.chainName, cont.lpName)
          discordMsg = await fn.leverageDiscordMsg(data, lev.chainName, cont.lpName)
        }

        bot.sendMessage(
          process.env.CHAT_ID,
          telegramMsg,
          { parse_mode: "Markdown", disable_web_page_preview: true })

        channel.send({embeds: [discordMsg]})
      })

    })



  })
}

leverage()
