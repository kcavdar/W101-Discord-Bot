const axios = require('axios');
const cheerio = require('cheerio');

const MEMBERSHIP_URL = 'https://www.wizard101.com/game/membership';

// Store the last known state to detect changes
let lastStatus = {
  hasDiscount: null,
  discountInfo: '',
  lastChecked: null,
  priceInfo: ''
};

/**
 * Fetches and parses the Wizard101 membership page
 * Returns information about current discounts
 */
async function checkMembershipDiscount() {
  try {
    console.log('[Scraper] Checking membership page...');
    
    const response = await axios.get(MEMBERSHIP_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const currentStatus = {
      hasDiscount: false,
      discountInfo: '',
      membershipOptions: [],
      lastChecked: new Date().toLocaleString('tr-TR')
    };

    // Get page text to search for active discount keywords
    const pageText = $.text();
    const pageTextLower = pageText.toLowerCase();

    // Keywords that indicate ACTIVE discount (not just general mentions)
    const activeDiscountKeywords = [
      'special offer',
      'limited time',
      'limited time offer',
      'limited time only',
      'save',
      'off',
      '% off',
      'sale',
      'special price',
      'promo',
      'özet fiyat',
      'sınırlı zaman',
      'özel fiyat',
      'tasarruf'
    ];

    // Check for ACTIVE discount indicators
    const hasActiveDiscount = activeDiscountKeywords.some(keyword => 
      pageTextLower.includes(keyword)
    );

    // Extract membership options with prices
    const membershipPattern = /([A-Z\s]+(?:MONTH|YEAR|ANNUAL|FAMILY))\s*[^\d]*\$?([\d.]+)/gi;
    let match;
    const options = [];
    
    while ((match = membershipPattern.exec(pageText)) !== null) {
      const type = match[1].trim();
      const price = parseFloat(match[2]);
      if (type && price && price > 0) {
        options.push({
          type: type,
          price: price
        });
      }
    }

    // Remove duplicates
    currentStatus.membershipOptions = [...new Map(
      options.map(item => [item.type, item])
    ).values()];

    // Look for discount description near pricing
    const discountElement = $('body').text().match(/(?:save|off|discount|special|limited time)[^.!?]*(?:\d+%|[^\n]*special[^\n]*)/gi);
    if (discountElement && discountElement.length > 0) {
      currentStatus.discountInfo = discountElement[0].trim().substring(0, 200);
    }

    currentStatus.hasDiscount = hasActiveDiscount && currentStatus.membershipOptions.length > 0;

    console.log(`[Scraper] Discount found: ${currentStatus.hasDiscount}, Options: ${currentStatus.membershipOptions.length}`);

    // Compare with last status to detect changes
    const statusChanged = lastStatus.hasDiscount !== currentStatus.hasDiscount;
    
    lastStatus = currentStatus;

    return {
      hasDiscount: currentStatus.hasDiscount,
      discountInfo: currentStatus.discountInfo,
      membershipOptions: currentStatus.membershipOptions,
      lastChecked: currentStatus.lastChecked,
      statusChanged: statusChanged
    };

  } catch (error) {
    console.error('[Scraper] Error checking membership page:', error.message);
    return {
      hasDiscount: null,
      error: error.message,
      lastChecked: new Date().toLocaleString('tr-TR')
    };
  }
}

/**
 * Returns the last known status
 */
function getLastStatus() {
  return lastStatus;
}

/**
 * Formats the discount information for Discord message
 */
function formatDiscountMessage(discountData) {
  if (discountData.error) {
    return `❌ Membership sayfası kontrol edilirken bir hata oluştu:\n\`\`\`${discountData.error}\`\`\``;
  }

  if (discountData.hasDiscount) {
    let message = `✅ **Wizard101 Membership'te İndirim Aktif!**\n`;
    
    if (discountData.discountInfo) {
      message += `\n📢 **İndirim Açıklaması:**\n${discountData.discountInfo}\n`;
    }
    
    if (discountData.membershipOptions && discountData.membershipOptions.length > 0) {
      message += `\n💰 **Membership Seçenekleri:**\n`;
      discountData.membershipOptions.forEach(option => {
        message += `  • ${option.type}: $${option.price.toFixed(2)}\n`;
      });
    }
    
    message += `\n🔗 Daha fazla bilgi: ${MEMBERSHIP_URL}`;
    return message;
  } else {
    return `ℹ️ Şu anda Wizard101 Membership'te aktif indirim yok.\n\nNormal Fiyatlar:\n  • Family: $6.95/Ay\n  • 1 Ay: $9.95\n  • 6 Ay: $49.95\n  • 1 Yıl: $79.95`;
  }
}

module.exports = {
  checkMembershipDiscount,
  getLastStatus,
  formatDiscountMessage,
  MEMBERSHIP_URL
};
