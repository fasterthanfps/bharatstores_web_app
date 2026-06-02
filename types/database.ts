export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
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
      deal_subscriptions: {
        Row: {
          active: boolean
          created_at: string
          email: string
          frequency: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          frequency?: string
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
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
          product_category: string | null
          product_id: string | null
          product_name: string | null
          product_url: string
          store_handle: string | null
          store_id: string | null
          store_name: string
          updated_at: string | null
          variant_id: string | null
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
          product_category?: string | null
          product_id?: string | null
          product_name?: string | null
          product_url: string
          store_handle?: string | null
          store_id?: string | null
          store_name: string
          updated_at?: string | null
          variant_id?: string | null
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
          product_category?: string | null
          product_id?: string | null
          product_name?: string | null
          product_url?: string
          store_handle?: string | null
          store_id?: string | null
          store_name?: string
          updated_at?: string | null
          variant_id?: string | null
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
          id: string
          in_stock: boolean
          price: number
          product_id: string
          recorded_at: string
          store_slug: string
        }
        Insert: {
          id?: string
          in_stock?: boolean
          price: number
          product_id: string
          recorded_at?: string
          store_slug: string
        }
        Update: {
          id?: string
          in_stock?: boolean
          price?: number
          product_id?: string
          recorded_at?: string
          store_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          brand_norm: string | null
          category: string
          category_display: string | null
          created_at: string | null
          id: string
          image_url: string | null
          intent_tags: string[] | null
          name: string
          search_terms: string[] | null
          slug: string
          sugar_profile: string[] | null
          type_tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          brand_norm?: string | null
          category: string
          category_display?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          intent_tags?: string[] | null
          name: string
          search_terms?: string[] | null
          slug: string
          sugar_profile?: string[] | null
          type_tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          brand_norm?: string | null
          category?: string
          category_display?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          intent_tags?: string[] | null
          name?: string
          search_terms?: string[] | null
          slug?: string
          sugar_profile?: string[] | null
          type_tags?: string[] | null
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
          store_name: string | null
        }
        Insert: {
          errors?: Json | null
          finished_at?: string | null
          id?: string
          products_found?: number | null
          started_at?: string | null
          status?: string | null
          store_id?: string | null
          store_name?: string | null
        }
        Update: {
          errors?: Json | null
          finished_at?: string | null
          id?: string
          products_found?: number | null
          started_at?: string | null
          status?: string | null
          store_id?: string | null
          store_name?: string | null
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
      search_events: {
        Row: {
          created_at: string
          id: string
          normalized_query: string
          query: string
          results_count: number
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          normalized_query: string
          query: string
          results_count?: number
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          normalized_query?: string
          query?: string
          results_count?: number
          session_id?: string | null
        }
        Relationships: []
      }
      search_intent_rules: {
        Row: {
          created_at: string
          exclude_terms: string[]
          id: string
          include_terms: string[]
          intent_key: string
          is_active: boolean
          priority: number
          trigger_terms: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          exclude_terms?: string[]
          id?: string
          include_terms?: string[]
          intent_key: string
          is_active?: boolean
          priority?: number
          trigger_terms?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          exclude_terms?: string[]
          id?: string
          include_terms?: string[]
          intent_key?: string
          is_active?: boolean
          priority?: number
          trigger_terms?: string[]
          updated_at?: string
        }
        Relationships: []
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
      kanban_columns: {
        Row: {
          id: string
          title: string
          color: string
          wip_limit: number
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          color: string
          wip_limit?: number
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          color?: string
          wip_limit?: number
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      kanban_cards: {
        Row: {
          id: string
          col_id: string
          type: string
          priority: string
          title: string
          description: string | null
          due_date: string | null
          tags: string[]
          assignees: string[]
          comments: Json
          checklist: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          col_id: string
          type: string
          priority: string
          title: string
          description?: string | null
          due_date?: string | null
          tags?: string[]
          assignees?: string[]
          comments?: Json
          checklist?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          col_id?: string
          type?: string
          priority?: string
          title?: string
          description?: string | null
          due_date?: string | null
          tags?: string[]
          assignees?: string[]
          comments?: Json
          checklist?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_cards_col_id_fkey"
            columns: ["col_id"]
            isOneToOne: false
            referencedRelation: "kanban_columns"
            referencedColumns: ["id"]
          }
        ]
      }
      blog_posts: {
        Row: {
          author: string
          content: string
          cover_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          lang: string
          published_at: string | null
          seo_desc: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author?: string
          content?: string
          cover_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          lang?: string
          published_at?: string | null
          seo_desc?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author?: string
          content?: string
          cover_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          lang?: string
          published_at?: string | null
          seo_desc?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { uid: string }; Returns: boolean }
      increment_blog_views: { Args: { post_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
