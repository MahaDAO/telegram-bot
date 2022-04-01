
const Web3 = require('web3')
const TelegramBot = require('node-telegram-bot-api');
const {Client, Intents, MessageEmbed} = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

require('dotenv').config({path: '../../.env'});
const leverageAbi = require('../../abi/ILeverageStrategy.json')
const fn = require('../../utils/fn')
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
const format = require('../../utils/formatValues');
const constants = require('../../utils/constants')

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

const leverageObj = [
  {
    contract: '0x7b8b7f1a6e555f9c1e357b5ffe4879fe6e563e55',
    chainWss: process.env.TESTNET_MATIC,
    chainName: 'Polygon Testnet'
  }
]

const leverage = () => {
  leverageObj.map((lev) => {
    console.log('events', new (new Web3(lev.chainWss)).eth.Contract(leverageAbi, lev.contract).events)
    new (new Web3(lev.chainWss)).eth.Contract(leverageAbi, lev.contract).events.allEvents()
    .on('connected', nr => console.log('connected', lev.chainName))
    .on('data', (data) => {
      console.log('data', data)
    })

  })
}

leverage()
