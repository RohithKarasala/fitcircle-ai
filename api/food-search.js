/* global process */

const nutrientIds = {
  calories: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fiber: 1079,
};

function normalizeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return "";
  }

  return Math.round(number * 10) / 10;
}

function getNutrient(food, nutrientId) {
  const nutrient = (food.foodNutrients ?? []).find(
    (item) => item.nutrientId === nutrientId,
  );

  return normalizeNumber(nutrient?.value);
}

function mapFood(food = {}) {
  const name = food.description?.trim() ?? "";

  if (!name) {
    return null;
  }

  return {
    id: `usda-${food.fdcId}`,
    name,
    brand:
      food.brandOwner?.trim() || food.brandName?.trim() || "",
    servingSize:
      food.householdServingFullText?.trim() ||
      (food.servingSize && food.servingSizeUnit
        ? `${food.servingSize}${food.servingSizeUnit}`
        : ""),
    source: "USDA",
    calories: getNutrient(food, nutrientIds.calories),
    protein: getNutrient(food, nutrientIds.protein),
    carbs: getNutrient(food, nutrientIds.carbs),
    fat: getNutrient(food, nutrientIds.fat),
    fiber: getNutrient(food, nutrientIds.fiber),
  };
}

export default async function handler(request, response) {
  const query = request.query.q?.trim();

  if (!query || query.length < 2) {
    return response.status(200).json({ foods: [] });
  }

  if (!process.env.USDA_API_KEY) {
    return response.status(200).json({ foods: [] });
  }

  const params = new URLSearchParams({
    api_key: process.env.USDA_API_KEY,
    query,
    pageSize: "8",
  });

  try {
    const usdaResponse = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?${params}`,
    );

    if (!usdaResponse.ok) {
      return response.status(200).json({ foods: [] });
    }

    const data = await usdaResponse.json();
    const foods = (data.foods ?? [])
      .map(mapFood)
      .filter(Boolean);

    return response.status(200).json({
      foods,
    });
  } catch (error) {
    console.error("USDA search failed:", error);
    return response.status(200).json({ foods: [] });
  }
}
