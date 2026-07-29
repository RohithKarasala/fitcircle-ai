const SEARCH_URL =
  "https://world.openfoodfacts.org/api/v2/search";
const SEARCH_CACHE_KEY = "fitcircle-open-food-facts-search";

const searchCache = new Map(readSearchCache());

function readSearchCache() {
  try {
    return Object.entries(
      JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) ?? "{}"),
    );
  } catch {
    return [];
  }
}

function writeSearchCache() {
  try {
    localStorage.setItem(
      SEARCH_CACHE_KEY,
      JSON.stringify(Object.fromEntries(searchCache.entries())),
    );
  } catch {
    // Cache is a convenience only; nutrition logging should keep working.
  }
}

function normalizeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return "";
  }

  return Math.round(number * 10) / 10;
}

function getCalories(nutriments = {}) {
  return normalizeNumber(
    nutriments["energy-kcal_100g"] ??
      nutriments["energy-kcal"] ??
      nutriments.energy_kcal_100g,
  );
}

function mapProduct(product = {}) {
  const nutriments = product.nutriments ?? {};
  const name =
    product.product_name?.trim() ||
    product.product_name_en?.trim() ||
    "";

  if (!name) {
    return null;
  }

  return {
    id: product.code || name,
    name,
    brand: product.brands?.split(",")[0]?.trim() ?? "",
    servingSize: product.serving_size ?? "",
    calories: getCalories(nutriments),
    protein: normalizeNumber(nutriments.proteins_100g),
    carbs: normalizeNumber(nutriments.carbohydrates_100g),
    fat: normalizeNumber(nutriments.fat_100g),
    fiber: normalizeNumber(nutriments.fiber_100g),
    water: "",
  };
}

export async function searchFoodProducts(query, { signal } = {}) {
  const searchTerm = query.trim().toLowerCase();

  if (searchTerm.length < 2) {
    return [];
  }

  if (searchCache.has(searchTerm)) {
    return searchCache.get(searchTerm);
  }

  const params = new URLSearchParams({
    search_terms: searchTerm,
    page_size: "6",
    fields:
      "code,product_name,product_name_en,brands,serving_size,nutriments",
  });

  try {
    const response = await fetch(`${SEARCH_URL}?${params}`, {
      signal,
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const products = (data.products ?? [])
      .map(mapProduct)
      .filter(Boolean);

    searchCache.set(searchTerm, products);
    writeSearchCache();

    return products;
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    return [];
  }
}
