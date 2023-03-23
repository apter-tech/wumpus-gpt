import { Client } from '@biscxit/discord-module-loader';
import { GatewayIntentBits } from 'discord.js';

import config from '@/config';
import sequelize from '@/lib/sequelize';
import Conversation from '@/models/conversation';

const isRunningWithTsNode = process.argv.some((arg) => arg.includes('ts-node'));

const client = new Client({
  rootDir: isRunningWithTsNode ? 'src' : 'dist',
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  // partials: [Partials.Channel],
});

sequelize
  .authenticate()
  .then(async () => {
    await Conversation.sync();

    await client.initialize(config.discord.token as string);
  })
  .catch((err) => {
    console.error(err);
  });
