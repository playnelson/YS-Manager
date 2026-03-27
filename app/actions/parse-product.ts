'use server';

import * as cheerio from 'cheerio';

export async function parseProductUrl(url: string) {
  try {
    // Basic validation
    new URL(url);

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return { success: false, error: 'Cannot fetch URL' };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Get Title
    let title = 
      $('meta[property="og:title"]').attr('content') || 
      $('meta[name="twitter:title"]').attr('content') || 
      $('title').text() || 
      '';

    // Get Image
    let image = 
      $('meta[property="og:image"]').attr('content') || 
      $('meta[name="twitter:image"]').attr('content') || 
      '';

    // Get Price (Basic attempts)
    let price: number | undefined;
    
    // Attempt 1: standard OG/meta elements
    let priceStr = 
      $('meta[property="product:price:amount"]').attr('content') ||
      $('meta[property="price"]').attr('content') ||
      $('meta[name="twitter:data1"]').attr('content'); // Often used for price on twitter cards
    
    // Attempt 2: specific merchant markups
    if (!priceStr) {
      priceStr = $('span[itemprop="price"]').attr('content');
    }

    if (priceStr) {
      // Clean up string like "R$ 54,90" or "54.90"
      const cleanPrice = priceStr.replace(/[^0-9,.]/g, '').replace(',', '.');
      const parsed = parseFloat(cleanPrice);
      if (!isNaN(parsed) && parsed > 0) {
        price = parsed;
      }
    }

    // Clean up title (remove " | MercadoLivre", "- Amazon" etc.)
    if (title) {
        title = title.split(' | ')[0];
        title = title.split(' - ')[0];
        title = title.trim();
    }

    return { 
      success: true, 
      data: {
        title,
        price,
        image
      } 
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erro ao processar o link' };
  }
}
