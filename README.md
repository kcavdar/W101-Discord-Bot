# Wizard101 Membership Bot 🧙‍♂️

Discord bot'u, Wizard101 oyununda membership bölümünde indirim olup olmadığını otomatik olarak kontrol eder ve Discord kanalına bildirim gönderir.

## Özellikler

- 🔍 Otomatik web scraping ile Wizard101 membership sayfası kontrol
- 📢 Discord kanalına anlık bildirim gönderme
- ⏱️ Ayarlanabilir kontrol aralığı (varsayılan: 60 dakika)
- 🔔 İndirim durumu değiştiğinde bildirim gönderme
- 🐛 Debug modu için ayrıntılı log'lar

## Gereksinimler

- Node.js 16+ ve npm
- Discord Developer Portal'da bir bot oluşturulmuş olması
- Bot'un bildirim göndereceği Discord sunucusunda yetkileri

## Kurulum

### 1. Projeyi Klonlayın/Açın
```bash
cd "W101 Discord Botu"
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Discord Bot Oluşturun

1. [Discord Developer Portal](https://discord.com/developers/applications) açın
2. "New Application" tıklayın ve bot'a bir isim verin
3. "Bot" sekmesine gidin ve "Add Bot" tıklayın
4. "TOKEN" kısmında "Copy" tıklayın ve bot token'ını kopyalayın
5. Bot permissions'a gidin ve şu izinleri seçin:
   - Send Messages
   - Embed Links
   - Read Message History

### 4. Bot'u Sunucuya Ekleyin

1. OAuth2 → URL Generator sekmesine gidin
2. Scopes: `bot` seçin
3. Permissions: `Send Messages` ve `Embed Links` seçin
4. Oluşturulan URL'yi tarayıcıda açıp bot'u sunucunuza ekleyin

### 5. .env Dosyasını Yapılandırın

`.env` dosyasını açın ve şu bilgileri girin:

```env
# Discord Bot Token (Developer Portal'dan aldığınız token)
DISCORD_TOKEN=your_bot_token_here

# Bildirim göndereceği Discord Kanal ID'si
# Kanal ID'sini nasıl bulacağınız:
# 1. Discord'de Developer Mode'u açın (User Settings → Advanced → Developer Mode)
# 2. Bildirim göndermek istediğiniz kanala sağ tıklayın
# 3. "Copy Channel ID" seçin ve yapıştırın
CHANNEL_ID=your_channel_id_here

# Kontrol aralığı (dakika cinsinden)
CHECK_INTERVAL=60

# Debug modu (ayrıntılı log'lar için true yapın)
DEBUG=false
```

## Kullanım

### Bot'u Başlatın

**Üretim için:**
```bash
npm start
```

**Geliştirme için (otomatik yeniden başlatma):**
```bash
npm run dev
```

Bot başlatıldıktan sonra:
- ✅ "Bot bağlandı: [bot_adı]" mesajı göreceksiniz
- 📢 Ayarladığınız kanal ID'si gösterilecektir
- 🚀 İlk kontrol hemen yapılacak
- ⏱️ Sonraki kontroller ayarladığınız aralıkta yapılacak

## Nasıl Çalışır?

1. **İlk Başlangıç:** Bot başlatıldığında hemen Wizard101 membership sayfasını kontrol eder
2. **Periyodik Kontrol:** Belirlenen aralıkta (default 60 dakika) sayfayı kontrol eder
3. **İndirim Algılama:** Sayfa içeriğinde indirim anahtar kelimeleri arar
4. **Bildirim Gönderme:** İndirim durumu değiştiğinde Discord kanalına embed mesaj gönderir
5. **Hata İşleme:** Sayfaya erişemezse veya hata oluşursa bildirim gönderir

## Kontrol Aralıkları Önerisi

- **Sık kontrol:** 15 dakika (daha fazla API çağrısı, daha hızlı bildirim)
- **Normal:** 60 dakika (denge)
- **Nadir kontrol:** 240 dakika (4 saat, daha az API çağrısı)

## Sorun Giderme

### "DISCORD_TOKEN bulunamadı!" Hatası
- `.env` dosyasını kontrol edin
- `DISCORD_TOKEN=` sonra bot token'ını yapıştırdığınızdan emin olun

### "CHANNEL_ID bulunamadı!" Hatası
- Discord'de Developer Mode'u açın
- Kanal ID'sini doğru bir şekilde kopyalayıp `.env` dosyasına yapıştırın

### Bot Sunucuya Erişemiyor
- Bot'un ilgili kanal'da "Send Messages" izni var mı kontrol edin
- OAuth2 → URL Generator'dan bot'u yeniden sunucuya eklemeyi deneyin

### Hiç Bildirim Gelmiyor
- `DEBUG=true` yapın ve çıktıları kontrol edin
- Kanal ID'sinin doğru olduğundan emin olun
- Wizard101 sayfasında gerçekten indirim var mı kontrol edin

## Gelişmiş Yapılandırma

### Sayfayı Manuel Kontrol Edin

Bot.js dosyasında şu kodla manuel kontrol yapabilirsiniz:

```javascript
const scraper = require('./scraper');
scraper.checkMembershipDiscount().then(result => {
  console.log(result);
});
```

### Scraper'ı Özelleştirin

`scraper.js` dosyasında HTML elementlerini ve anahtar kelimeleri değiştirebilirsiniz:

```javascript
const discountKeywords = [
  'discount',
  'sale',
  // ... kendi anahtar kelimelerinizi ekleyin
];
```

## Lisans

MIT

## Destek

Herhangi bir sorun veya soru için lütfen repository'ye issue açın.

---

**Bot'u indirim durumunda hemen haberdar etmek istiyorsanız, CHECK_INTERVAL değerini küçültün!**
