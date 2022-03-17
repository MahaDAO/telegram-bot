
const Web3 = require('web3')
const TelegramBot = require('node-telegram-bot-api');
const {Client, Intents, MessageEmbed} = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

require('dotenv').config({path: '../../.env'});
const farmingAbi = require('../../abi/BasicStaking.json')
const fn = require('../../utils/fn')
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
const format = require('../../utils/formatValues')


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

client.on('ready', async() => {
  console.log(`Logged in as ${client.user.tag}!`);
  // line below giving undefined fetch
  // console.log('channel', await client.channels.fetch(process.env.DISCORD_CHANNEL_ID))
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
    contrat: process.env.MaticMain_BasicStaking,
    chainWss: process.env.MAINNET_MATIC,
    chainName: 'Polygon Mainnet'
  },
  {
    contrat: process.env.BscMain_BasicStaking,
    chainWss: process.env.MAINNET_BSC,
    chainName: 'BSC Mainnet'
  }
]

const farming = () => {

  basicStaking.map((farm) => {
    new (new Web3(farm.chainWss)).eth.Contract(farmingAbi, `${farm.contrat}`).events.allEvents()
      .on('connected', nr => console.log(`connected ${farm.chainName}`))
      .on('data', async(data) => {
        console.log('data', data)
        let msgTemplate = 'Hello Investors'
        let baseUrl = ''
        if(farm.chainName == 'Polygon Mainnet') baseUrl = 'https://polygonscan.com'
        if(farm.chainName == 'BSC Mainnet') baseUrl = 'https://bscscan.com'

        if(data.event == 'Staked'){
          msgTemplate = `*${format.toDisplayNumber(data.returnValues.amount)} ARTH/MAHA LP* tokens has been staked on *QuickSwap MAHA/ARTH Staking Program* by [${data.returnValues.user}](${baseUrl}/address/${data.returnValues.user})`

          let msg = await fn.farmingBotMsg(msgTemplate, `${farm.chainName}`, data.transactionHash, format.toDisplayNumber(data.returnValues.amount), 'Staked')
          bot.sendMessage(
            process.env.CHAT_ID,
            msg,
            { parse_mode: "Markdown" }
          )
        }
        if(data.event == 'Withdrawn'){
          console.log('if Withdrawn')
          msgTemplate = `*${format.toDisplayNumber(data.returnValues.amount)} ARTH/MAHA LP* tokens has been withdrawn from *QuickSwap MAHA/ARTH Staking Program* by [${data.returnValues.user}](${baseUrl}/address/${data.returnValues.user})`
          let msg = await fn.farmingBotMsg(msgTemplate, `${farm.chainName}`, data.transactionHash, format.toDisplayNumber(data.returnValues.amount), 'Withdrawn')

          bot.sendMessage(
            process.env.CHAT_ID,
            msg,
            { parse_mode: "Markdown" }
          )
        }
        if(data.event == 'RewardPaid'){
          console.log('if RewardPaid')
          msgTemplate = `*${format.toDisplayNumber(data.returnValues.reward)} ARTH/MAHA LP tokens* has been claimed as reward on *QuickSwap MAHA/ARTH Staking Program* by [${data.returnValues.user}](${baseUrl}/address/${data.returnValues.user})`
          let msg = await fn.farmingBotMsg(msgTemplate, `${farm.chainName}`, data.transactionHash, format.toDisplayNumber(data.returnValues.reward), 'RewardPaid')

          bot.sendMessage(
            process.env.CHAT_ID,
            msg,
            { parse_mode: "Markdown" }
          )
        }
      })
      .on('changed', changed => console.log('changed', changed))
      .on('error', err => console.log('error farming', err))
  })

}

farming()
