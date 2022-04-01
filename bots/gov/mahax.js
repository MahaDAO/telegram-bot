const Web3 = require('web3');
const TelegramBot = require('node-telegram-bot-api');
const twitter = require('twitter-lite');
require('dotenv').config({path: '../../.env'});
const rp = require('request-promise');
const moment =  require('moment')
const {Client, Intents, MessageEmbed} = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const config = require('../../config');
const votingEscrowAbi = require('../../abi/VotingEscrow.json');
const { messageTypes } = require('node-telegram-bot-api/src/telegram');
const mahaImg = './MahaDAO.png'

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

// console.log('client', client)

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


client.login(process.env.DISCORD_CLIENT_TOKEN)
  .then((result) => {
    console.log('result', result)
  }).catch((err) => {
    console.log('err', err)
  });
   //login bot using token


const mahaXBot = async() => {

  const client = new twitter(config);

  // Polygon
  const web3 = new Web3(process.env.MAINNET_MATIC)
  var mahaxContract = new web3.eth.Contract(votingEscrowAbi, `${process.env.Matic_VotingEscrow}`);

  let mahaToUsdPrice = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=usd`);
  let mahaToEthPrice = await rp(`https://api.coingecko.com/api/v3/simple/price?ids=mahadao&vs_currencies=eth`);

  mahaToUsdPrice = Number(JSON.parse(mahaToUsdPrice)['mahadao']['usd']).toPrecision(4)
  let ethToMahaPrice = Number(1 / JSON.parse(mahaToEthPrice)['mahadao']['eth']).toPrecision(6)

  mahaxContract.events.allEvents({address: `${process.env.Matic_VotingEscrow}`}, function(error, event){ })
  .on('connected', nr => {console.log('connected', nr)})
  .on('data', (event) => {
    console.log('event', event);
    let msgTemplate = '';

    if(event.event == 'Deposit' ){
      if(event.returnValues.type == 1 || event.returnValues.type == 2){
        let noOfGreenDots = Math.ceil(Number((event.returnValues.value / 10**18) * mahaToUsdPrice) / 100)

        let greenDots = ''
        for(let i = 0; i < noOfGreenDots; i++){
          greenDots = '🟢 '  + greenDots;
        }

        msgTemplate = `
🚀  Governance is in swing...

*${event.returnValues.value / 10**18} $(${(event.returnValues.value / 10**18) * mahaToUsdPrice}) MAHA* has been locked till *${moment(event.returnValues.locktime * 1000).format('DD MMM YYYY')}* by [${event.returnValues.provider}](https://polygonscan.com/address/${event.returnValues.provider})

${greenDots}

*1 MAHA* = *$${mahaToUsdPrice}*
*1 ETH* = *${ethToMahaPrice} MAHA*
[MahaDAO](https://polygonscan.com/token/0xedd6ca8a4202d4a36611e2fff109648c4863ae19) *|* [📶 Tx Hash 📶 ](https://polygonscan.com/tx/${event.transactionHash})
`
      }else if(event.returnValues.type == 3){
        msgTemplate = `
🚀  Governance is in swing...

The locking period is extended till *${moment(event.returnValues.locktime * 1000).format('DD MMM YYYY')}* by [${event.returnValues.provider}](https://polygonscan.com/address/${event.returnValues.provider})

*1 MAHA* = *$${mahaToUsdPrice}*
*1 ETH* = *${ethToMahaPrice} MAHA*
[MahaDAO](https://polygonscan.com/token/0xedd6ca8a4202d4a36611e2fff109648c4863ae19) *|* [📶 Tx Hash 📶 ](https://polygonscan.com/tx/${event.transactionHash})
        `
      }
      else{
        let noOfRedDots = Math.ceil(Number((event.returnValues.value / 10**18) * mahaToUsdPrice) / 100)

        let redDots = ''
        for(let i = 0; i < noOfRedDots; i++){
          redDots = '🔴 '  + redDots;
        }

        msgTemplate = `
🚀  Governance is in swing...

*${event.returnValues.value / 10**18} $(${(event.returnValues.value / 10**18) * mahaToUsdPrice}) MAHA* has been withdrawn by [${event.returnValues.provider}](https://polygonscan.com/address/${event.returnValues.provider})

*1 MAHA* = *$${mahaToUsdPrice}*
*1 ETH* = *${ethToMahaPrice} MAHA*
[MahaDAO](https://polygonscan.com/token/0xedd6ca8a4202d4a36611e2fff109648c4863ae19) *|* [📶 Tx Hash 📶 ](https://polygonscan.com/tx/${event.transactionHash})
        `
      }

      bot.sendMessage(
        process.env.CHAT_ID,
        msgTemplate,
        { parse_mode: "Markdown", disable_web_page_preview: true }
      );

      const exampleEmbed = new MessageEmbed()
        .setColor('#F07D55')
        // .setTitle('🚀  Governance is in swing...')
        .setDescription(msgTemplate)

      channel.send({embeds: [exampleEmbed]})

    }
  })
  .on('changed', changed => console.log('changed', changed))
  .on('error', err => console.log('error', err))

}

mahaXBot();
