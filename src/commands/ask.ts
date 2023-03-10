import { DiscordCommand } from 'discord-module-loader';
import { ApplicationCommandOptionType, Interaction } from 'discord.js';

import { generateChatMessages, validateMessage } from '@/lib/helpers';
import { createChatCompletion } from '@/lib/openai';
import { RateLimiter } from '@/lib/rate-limiter';

const rateLimiter = new RateLimiter(5, 'minute');

export default new DiscordCommand({
  command: {
    name: 'ask',
    description: 'Ask anything!',
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'message',
        description: 'The message to say to the bot.',
        required: true,
        maxLength: 1024,
      },
      {
        type: ApplicationCommandOptionType.String,
        name: 'behavior',
        description: 'Specify how the bot should behave.',
        maxLength: 1024,
      },
    ],
  },
  execute: async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const message = interaction.options.getString('message')?.trim();

    try {
      await validateMessage(message);
    } catch (err) {
      await interaction.reply({
        content: (err as Error).message,
        ephemeral: true,
      });

      return;
    }

    const behavior = interaction.options.getString('behavior')?.trim();

    if (behavior) {
      try {
        await validateMessage(behavior, 'behavior');
      } catch (err) {
        await interaction.reply({
          content: (err as Error).message,
          ephemeral: true,
        });

        return;
      }
    }

    const executed = rateLimiter.attempt(interaction.user.id, async () => {
      await interaction.deferReply();

      const completion = await createChatCompletion(
        generateChatMessages(message as string, behavior)
      );

      await interaction.editReply(completion.message);
    });

    if (!executed) {
      await interaction.reply({
        content: 'You are currently being rate limited.',
        ephemeral: true,
      });
    }
  },
});
