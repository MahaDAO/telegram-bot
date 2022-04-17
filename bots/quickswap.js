require('dotenv').config({path: '../.env'});
const Web3 = require('web3');
const TelegramBot = require('node-telegram-bot-api');
const {Client, Intents, MessageEmbed} = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
// const quickSwapAbi = require('../abi/QuickSwap.json')
const ethers = require('ethers')
const {BigNumber} = require('ethers')

const vyperContractAbi = require('../abi/vyperContractAbi.json')
const format = require('../utils/formatValues')
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
const constants = require('../utils/constants')

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


const quickSwap = () => {

  console.log('bg', ethers.utils.formatUnits('1000000', 6))

  const web3Vyper = new Web3(process.env.MAINNET_MATIC)
  const vyperContract = new web3Vyper.eth.Contract(vyperContractAbi, `${process.env.Vyper_Contract}`)

  // console.log('process.env.MAINNET_MATIC', process.env.MAINNET_MATIC)
  // console.log('vyperContract', vyperContract.events);

  vyperContract.events.allEvents()
    .on('connected', nr => console.log('connected'))
    .on('data', async(data) => {
      console.log('data', data)
      let msg = ''
      let dotColor = ''

      if(data.event == 'TokenExchangeUnderlying'){

      let tokenSold = ''
      let tokenSoldAmt = ''
      let tokenBought = ''
      let tokenBoughtAmt = ''
      let noOfTotalDots = 0

      if(data.returnValues.sold_id == '0') {
        tokenSold = 'Arth.usd'
        tokenSoldAmt = format.toDisplayNumber(data.returnValues.tokens_sold)
        noOfTotalDots = Math.ceil(tokenSoldAmt / 100)
        dotColor = 'red'
      }
      else if(data.returnValues.sold_id == '1') {
        tokenSold = 'DAI'
        tokenSoldAmt = format.toDisplayNumber(data.returnValues.tokens_sold)
      }
      else if(data.returnValues.sold_id == '2'){
        tokenSold = 'USDC'
        tokenSoldAmt = ethers.utils.formatUnits(data.returnValues.tokens_sold, 6)
      }
      else {
        tokenSold = 'USDT'
        tokenSoldAmt = ethers.utils.formatUnits(data.returnValues.tokens_sold, 6)
      }

      if(data.returnValues.bought_id == '0') {
        tokenBought = 'Arth.usd'
        tokenBoughtAmt = format.toDisplayNumber(data.returnValues.tokens_bought)
        noOfTotalDots = Math.ceil(tokenBoughtAmt / 100)
        dotColor = 'green'

      }
      else if(data.returnValues.bought_id == '1') {
        tokenBought = 'DAI'
        tokenBoughtAmt = format.toDisplayNumber(data.returnValues.tokens_bought)
      }
      else if(data.returnValues.bought_id == '2') {
        tokenBought = 'USDC'
        tokenBoughtAmt = ethers.utils.formatUnits(data.returnValues.tokens_bought, 6)
      }
      else {
        tokenBought = 'USDT'
        tokenBoughtAmt = ethers.utils.formatUnits(data.returnValues.tokens_bought, 6)
      }

      let dots = ''
      for(let i = 0; i < noOfTotalDots; i++){
        if(dotColor == 'red')
          dots = '🔴 '  + dots
        else if(dotColor == 'green')
          dots = '🟢 '  + dots;
        else dots = ''
      }

      telegramMsg = `🚀  *${tokenSoldAmt} ${tokenSold}* has been sold for *${tokenBoughtAmt} ${tokenBought}* by [${data.returnValues.buyer}](https://polygonscan.com/address/${data.returnValues.buyer})

${dots}

*1 ARTH* = *$${await constants.getArthToUSD()}*

[📶 Transaction Hash 📶 ](https://polygonscan.com/tx/${data.transactionHash})
        `

      discordMsg = `🚀  **${tokenSoldAmt} ${tokenSold}** has been sold for **${tokenBoughtAmt} ${tokenBought}** by [${data.returnValues.buyer}](https://polygonscan.com/address/${data.returnValues.buyer})

${dots}

**1 ARTH** = **$${await constants.getArthToUSD()}**

[📶 Transaction Hash 📶 ](https://polygonscan.com/tx/${data.transactionHash})
        `
      }

       bot.sendMessage(
        process.env.CHAT_ID,
        telegramMsg,
        { parse_mode: "Markdown", disable_web_page_preview: true }
      );

    const discordMsgEmbed = new MessageEmbed()
      .setColor('#F07D55')
      .setDescription(discordMsg)

    channel.send({embeds: [discordMsgEmbed]})

    })
    .on('changed', changed => console.log('changed', changed))
    .on('error', err => console.log('error', err))
}

quickSwap();
