/**
 * Keyword → store-specific category URL mapping.
 * Used as a fallback when search pages fail or return empty results.
 *
 * Keys are matched against the search query (substring or token match).
 * Add new categories here to improve scraper coverage.
 *
 * Stores: grocera | jamoona | littleindia | nammamarkt | dookan | swadesh | angaadi | spicevillage
 */
export const categoryMap: Record<string, Partial<{
    grocera: string; jamoona: string; littleindia: string; nammamarkt: string;
    dookan: string; swadesh: string; angaadi: string; spicevillage: string;
}>> = {
    // ── Rice ────────────────────────────────────────────────────────────────────
    "basmati rice": {
        grocera: "/category/rice-products/basmati-rice",
        jamoona: "/collections/basmati-rice",
        littleindia: "/product-category/rice/basmati-rice/",
        nammamarkt: "/collections/basmati-rice",
        dookan: "/collections/basmati-rice",
        swadesh: "/collections/basmati-rice",
        angaadi: "/product-category/rice/",
        spicevillage: "/product-category/rice/",
    },
    "sona masoori": {
        grocera: "/category/rice-products/sona-masoori-rice",
        jamoona: "/collections/sona-masoori-rice",
        littleindia: "/product-category/rice/sona-masoori-rice/",
        nammamarkt: "/collections/rice",
        dookan: "/collections/sona-masoori-rice-1",
        swadesh: "/collections/rice",
        angaadi: "/product-category/rice/",
        spicevillage: "/product-category/rice/",
    },
    rice: {
        grocera: "/category/rice-products",
        jamoona: "/collections/rice",
        littleindia: "/product-category/rice/",
        nammamarkt: "/collections/rice",
        dookan: "/collections/basmati-rice",
        swadesh: "/collections/rice",
        angaadi: "/product-category/rice/",
        spicevillage: "/product-category/rice/",
    },
    // ── Flour ───────────────────────────────────────────────────────────────────
    atta: {
        grocera: "/category/flour-products/wheat-flour-atta",
        jamoona: "/collections/wheat-flour-atta",
        littleindia: "/product-category/atta-flour-sooji/atta/",
        nammamarkt: "/collections/flour",
        dookan: "/collections/chapati-flour-wheat-flour",
        swadesh: "/collections/flour",
        angaadi: "/product-category/atta-flour-and-sooji/",
        spicevillage: "/product-category/flour/",
    },
    besan: {
        grocera: "/category/flour-products/gram-flour-besan",
        jamoona: "/collections/gram-flour-besan",
        littleindia: "/product-category/atta-flour-sooji/flour/",
        nammamarkt: "/collections/flour",
        dookan: "/collections/misc-flours-and-flour-mixes",
        swadesh: "/collections/flour",
        angaadi: "/product-category/atta-flour-and-sooji/",
        spicevillage: "/product-category/flour/",
    },
    flour: {
        grocera: "/category/flour-products",
        jamoona: "/collections/flour",
        littleindia: "/product-category/atta-flour-sooji/",
        nammamarkt: "/collections/flour",
        dookan: "/collections/chapati-flour-wheat-flour",
        swadesh: "/collections/flour",
        angaadi: "/product-category/atta-flour-and-sooji/",
        spicevillage: "/product-category/flour/",
    },
    // ── Lentils & Dal ───────────────────────────────────────────────────────────
    "toor dal": {
        grocera: "/category/lentils-beans/pigeon-peas-toor-dal",
        jamoona: "/collections/pigeon-peas-toor-dal",
        littleindia: "/product-category/pulses-lentils/",
        nammamarkt: "/collections/lentils",
        dookan: "/collections/lentils-and-whole-grains",
        swadesh: "/collections/lentils",
        angaadi: "/product-category/pulses-lentil/",
        spicevillage: "/product-category/lentils/",
    },
    "moong dal": {
        grocera: "/category/lentils-beans/green-beans-moong-dal",
        jamoona: "/collections/green-beans-moong-dal",
        littleindia: "/product-category/pulses-lentils/",
        nammamarkt: "/collections/lentils",
        dookan: "/collections/lentils-and-whole-grains",
        swadesh: "/collections/lentils",
        angaadi: "/product-category/pulses-lentil/",
        spicevillage: "/product-category/lentils/",
    },
    "chana dal": {
        grocera: "/category/lentils-beans",
        jamoona: "/collections/lentils-dal",
        littleindia: "/product-category/pulses-lentils/",
        nammamarkt: "/collections/lentils",
        dookan: "/collections/lentils-and-whole-grains",
        swadesh: "/collections/lentils",
        angaadi: "/product-category/pulses-lentil/",
        spicevillage: "/product-category/lentils/",
    },
    dal: {
        grocera: "/category/lentils-beans",
        jamoona: "/collections/lentils-dal",
        littleindia: "/product-category/pulses-lentils/",
        nammamarkt: "/collections/lentils",
        dookan: "/collections/lentils-and-whole-grains",
        swadesh: "/collections/lentils",
        angaadi: "/product-category/pulses-lentil/",
        spicevillage: "/product-category/lentils/",
    },
    lentils: {
        grocera: "/category/lentils-beans",
        jamoona: "/collections/lentils-dal",
        littleindia: "/product-category/pulses-lentils/",
        nammamarkt: "/collections/lentils",
        dookan: "/collections/lentils-and-whole-grains",
        swadesh: "/collections/lentils",
        angaadi: "/product-category/pulses-lentil/",
        spicevillage: "/product-category/lentils/",
    },
    // ── Spices ──────────────────────────────────────────────────────────────────
    spices: {
        grocera: "/category/spices",
        jamoona: "/collections/spices",
        littleindia: "/product-category/spices-masala/",
        nammamarkt: "/collections/spices",
        dookan: "/collections/ground-spices",
        swadesh: "/collections/spices",
        angaadi: "/product-category/spices/",
        spicevillage: "/product-category/spices/",
    },
    masala: {
        grocera: "/category/spices",
        jamoona: "/collections/spices",
        littleindia: "/product-category/spices-masala/",
        nammamarkt: "/collections/spices",
        dookan: "/collections/spice-blends",
        swadesh: "/collections/spices",
        angaadi: "/product-category/spices/",
        spicevillage: "/product-category/spices/",
    },
    turmeric: {
        grocera: "/category/spices",
        jamoona: "/collections/spices",
        littleindia: "/product-category/spices-masala/",
        nammamarkt: "/collections/spices",
        dookan: "/collections/ground-spices",
        swadesh: "/collections/spices",
        angaadi: "/product-category/spices/ground-spices/",
        spicevillage: "/product-category/spices/",
    },
    cumin: {
        grocera: "/category/spices",
        jamoona: "/collections/spices",
        littleindia: "/product-category/spices-masala/",
        nammamarkt: "/collections/spices",
        dookan: "/collections/whole-spices",
        swadesh: "/collections/spices",
        angaadi: "/product-category/spices/whole-spices/",
        spicevillage: "/product-category/spices/",
    },
    cardamom: {
        grocera: "/category/spices",
        jamoona: "/collections/spices",
        littleindia: "/product-category/spices-masala/",
        nammamarkt: "/collections/spices",
        dookan: "/collections/whole-spices",
        swadesh: "/collections/spices",
        angaadi: "/product-category/spices/whole-spices/",
        spicevillage: "/product-category/spices/",
    },
    // ── Oil & Ghee ──────────────────────────────────────────────────────────────
    ghee: {
        grocera: "/category/oil-ghee",
        jamoona: "/collections/butter-ghee",
        littleindia: "/product-category/oil-ghee/",
        nammamarkt: "/collections/ghee",
        dookan: "/collections/cooking-oils-and-ghee",
        swadesh: "/collections/ghee",
        angaadi: "/product-category/oil-ghee/",
        spicevillage: "/product-category/oil-ghee/",
    },
    oil: {
        grocera: "/category/oil-ghee",
        jamoona: "/collections/cooking-oil",
        littleindia: "/product-category/oil-ghee/",
        nammamarkt: "/collections/oil",
        dookan: "/collections/cooking-oils-and-ghee",
        swadesh: "/collections/oil",
        angaadi: "/product-category/oil-ghee/",
        spicevillage: "/product-category/oil-ghee/",
    },
    // ── Dairy & Fresh ────────────────────────────────────────────────────────────
    dairy: {
        grocera: "/category/cold-frozen",
        jamoona: "/collections/dairy",
        littleindia: "/product-category/dairy/",
        nammamarkt: "/collections/dairy",
        dookan: "/collections/dairy",
        swadesh: "/collections/dairy",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/dairy/",
    },
    paneer: {
        grocera: "/category/cold-frozen/paneer-batter",
        jamoona: "/collections/fresh-paneer-batter",
        littleindia: "/product-category/dairy/",
        nammamarkt: "/collections/dairy",
        dookan: "/collections/dairy",
        swadesh: "/collections/dairy",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/dairy/",
    },
    curd: {
        grocera: "/category/cold-frozen",
        jamoona: "/collections/dairy",
        littleindia: "/product-category/dairy/",
        nammamarkt: "/collections/dairy",
        dookan: "/collections/dairy",
        swadesh: "/collections/dairy",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/dairy/",
    },
    yogurt: {
        grocera: "/category/cold-frozen",
        jamoona: "/collections/dairy",
        littleindia: "/product-category/dairy/",
        nammamarkt: "/collections/dairy",
        dookan: "/collections/dairy",
        swadesh: "/collections/dairy",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/dairy/",
    },
    yoghurt: {
        grocera: "/category/cold-frozen",
        jamoona: "/collections/dairy",
        littleindia: "/product-category/dairy/",
        nammamarkt: "/collections/dairy",
        dookan: "/collections/dairy",
        swadesh: "/collections/dairy",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/dairy/",
    },
    dahi: {
        grocera: "/category/cold-frozen",
        jamoona: "/collections/dairy",
        littleindia: "/product-category/dairy/",
        nammamarkt: "/collections/dairy",
        dookan: "/collections/dairy",
        swadesh: "/collections/dairy",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/dairy/",
    },
    butter: {
        grocera: "/category/cold-frozen",
        jamoona: "/collections/butter-ghee",
        littleindia: "/product-category/dairy/",
        nammamarkt: "/collections/dairy",
        dookan: "/collections/dairy",
        swadesh: "/collections/dairy",
        angaadi: "/product-category/oil-ghee/",
        spicevillage: "/product-category/dairy/",
    },
    milk: {
        grocera: "/category/cold-frozen",
        jamoona: "/collections/dairy",
        littleindia: "/product-category/dairy/",
        nammamarkt: "/collections/dairy",
        dookan: "/collections/dairy",
        swadesh: "/collections/dairy",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/dairy/",
    },
    cheese: {
        grocera: "/category/cold-frozen",
        jamoona: "/collections/dairy",
        littleindia: "/product-category/dairy/",
        nammamarkt: "/collections/dairy",
        dookan: "/collections/dairy",
        swadesh: "/collections/dairy",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/dairy/",
    },
    // ── Fresh Produce & Condiments ───────────────────────────────────────────────
    lemon: {
        grocera: "/category/fresh-produce",
        jamoona: "/collections/fresh-produce",
        littleindia: "/product-category/fresh-produce/",
        nammamarkt: "/collections/fresh",
        dookan: "/collections/fruits-veggies",
        swadesh: "/collections/fresh",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/fresh/",
    },
    lime: {
        grocera: "/category/fresh-produce",
        jamoona: "/collections/fresh-produce",
        littleindia: "/product-category/fresh-produce/",
        nammamarkt: "/collections/fresh",
        dookan: "/collections/fruits-veggies",
        swadesh: "/collections/fresh",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/fresh/",
    },
    tomato: {
        grocera: "/category/fresh-produce",
        jamoona: "/collections/fresh-produce",
        littleindia: "/product-category/fresh-produce/",
        nammamarkt: "/collections/fresh",
        dookan: "/collections/fruits-veggies",
        swadesh: "/collections/fresh",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/fresh/",
    },
    onion: {
        grocera: "/category/fresh-produce",
        jamoona: "/collections/fresh-produce",
        littleindia: "/product-category/fresh-produce/",
        nammamarkt: "/collections/fresh",
        dookan: "/collections/fruits-veggies",
        swadesh: "/collections/fresh",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/fresh/",
    },
    ginger: {
        grocera: "/category/fresh-produce",
        jamoona: "/collections/fresh-produce",
        littleindia: "/product-category/fresh-produce/",
        nammamarkt: "/collections/fresh",
        dookan: "/collections/fruits-veggies",
        swadesh: "/collections/fresh",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/fresh/",
    },
    garlic: {
        grocera: "/category/fresh-produce",
        jamoona: "/collections/fresh-produce",
        littleindia: "/product-category/fresh-produce/",
        nammamarkt: "/collections/fresh",
        dookan: "/collections/fruits-veggies",
        swadesh: "/collections/fresh",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/fresh/",
    },
    coriander: {
        grocera: "/category/spices",
        jamoona: "/collections/spices",
        littleindia: "/product-category/spices-masala/",
        nammamarkt: "/collections/spices",
        dookan: "/collections/ground-spices",
        swadesh: "/collections/spices",
        angaadi: "/product-category/spices/",
        spicevillage: "/product-category/spices/",
    },
    // ── Snacks ──────────────────────────────────────────────────────────────────
    snacks: {
        grocera: "/category/snacks-sweets",
        jamoona: "/collections/snacks-sweets",
        littleindia: "/product-category/snacks-namkeen/",
        nammamarkt: "/collections/snacks",
        dookan: "/collections/savoury-snacks",
        swadesh: "/collections/snacks",
        angaadi: "/product-category/namkeen-sweets-snacks/",
        spicevillage: "/product-category/snacks/",
    },
    namkeen: {
        grocera: "/category/snacks-sweets",
        jamoona: "/collections/snacks-sweets",
        littleindia: "/product-category/snacks-namkeen/",
        nammamarkt: "/collections/snacks",
        dookan: "/collections/savoury-snacks",
        swadesh: "/collections/snacks",
        angaadi: "/product-category/namkeen-sweets-snacks/",
        spicevillage: "/product-category/snacks/",
    },
    biscuit: {
        grocera: "/category/snacks-sweets",
        jamoona: "/collections/snacks-sweets",
        littleindia: "/product-category/snacks-namkeen/",
        nammamarkt: "/collections/snacks",
        dookan: "/collections/cookies",
        swadesh: "/collections/snacks",
        angaadi: "/product-category/namkeen-sweets-snacks/",
        spicevillage: "/product-category/snacks/",
    },
    // ── Beverages ───────────────────────────────────────────────────────────────
    chai: {
        grocera: "/category/coffee-tea",
        jamoona: "/collections/tea",
        littleindia: "/product-category/tea-coffee/",
        nammamarkt: "/collections/tea",
        dookan: "/collections/tea",
        swadesh: "/collections/tea",
        angaadi: "/product-category/tea-coffee-drinks/",
        spicevillage: "/product-category/tea/",
    },
    tea: {
        grocera: "/category/coffee-tea",
        jamoona: "/collections/tea",
        littleindia: "/product-category/tea-coffee/",
        nammamarkt: "/collections/tea",
        dookan: "/collections/tea",
        swadesh: "/collections/tea",
        angaadi: "/product-category/tea-coffee-drinks/",
        spicevillage: "/product-category/tea/",
    },
    coffee: {
        grocera: "/category/coffee-tea",
        jamoona: "/collections/coffee",
        littleindia: "/product-category/tea-coffee/",
        nammamarkt: "/collections/coffee",
        dookan: "/collections/coffee",
        swadesh: "/collections/coffee",
        angaadi: "/product-category/tea-coffee-drinks/",
        spicevillage: "/product-category/coffee/",
    },
    // ── Condiments & Pickles ────────────────────────────────────────────────────
    pickle: {
        grocera: "/category/pickles-condiments/pickles-chutneys",
        jamoona: "/collections/pickles",
        littleindia: "/product-category/pickles-chutneys/",
        nammamarkt: "/collections/pickles",
        dookan: "/collections/pickles",
        swadesh: "/collections/pickles",
        angaadi: "/product-category/pickle/",
        spicevillage: "/product-category/pickles/",
    },
    chutney: {
        grocera: "/category/pickles-condiments/pickles-chutneys",
        jamoona: "/collections/pickles",
        littleindia: "/product-category/pickles-chutneys/",
        nammamarkt: "/collections/pickles",
        dookan: "/collections/pickles",
        swadesh: "/collections/pickles",
        angaadi: "/product-category/pickle/",
        spicevillage: "/product-category/pickles/",
    },
    // ── Frozen ──────────────────────────────────────────────────────────────────
    frozen: {
        grocera: "/category/cold-frozen",
        jamoona: "/collections/frozen",
        littleindia: "/product-category/frozen/",
        nammamarkt: "/collections/frozen",
        dookan: "/collections/ready-to-eat",
        swadesh: "/collections/frozen",
        angaadi: "/product-category/other-essentials/",
        spicevillage: "/product-category/frozen/",
    },
    // ── Sweets & Mithai ─────────────────────────────────────────────────────────
    mithai: {
        grocera: "/category/snacks-sweets",
        jamoona: "/collections/sweets-mithai",
        littleindia: "/product-category/sweets/",
        nammamarkt: "/collections/sweets",
        dookan: "/collections/sweets",
        swadesh: "/collections/sweets",
        angaadi: "/product-category/namkeen-sweets-snacks/",
        spicevillage: "/product-category/sweets/",
    },
    sweets: {
        grocera: "/category/snacks-sweets",
        jamoona: "/collections/sweets-mithai",
        littleindia: "/product-category/sweets/",
        nammamarkt: "/collections/sweets",
        dookan: "/collections/sweets",
        swadesh: "/collections/sweets",
        angaadi: "/product-category/namkeen-sweets-snacks/",
        spicevillage: "/product-category/sweets/",
    },
    halwa: {
        grocera: "/category/snacks-sweets",
        jamoona: "/collections/sweets-mithai",
        littleindia: "/product-category/sweets/",
        nammamarkt: "/collections/sweets",
        dookan: "/collections/sweets",
        swadesh: "/collections/sweets",
        angaadi: "/product-category/namkeen-sweets-snacks/",
        spicevillage: "/product-category/sweets/",
    },
};

/**
 * Find a category URL for a given store based on the search query.
 * Supports partial token matching (e.g., "lemon juice" → matches "lemon").
 */
export function findCategoryUrl(
    query: string,
    store: keyof Partial<{
        grocera: string; jamoona: string; littleindia: string; nammamarkt: string;
        dookan: string; swadesh: string; angaadi: string; spicevillage: string;
    }>
): string | null {
    const q = query.toLowerCase().trim();
    const qTokens = q.split(/\s+/);

    // First try exact / substring match
    for (const [key, urls] of Object.entries(categoryMap)) {
        if (q.includes(key) || key.includes(q)) {
            return (urls as any)[store] || null;
        }
    }

    // Then try token-by-token match (e.g., "lemon juice" → check if "lemon" exists as a key)
    for (const token of qTokens) {
        if (token.length < 3) continue;
        for (const [key, urls] of Object.entries(categoryMap)) {
            if (key === token || key.startsWith(token) || token.startsWith(key)) {
                return (urls as any)[store] || null;
            }
        }
    }

    return null;
}
