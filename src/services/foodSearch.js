import { searchOpenFoodFactsProducts } from "./openFoodFacts";

async function searchUsdaProducts(query, { signal } = {}) {
  const searchTerm = query.trim();

  if (searchTerm.length < 2) {
    return [];
  }

  const params = new URLSearchParams({ q: searchTerm });

  try {
    const response = await fetch(`/api/food-search?${params}`, {
      signal,
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.foods ?? [];
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    return [];
  }
}

function dedupeProducts(products) {
  const seen = new Set();

  return products.filter((product) => {
    const key = `${product.source ?? ""}:${
      product.id ?? product.name
    }`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function searchFoodProducts(query, { signal } = {}) {
  const [openFoodFactsResult, usdaResult] =
    await Promise.allSettled([
      searchOpenFoodFactsProducts(query, { signal }),
      searchUsdaProducts(query, { signal }),
    ]);

  return dedupeProducts([
    ...(openFoodFactsResult.status === "fulfilled"
      ? openFoodFactsResult.value
      : []),
    ...(usdaResult.status === "fulfilled"
      ? usdaResult.value
      : []),
  ]);
}
