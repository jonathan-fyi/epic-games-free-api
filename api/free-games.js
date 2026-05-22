import { EpicFreeGames } from "epic-free-games";

import { windowsToIana } from "../utils/timezone-mapper.js";

export default async function handler(req, res) {
  try {
    const epic = new EpicFreeGames({
      locale: "en-US",
      includeAll: true,
    });

    const data = await epic.getGames();
    console.log("data:", data);

    const currentGames = data.currentGames || [];

    const url = new URL(req.url, `http://${req.headers.host}`);
    const tzParam = url.searchParams.get("tz");
    const timezone = windowsToIana[tzParam] || "UTC";

    res.json({
      timestamp: new Date().toISOString(),
      timezone,

      current: currentGames.map((game) => {
        const promotion =
          game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0];

        return {
          title: game.title,

          endDate: promotion?.endDate
            ? new Date(promotion.endDate).toLocaleString("en-US", {
                timeZone: timezone,
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : null,

          url: game.offerMappings?.[0]?.pageSlug
            ? `https://store.epicgames.com/p/${game.offerMappings[0].pageSlug}`
            : game.productSlug && game.productSlug !== "[]"
              ? `https://store.epicgames.com/p/${game.productSlug}`
              : null,

          thumbnail:
            game.keyImages?.find((img) => img.type === "OfferImageWide")?.url ||
            game.keyImages?.[0]?.url ||
            null,
        };
      }),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch games",
      details: error.message,
    });
  }
}
