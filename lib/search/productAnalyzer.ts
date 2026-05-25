/**
 * Smart Product Analyzer Bot & Image Classifier Heuristics
 * Analyzes product name and image URL metadata/filename to detect visual-textual mismatches,
 * automatically corrects categories, and demotes search relevance.
 */

export interface AnalysisResult {
    isMismatch: boolean;
    detectedCategory: string | null;
    confidence: 'high' | 'medium' | 'low';
    reason: string | null;
    isNamkeen?: boolean;
    isBiscuit?: boolean;
    isChips?: boolean;
}

/**
 * Analyzes a product based on its name and its image URL path.
 * Many e-commerce sites (Shopify, WooCommerce) use descriptive image filenames
 * (e.g. 'maggi-atta-noodles-72gm.jpg' or 'aashirvaad-atta-5kg.png'), which are extremely
 * reliable indicators of what the product actually is.
 */
export function analyzeProductImageAndName(
    name: string,
    imageUrl: string | null | undefined,
    currentCategory?: string
): AnalysisResult {
    const nameLower = name.toLowerCase();
    const imageLower = imageUrl ? imageUrl.toLowerCase() : '';
    
    // Extract filename from image URL if present
    let imageFilename = '';
    try {
        if (imageUrl) {
            const urlPath = imageUrl.split('?')[0]; // Remove query params
            const parts = urlPath.split('/');
            imageFilename = decodeURIComponent(parts[parts.length - 1] || '');
        }
    } catch (e) {
        imageFilename = '';
    }
    
    const combinedText = `${nameLower} ${imageFilename}`;
    
    // 1. Instant / Noodles / Pasta detection (Highest priority to fix the "Maggi Atta Noodles" issue)
    const instantKeywords = /\b(noodle|noodles|pasta|spaghetti|macaroni|vermicelli|ramen|instant|cup-a-soup|maggi|koka|indomie|wai\s*wai|yippee|chings|chow\s*mein|soba|udon)\b/;
    if (instantKeywords.test(combinedText)) {
        return {
            isMismatch: currentCategory !== 'instant' && currentCategory !== 'snacks',
            detectedCategory: 'instant',
            confidence: 'high',
            reason: `Found noodle/instant keyword in name or image: "${nameLower}" / "${imageFilename}"`
        };
    }
    
    // 1.5. Sweets / Mithai / Dessert detection
    const sweetsKeywords = /\b(sweet|sweets|mithai|halwa|ladoo|laddu|barfi|pedha|peda|rasgulla|gulab\s+jamun|kheer|dessert|soan\s+papdi|rasmalai|jalebi|cham\s+cham|sandesh)\b/;
    if (sweetsKeywords.test(combinedText)) {
        return {
            isMismatch: currentCategory !== 'sweets',
            detectedCategory: 'sweets',
            confidence: 'high',
            reason: `Found sweet/mithai keyword in name or image: "${nameLower}" / "${imageFilename}"`
        };
    }
    
    // 2. Snacks detection
    const snacksKeywords = /\b(rusk|rusks|toast|drycake|snack|namkeen|chips|biscuit|cookie|biscuits|cookies|mixture|sev|bhujia|papads|papad|murukku|gathia|khatta\s+meetha|navrattan|panchrattan|dalmoth|chanachur|all\s+in\s+one|puri|crackers|mathri|mathis|mathi|mathia|khakhra|gathiya|pakoda|pakora|chivda|farsan|boondi|bikaneri|ratlami|bhakarwadi|bakharwadi|chana\s+chor|moong\s+dal\s+snack|salted\s+peanuts|moong\s+dal\s+salted|sing\s+bhujia|karasev)\b/;
    if (snacksKeywords.test(combinedText)) {
        const isBiscuit = /\b(rusk|rusks|toast|drycake|biscuit|cookie|biscuits|cookies|bourbon|marie|good\s+day|hide\s+seek|oreo|monaco|krackjack|parle-g|digestive|milkbikis|unibic|crackers)\b/.test(combinedText);
        const isChips = /\b(chips|chip|crisps|crisp|lays|lay's|kurkure|pringles|doritos|potato\s+chips)\b/.test(combinedText);
        const isNamkeen = /\b(namkeen|mixture|sev|bhujia|murukku|gathia|gathiya|ghatiya|khatta\s+meetha|navrattan|panchrattan|dalmoth|chanachur|all\s+in\s+one|mathri|mathis|mathi|mathia|khakhra|chivda|farsan|boondi|bikaneri|ratlami|bhakarwadi|bakharwadi|chana\s+chor|karasev|pakoda|pakora)\b/.test(combinedText) || 
            (!isBiscuit && !isChips && /\b(haldiram|bikano|balaji|gopal|bikaji|cofresh)\b/.test(combinedText) && /\b(snack|snacks|dal|peanuts|grams)\b/.test(combinedText));

        return {
            isMismatch: currentCategory !== 'snacks',
            detectedCategory: 'snacks',
            confidence: 'high',
            reason: `Found snack keyword in name or image: "${nameLower}" / "${imageFilename}"`,
            isNamkeen,
            isBiscuit,
            isChips
        };
    }

    // 3. Oil & Ghee detection
    const oilGheeKeywords = /\b(ghee|oil|mustard\s+oil|coconut\s+oil|sunflower\s+oil|vegetable\s+oil|sesame\s+oil|olive\s+oil)\b/;
    if (oilGheeKeywords.test(combinedText)) {
        return {
            isMismatch: currentCategory !== 'oil-ghee',
            detectedCategory: 'oil-ghee',
            confidence: 'high',
            reason: `Found oil/ghee keyword in name or image: "${nameLower}" / "${imageFilename}"`
        };
    }

    // 4. Lentils / Dal detection
    const lentilsKeywords = /\b(dal|daal|lentil|lentils|bean|beans|chana|toor|moong|masoor|rajma|lobia|urad|kabuli|pigeon\s*pea|gram\s*dal|urad\s*dal|moong\s*dal)\b/;
    if (lentilsKeywords.test(combinedText)) {
        // If it's gram flour (besan), keep it as flour
        if (/\b(flour|besan)\b/.test(nameLower)) {
            return { isMismatch: false, detectedCategory: 'flour', confidence: 'high', reason: null };
        }
        return {
            isMismatch: currentCategory !== 'lentils',
            detectedCategory: 'lentils',
            confidence: 'high',
            reason: `Found lentils keyword in name or image: "${nameLower}" / "${imageFilename}"`
        };
    }

    // 5. Flour detection
    const flourKeywords = /\b(atta|aata|flour|besan|maida|sooji|suji|rava|semolina|chapati\s+flour|whole\s+wheat)\b/;
    if (flourKeywords.test(combinedText)) {
        return {
            isMismatch: currentCategory !== 'flour',
            detectedCategory: 'flour',
            confidence: 'high',
            reason: `Found flour keyword in name or image: "${nameLower}" / "${imageFilename}"`
        };
    }

    // 6. Rice detection
    const riceKeywords = /\b(rice|chawal|basmati|sona|sonamasoori|poha|flattened\s+rice)\b/;
    if (riceKeywords.test(combinedText)) {
        return {
            isMismatch: currentCategory !== 'rice',
            detectedCategory: 'rice',
            confidence: 'high',
            reason: `Found rice keyword in name or image: "${nameLower}" / "${imageFilename}"`
        };
    }

    // 7. Spices / Masala detection
    const spicesKeywords = /\b(spice|masala|turmeric|cumin|coriander|cardamom|pepper|chilli|haldi|jeera|rai|mustard\s+seeds|fennel|methi|fenugreek|hing|asafoetida|cinnamon|cloves|elaichi|ajwain|powder)\b/;
    if (spicesKeywords.test(combinedText)) {
        // Avoid categorizing "tea masala" or "chai masala" as spice (keep in beverages/tea or let it slide)
        if (/\b(tea|chai|coffee)\b/.test(combinedText)) {
            return { isMismatch: false, detectedCategory: 'beverages', confidence: 'medium', reason: null };
        }
        return {
            isMismatch: currentCategory !== 'spices',
            detectedCategory: 'spices',
            confidence: 'high',
            reason: `Found spice keyword in name or image: "${nameLower}" / "${imageFilename}"`
        };
    }

    return {
        isMismatch: false,
        detectedCategory: null,
        confidence: 'low',
        reason: null
    };
}
