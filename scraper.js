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
      priceInfo: '',
      lastChecked: new Date().toLocaleString('tr-TR'),
      rawText: ''
    };

    // Look for discount indicators in common HTML patterns
    // Adjust selectors based on actual page structure
    const pageText = $.text().toLowerCase();
    currentStatus.rawText = pageText;

    // Check for common discount keywords
    const discountKeywords = [
      'discount',
      'sale',
      'off',
      'indirim',
      'özel fiyat',
      'sınırlı zaman',
      'limited time',
      'promotion',
      'promosyon'
    ];

    currentStatus.hasDiscount = discountKeywords.some(keyword => 
      pageText.includes(keyword)
    );

    // Try to extract price information
    const pricePattern = /\$?\d+(?:\.\d{2})?/g;
    const prices = pageText.match(pricePattern);
    if (prices) {
      currentStatus.priceInfo = prices.slice(0, 5).join(', '); // Get first 5 prices
    }

    // Look for specific discount text
    const discountSelectors = [
      '.discount',
      '.sale',
      '.promo',
      '[class*="discount"]',
      '[class*="sale"]',
      '[class*="promo"]',
      '.price-tag',
      '.special-offer'
    ];

    for (const selector of discountSelectors) {
      const element = $(selector).text();
      if (element) {
        currentStatus.discountInfo = element.substring(0, 200);
        break;
      }
    }

    // Compare with last status to detect changes
    const statusChanged = lastStatus.hasDiscount !== currentStatus.hasDiscount;
    
    lastStatus = currentStatus;

    return {
      hasDiscount: currentStatus.hasDiscount,
      discountInfo: currentStatus.discountInfo,
      priceInfo: currentStatus.priceInfo,
      lastChecked: currentStatus.lastChecked,
      statusChanged: statusChanged,
      previousStatus: lastStatus.hasDiscount
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
    return `✅ **Wizard101 Membership İndirim Var!**\n${
      discountData.discountInfo ? `📢 ${discountData.discountInfo.substring(0, 150)}\n` : ''
    }${
      discountData.priceInfo ? `💰 Fiyatlar: ${discountData.priceInfo}\n` : ''
    }Daha fazla bilgi: <${MEMBERSHIP_URL}>`;
  } else {
    return `ℹ️ Şu anda Wizard101 Membership'te aktif indirim yok.\nSonraki kontrol: ...`;
  }
}

module.exports = {
  checkMembershipDiscount,
  getLastStatus,
  formatDiscountMessage,
  MEMBERSHIP_URL
};
