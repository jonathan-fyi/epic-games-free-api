import { EpicFreeGames } from 'epic-free-games';

import { windowsToIana } from '../utils/timezone-mapper.js';

export default async function handler(req, res) {
  try {
    const epic = new EpicFreeGames({
      locale: 'en-US',
      includeAll: true
    });

    const data = await epic.getGames();
    const currentGames = data.currentGames || [];

    const url = new URL(req.url, `http://${req.headers.host}`);
    const tzParam = url.searchParams.get('tz');
    const timezone = windowsToIana[tzParam] || 'UTC';

    res.json({
      timestamp: new Date().toISOString(),
      timezone: timezone,
      current: currentGames.map(game => ({
        title: game.title,
        endDate: game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0]?.endDate 
          ? new Date(game.promotions.promotionalOffers[0].promotionalOffers[0].endDate).toLocaleString('en-US', { 
              timeZone: timezone,
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : null,
        url: game.productSlug ? `https://store.epicgames.com/en-US/p/${game.productSlug}` : null,
        thumbnail: game.keyImages?.find(img => img.type === 'OfferImageWide')?.url || null
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games', details: error.message });
  }
}
