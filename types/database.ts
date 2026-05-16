export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            clicks: {
                Row: {
                    converted: boolean | null
                    created_at: string | null
                    id: string
                    ip_hash: string | null
                    listing_id: string | null
                    referrer: string | null
                    revenue_eur: number | null
                    session_id: string
                    user_id: string | null
                }
                Insert: {
                    converted?: boolean | null
                    created_at?: string | null
                    id?: string
                    ip_hash?: string | null
                    listing_id?: string | null
                    referrer?: string | null
                    revenue_eur?: number | null
                    session_id: string
                    user_id?: string | null
                }
                Update: {
                    converted?: boolean | null
                    created_at?: string | null
                    id?: string
                    ip_hash?: string | null
                    listing_id?: string | null
                    referrer?: string | null
                    revenue_eur?: number | null
                    session_id?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "clicks_listing_id_fkey"
                        columns: ["listing_id"]
                        isOneToOne: false
                        referencedRelation: "listings"
                        referencedColumns: ["id"]
                    },
                ]
            }
            listings: {
                Row: {
                    availability: string
                    compare_price: number | null
                    created_at: string | null
                    currency: string | null
                    id: string
                    image_url: string | null
                    last_scraped_at: string | null
                    price: number
                    price_per_kg: number | null
                    product_id: string | null
                    product_name: string | null
                    product_category: string | null
                    product_url: string
                    store_id: string | null
                    store_name: string
                    updated_at: string | null
                    weight_grams: number | null
                    weight_label: string | null
                }
                Insert: {
                    availability: string
                    compare_price?: number | null
                    created_at?: string | null
                    currency?: string | null
                    id?: string
                    image_url?: string | null
                    last_scraped_at?: string | null
                    price: number
                    price_per_kg?: number | null
                    product_id?: string | null
                    product_name?: string | null
                    product_category?: string | null
                    product_url: string
                    store_id?: string | null
                    store_name: string
                    updated_at?: string | null
                    weight_grams?: number | null
                    weight_label?: string | null
                }
                Update: {
                    availability?: string
                    compare_price?: number | null
                    created_at?: string | null
                    currency?: string | null
                    id?: string
                    image_url?: string | null
                    last_scraped_at?: string | null
                    price?: number
                    price_per_kg?: number | null
                    product_id?: string | null
                    product_name?: string | null
                    product_category?: string | null
                    product_url?: string
                    store_id?: string | null
                    store_name?: string
                    updated_at?: string | null
                    weight_grams?: number | null
                    weight_label?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "listings_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "listings_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    },
                ]
            }
            product_deals: {
                Row: {
                    avg_price_7d: number
                    category: string
                    created_at: string | null
                    current_price: number
                    discount_percent: number
                    id: string
                    image_url: string | null
                    in_stock: boolean | null
                    last_updated: string | null
                    listing_id: string | null
                    price_per_kg: number | null
                    product_id: string | null
                    product_name: string
                    savings_amount: number
                    store_name: string
                    store_slug: string
                    url: string
                    weight: string | null
                }
                Insert: {
                    avg_price_7d: number
                    category: string
                    created_at?: string | null
                    current_price: number
                    discount_percent: number
                    id?: string
                    image_url?: string | null
                    in_stock?: boolean | null
                    last_updated?: string | null
                    listing_id?: string | null
                    price_per_kg?: number | null
                    product_id?: string | null
                    product_name: string
                    savings_amount: number
                    store_name: string
                    store_slug: string
                    url: string
                    weight?: string | null
                }
                Update: {
                    avg_price_7d?: number
                    category?: string
                    created_at?: string | null
                    current_price?: number
                    discount_percent?: number
                    id?: string
                    image_url?: string | null
                    in_stock?: boolean | null
                    last_updated?: string | null
                    listing_id?: string | null
                    price_per_kg?: number | null
                    product_id?: string | null
                    product_name?: string
                    savings_amount?: number
                    store_name?: string
                    store_slug?: string
                    url?: string
                    weight?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "product_deals_listing_id_fkey"
                        columns: ["listing_id"]
                        isOneToOne: true
                        referencedRelation: "listings"
                        referencedColumns: ["id"]
                    }
                ]
            }
            price_alerts: {
                Row: {
                    created_at: string | null
                    id: string
                    is_triggered: boolean | null
                    listing_id: string | null
                    notified_at: string | null
                    target_price: number
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_triggered?: boolean | null
                    listing_id?: string | null
                    notified_at?: string | null
                    target_price: number
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_triggered?: boolean | null
                    listing_id?: string | null
                    notified_at?: string | null
                    target_price?: number
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "price_alerts_listing_id_fkey"
                        columns: ["listing_id"]
                        isOneToOne: false
                        referencedRelation: "listings"
                        referencedColumns: ["id"]
                    },
                ]
            }
            price_history: {
                Row: {
                    availability: string
                    id: string
                    listing_id: string | null
                    price: number
                    recorded_at: string | null
                }
                Insert: {
                    availability: string
                    id?: string
                    listing_id?: string | null
                    price: number
                    recorded_at?: string | null
                }
                Update: {
                    availability?: string
                    id?: string
                    listing_id?: string | null
                    price?: number
                    recorded_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "price_history_listing_id_fkey"
                        columns: ["listing_id"]
                        isOneToOne: false
                        referencedRelation: "listings"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    brand: string | null
                    category: string
                    created_at: string | null
                    id: string
                    image_url: string | null
                    name: string
                    search_terms: string[] | null
                    slug: string
                    updated_at: string | null
                }
                Insert: {
                    brand?: string | null
                    category: string
                    created_at?: string | null
                    id?: string
                    image_url?: string | null
                    name: string
                    search_terms?: string[] | null
                    slug: string
                    updated_at?: string | null
                }
                Update: {
                    brand?: string | null
                    category?: string
                    created_at?: string | null
                    id?: string
                    image_url?: string | null
                    name?: string
                    search_terms?: string[] | null
                    slug?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            scraper_runs: {
                Row: {
                    errors: Json | null
                    finished_at: string | null
                    id: string
                    products_found: number | null
                    started_at: string | null
                    status: string | null
                    store_id: string | null
                }
                Insert: {
                    errors?: Json | null
                    finished_at?: string | null
                    id?: string
                    products_found?: number | null
                    started_at?: string | null
                    status?: string | null
                    store_id?: string | null
                }
                Update: {
                    errors?: Json | null
                    finished_at?: string | null
                    id?: string
                    products_found?: number | null
                    started_at?: string | null
                    status?: string | null
                    store_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "scraper_runs_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    },
                ]
            }
            stores: {
                Row: {
                    base_url: string
                    created_at: string | null
                    domain: string
                    id: string
                    is_active: boolean | null
                    logo_url: string | null
                    name: string
                    scraper_type: string
                }
                Insert: {
                    base_url: string
                    created_at?: string | null
                    domain: string
                    id?: string
                    is_active?: boolean | null
                    logo_url?: string | null
                    name: string
                    scraper_type: string
                }
                Update: {
                    base_url?: string
                    created_at?: string | null
                    domain?: string
                    id?: string
                    is_active?: boolean | null
                    logo_url?: string | null
                    name?: string
                    scraper_type?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never
