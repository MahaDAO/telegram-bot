require('dotenv').config('../.env')
const {Client, Intents, MessageEmbed} = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

//login bot using token

module.exports = {
  sendDiscordMsg: (msg) =>  {

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
      console.log(`Logged in from mahax ${client.user.tag}!`);

      channel = client.channels.cache.get(`${process.env.DISCORD_CHANNEL_ID}`)

      const exampleEmbed = new MessageEmbed()
        .setColor('#F07D55')
        .setTitle('🚀  Farming is in swing...')
        .setDescription(msg)

      channel.send({embeds: [exampleEmbed]})

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

    console.log('channel', channel)

    client.login(process.env.DISCORD_CLIENT_TOKEN)
      .then((res) => console.log('res', res))
      .catch((err) => console.log('err', err))


  }

}
