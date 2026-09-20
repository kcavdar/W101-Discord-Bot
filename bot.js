require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, SlashCommandBuilder } = require('discord.js');
const schedule = require('node-schedule');
const scraper = require('./scraper');

// Bot setup
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

// Configuration from environment variables
const CONFIG = {
  token: process.env.DISCORD_TOKEN,
  channelId: process.env.CHANNEL_ID,
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 60, // Minutes
  debug: process.env.DEBUG === 'true'
};

// Validation
if (!CONFIG.token) {
  console.error('❌ DISCORD_TOKEN bulunamadı! .env dosyasını kontrol edin.');
  process.exit(1);
}

if (!CONFIG.channelId) {
  console.error('❌ CHANNEL_ID bulunamadı! .env dosyasını kontrol edin.');
  process.exit(1);
}

// State tracking
let scheduledJob = null;
let isInitialized = false;

/**
 * Sends an embed message to the configured channel
 */
async function sendNotification(title, description, hasDiscount = false) {
  try {
    const channel = bot.channels.cache.get(CONFIG.channelId);
    
    if (!channel) {
      console.error(`❌ Channel ${CONFIG.channelId} bulunamadı!`);
      return false;
    }

    if (channel.type !== ChannelType.GuildText) {
      console.error(`❌ Channel geçerli bir metin kanalı değil!`);
      return false;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(hasDiscount ? '#00aa00' : '#0099ff')
      .setTimestamp()
      .setFooter({ text: 'Wizard101 Membership Bot' });

    await channel.send({ embeds: [embed] });
    console.log(`✅ Bildirim gönderildi: ${title}`);
    return true;
  } catch (error) {
    console.error('❌ Bildirim gönderme başarısız:', error.message);
    return false;
  }
}

/**
 * Checks membership discount status
 */
async function checkMembership() {
  try {
    if (CONFIG.debug) {
      console.log('[DEBUG] Membership kontrol ediliyor...');
    }

    const result = await scraper.checkMembershipDiscount();

    if (result.error) {
      console.error('[Hata]', result.error);
      await sendNotification(
        '⚠️ Membership Kontrol Hatası',
        `Wizard101 sayfası kontrol edilirken hata oluştu:\n\`\`\`${result.error}\`\`\``,
        false
      );
      return;
    }

    // Only notify on status change
    if (result.statusChanged) {
      if (result.hasDiscount) {
        const message = scraper.formatDiscountMessage(result);
        await sendNotification(
          '🎉 Wizard101 Membership İndirim Aktif!',
          message,
          true
        );
      } else {
        const message = scraper.formatDiscountMessage(result);
        await sendNotification(
          'ℹ️ Membership Durum Güncellemesi',
          message,
          false
        );
      }
    }

    if (CONFIG.debug) {
      console.log('[DEBUG] Kontrol sonucu:', result);
    }
  } catch (error) {
    console.error('[Hata] Membership kontrol sırasında beklenmeyen hata:', error);
  }
}

/**
 * Schedules periodic membership checks
 */
function startScheduler() {
  if (scheduledJob) {
    console.log('⚠️ Scheduler zaten çalışıyor!');
    return;
  }

  // Run immediately on startup
  console.log('🚀 İlk kontrol yapılıyor...');
  checkMembership();

  // Schedule recurring checks
  const cronExpression = `*/${CONFIG.checkInterval} * * * *`; // Every N minutes
  scheduledJob = schedule.scheduleJob(cronExpression, () => {
    console.log(`⏱️ ${new Date().toLocaleString('tr-TR')} - Scheduled kontrol yapılıyor...`);
    checkMembership();
  });

  console.log(`✅ Bot başlatıldı! Her ${CONFIG.checkInterval} dakika'da kontrol yapılacak.`);
}

/**
 * Discord bot events
 */
bot.on('ready', async () => {
  console.log(`\n✅ Bot bağlandı: ${bot.user.tag}`);
  console.log(`📢 Bildirim kanalı: ${CONFIG.channelId}`);
  console.log(`⏱️ Kontrol aralığı: ${CONFIG.checkInterval} dakika\n`);

  if (!isInitialized) {
    isInitialized = true;
    startScheduler();
  }

  // Register slash commands
  try {
    const commands = [
      new SlashCommandBuilder()
        .setName('test')
        .setDescription('Test bildirim gönder - İndirim tespit edildi')
        .toJSON(),
      new SlashCommandBuilder()
        .setName('check')
        .setDescription('Wizard101 membership sayfasını şimdi kontrol et')
        .toJSON()
    ];

    await bot.application.commands.set(commands);
    console.log('✅ Slash commands kaydedildi - test, check');
  } catch (error) {
    console.error('❌ Slash command kaydı başarısız:', error.message);
  }

  // Set bot status
  bot.user.setActivity('Wizard101 Membership', { type: 'WATCHING' });
});

/**
 * Handle slash commands
 */
bot.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'test') {
    try {
      // Defer the reply
      await interaction.deferReply({ ephemeral: true });

      // Send test notification
      const testMessage = `🧪 **Test Bildirim**\n\nBu bir test bildirim mesajıdır. Bot düzgün çalışıyor!\n\n✅ Discrod bağlantısı: Başarılı\n✅ Kanal bağlantısı: Başarılı\n✅ Bildirim sistemi: Çalışıyor`;
      
      await sendNotification(
        '🎉 Wizard101 Membership İndirim Aktif!',
        testMessage,
        true
      );

      // Reply to user
      await interaction.editReply({
        content: '✅ Test bildirim gönderildi! Kanala bakın.'
      });

      console.log('🧪 Test bildirim gönderildi');
    } catch (error) {
      console.error('❌ Komut hatası:', error);
      await interaction.editReply({
        content: '❌ Hata oluştu: ' + error.message
      });
    }
  } else if (interaction.commandName === 'check') {
    try {
      // Defer the reply - PUBLIC, not ephemeral
      await interaction.deferReply();

      // Send checking message
      await interaction.editReply({
        content: '🔍 Wizard101 sayfası kontrol ediliyor...'
      });

      // Run membership check
      const result = await scraper.checkMembershipDiscount();

      if (result.error) {
        await interaction.editReply({
          content: `❌ **Hata oluştu!**\n\`\`\`${result.error}\`\`\``
        });
        return;
      }

      // Format response
      let responseMessage = '';
      if (result.hasDiscount) {
        responseMessage = `🎉 **İndirim Bulundu!**\n\n${scraper.formatDiscountMessage(result)}`;
      } else {
        responseMessage = `ℹ️ **Indirim Yok**\n\nŞu anda Wizard101 membership'te aktif bir indirim yok.\n\nSonraki otomatik kontrol: 24 saat sonra`;
      }

      await interaction.editReply({
        content: responseMessage
      });

      console.log('✅ Manuel kontrol tamamlandı - Indirim bulundu:', result.hasDiscount);
    } catch (error) {
      console.error('❌ /check komut hatası:', error);
      try {
        await interaction.editReply({
          content: '❌ Kontrol sırasında hata oluştu: ' + error.message
        });
      } catch (e) {
        console.error('❌ Reply gönderme başarısız:', e.message);
      }
    }
  }
});

bot.on('error', error => {
  console.error('❌ Bot Hatası:', error);
});

bot.on('warn', warning => {
  console.warn('⚠️ Bot Uyarısı:', warning);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Bot kapatılıyor...');
  if (scheduledJob) {
    scheduledJob.cancel();
  }
  await bot.destroy();
  process.exit(0);
});

// Start the bot
console.log('🔄 Discord bağlantısı kuruluyor...');
bot.login(CONFIG.token).catch(error => {
  console.error('❌ Discord giriş başarısız:', error.message);
  console.error('Token\'ı .env dosyasında kontrol edin!');
  process.exit(1);
});

module.exports = bot;
