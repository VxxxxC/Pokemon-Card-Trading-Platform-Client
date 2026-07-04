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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_system_warning: boolean | null
          member_order_id: string | null
          merchant_order_id: string | null
          offer_id: string | null
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_system_warning?: boolean | null
          member_order_id?: string | null
          merchant_order_id?: string | null
          offer_id?: string | null
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_system_warning?: boolean | null
          member_order_id?: string | null
          merchant_order_id?: string | null
          offer_id?: string | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_member_order_id_fkey"
            columns: ["member_order_id"]
            isOneToOne: false
            referencedRelation: "member_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_merchant_order_id_fkey"
            columns: ["merchant_order_id"]
            isOneToOne: false
            referencedRelation: "merchant_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_rooms_buyer"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_rooms_seller_id"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_stats: {
        Row: {
          created_at: string | null
          current_streak: number | null
          last_check_in: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          last_check_in?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          last_check_in?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_gamification_stats_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_records: {
        Row: {
          created_at: string | null
          kyc_status: Database["public"]["Enums"]["kyc_state"] | null
          merchant_id: string
          stripe_account_id: string | null
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_state"] | null
          merchant_id: string
          stripe_account_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_state"] | null
          merchant_id?: string
          stripe_account_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kyc_records_merchant_id"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_bookmarks: {
        Row: {
          created_at: string | null
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_listing_bookmarks_listing_id"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_stats: {
        Row: {
          likes: number | null
          listing_id: string
          trade_records_count: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          likes?: number | null
          listing_id: string
          trade_records_count?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          likes?: number | null
          listing_id?: string
          trade_records_count?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          created_at: string
          grading_company: string
          grading_score: string | null
          id: string
          images: Json
          price: number
          product_id: string
          seller_description: string | null
          seller_id: string
          seller_persona: Database["public"]["Enums"]["seller_persona_type"]
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
          use_authentication: boolean
        }
        Insert: {
          created_at?: string
          grading_company?: string
          grading_score?: string | null
          id?: string
          images?: Json
          price: number
          product_id: string
          seller_description?: string | null
          seller_id: string
          seller_persona?: Database["public"]["Enums"]["seller_persona_type"]
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          use_authentication?: boolean
        }
        Update: {
          created_at?: string
          grading_company?: string
          grading_score?: string | null
          id?: string
          images?: Json
          price?: number
          product_id?: string
          seller_description?: string | null
          seller_id?: string
          seller_persona?: Database["public"]["Enums"]["seller_persona_type"]
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          use_authentication?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_listings_seller_id"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      member_orders: {
        Row: {
          buyer_id: string
          created_at: string | null
          expires_at: string
          extended_count: number
          final_price: number
          id: string
          listing_id: string
          meetup_details: Json | null
          seller_id: string
          status: Database["public"]["Enums"]["member_order_state"] | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          expires_at?: string
          extended_count?: number
          final_price: number
          id?: string
          listing_id: string
          meetup_details?: Json | null
          seller_id: string
          status?: Database["public"]["Enums"]["member_order_state"] | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          expires_at?: string
          extended_count?: number
          final_price?: number
          id?: string
          listing_id?: string
          meetup_details?: Json | null
          seller_id?: string
          status?: Database["public"]["Enums"]["member_order_state"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_member_orders_buyer"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_member_orders_listing_id"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_member_orders_seller"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_ledgers: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          merchant_id: string
          order_id: string | null
          stripe_transfer_id: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          merchant_id: string
          order_id?: string | null
          stripe_transfer_id?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          merchant_id?: string
          order_id?: string | null
          stripe_transfer_id?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_merchant_ledgers_merchant_id"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_orders: {
        Row: {
          buyer_id: string
          created_at: string | null
          escrow_status: Database["public"]["Enums"]["escrow_state"] | null
          final_price: number
          id: string
          listing_id: string
          logistics_proof_path: string | null
          merchant_id: string
          requires_authentication: boolean | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_state"] | null
          final_price: number
          id?: string
          listing_id: string
          logistics_proof_path?: string | null
          merchant_id: string
          requires_authentication?: boolean | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_state"] | null
          final_price?: number
          id?: string
          listing_id?: string
          logistics_proof_path?: string | null
          merchant_id?: string
          requires_authentication?: boolean | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_merchant_orders_buyer_id"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_merchant_orders_listing_id"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_merchant_orders_merchant_id"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_shops: {
        Row: {
          business_details: Json | null
          created_at: string | null
          merchant_id: string
          rating_score: number | null
          shipping_speed_score: number | null
          shop_description: string | null
          shop_rating_score: number | null
          top_banner_path: string | null
          updated_at: string | null
        }
        Insert: {
          business_details?: Json | null
          created_at?: string | null
          merchant_id: string
          rating_score?: number | null
          shipping_speed_score?: number | null
          shop_description?: string | null
          shop_rating_score?: number | null
          top_banner_path?: string | null
          updated_at?: string | null
        }
        Update: {
          business_details?: Json | null
          created_at?: string | null
          merchant_id?: string
          rating_score?: number | null
          shipping_speed_score?: number | null
          shop_description?: string | null
          shop_rating_score?: number | null
          top_banner_path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_merchant_shops_profile"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          listing_id: string | null
          modified_count: number
          offer_price: number
          room_id: string
          status: Database["public"]["Enums"]["offer_status"] | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          modified_count?: number
          offer_price: number
          room_id: string
          status?: Database["public"]["Enums"]["offer_status"] | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          modified_count?: number
          offer_price?: number
          room_id?: string
          status?: Database["public"]["Enums"]["offer_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_offers_buyer_id"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      product_catalog: {
        Row: {
          card_number: string | null
          created_at: string
          display_id: string | null
          element_type: string | null
          hp: number | null
          id: string
          image_url: string
          jan_code: string | null
          last_synced_at: string | null
          name_en: string | null
          name_ja: string
          name_zh: string | null
          pack_count: number | null
          pokemon_stage: string | null
          rarity: string | null
          set_code: string
          snkr_rank: number | null
          sub_type_ja: string | null
          type: Database["public"]["Enums"]["catalog_type"]
          updated_at: string
        }
        Insert: {
          card_number?: string | null
          created_at?: string
          display_id?: string | null
          element_type?: string | null
          hp?: number | null
          id: string
          image_url: string
          jan_code?: string | null
          last_synced_at?: string | null
          name_en?: string | null
          name_ja: string
          name_zh?: string | null
          pack_count?: number | null
          pokemon_stage?: string | null
          rarity?: string | null
          set_code: string
          snkr_rank?: number | null
          sub_type_ja?: string | null
          type?: Database["public"]["Enums"]["catalog_type"]
          updated_at?: string
        }
        Update: {
          card_number?: string | null
          created_at?: string
          display_id?: string | null
          element_type?: string | null
          hp?: number | null
          id?: string
          image_url?: string
          jan_code?: string | null
          last_synced_at?: string | null
          name_en?: string | null
          name_ja?: string
          name_zh?: string | null
          pack_count?: number | null
          pokemon_stage?: string | null
          rarity?: string | null
          set_code?: string
          snkr_rank?: number | null
          sub_type_ja?: string | null
          type?: Database["public"]["Enums"]["catalog_type"]
          updated_at?: string
        }
        Relationships: []
      }
      product_grading_market_prices: {
        Row: {
          grading_company: string
          grading_score: string
          id: string
          market_avg_price: number | null
          market_chart_data: Json | null
          market_trend_30d: number | null
          product_id: string | null
          updated_at: string | null
        }
        Insert: {
          grading_company: string
          grading_score?: string
          id?: string
          market_avg_price?: number | null
          market_chart_data?: Json | null
          market_trend_30d?: number | null
          product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          grading_company?: string
          grading_score?: string
          id?: string
          market_avg_price?: number | null
          market_chart_data?: Json | null
          market_trend_30d?: number | null
          product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_grading_market_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price_snapshots: {
        Row: {
          condition_name_ja: string | null
          condition_type: string
          created_at: string
          grading_company: string | null
          grading_score: string | null
          id: string
          price_hkd: number | null
          price_jpy: number
          product_id: string
          snapshot_date: string
          source: string | null
        }
        Insert: {
          condition_name_ja?: string | null
          condition_type: string
          created_at?: string
          grading_company?: string | null
          grading_score?: string | null
          id?: string
          price_hkd?: number | null
          price_jpy: number
          product_id: string
          snapshot_date: string
          source?: string | null
        }
        Update: {
          condition_name_ja?: string | null
          condition_type?: string
          created_at?: string
          grading_company?: string | null
          grading_score?: string | null
          id?: string
          price_hkd?: number | null
          price_jpy?: number
          product_id?: string
          snapshot_date?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_price_snapshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      product_watchlists: {
        Row: {
          product_id: string
          user_id: string
        }
        Insert: {
          product_id: string
          user_id: string
        }
        Update: {
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_watchlists_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_watchlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          cancelled_trades_count: number
          completed_trades_count: number
          created_at: string
          display_name: string
          id: string
          rating_score: number | null
          reputation_tag: Json | null
          role: Database["public"]["Enums"]["user_role"]
          short_description: string | null
          total_trades: number | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_path?: string | null
          cancelled_trades_count?: number
          completed_trades_count?: number
          created_at?: string
          display_name: string
          id: string
          rating_score?: number | null
          reputation_tag?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          short_description?: string | null
          total_trades?: number | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_path?: string | null
          cancelled_trades_count?: number
          completed_trades_count?: number
          created_at?: string
          display_name?: string
          id?: string
          rating_score?: number | null
          reputation_tag?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          short_description?: string | null
          total_trades?: number | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_state"] | null
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_state"] | null
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_state"] | null
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reports_reporter_id"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_templates: {
        Row: {
          created_at: string | null
          description: string | null
          fixed_expiry_date: string | null
          id: string
          is_active: boolean | null
          is_infinite: boolean | null
          reward_value: Json
          title: string
          trigger_conditions: Json
          type: Database["public"]["Enums"]["reward_type"]
          updated_at: string | null
          valid_duration_days: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fixed_expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_infinite?: boolean | null
          reward_value: Json
          title: string
          trigger_conditions: Json
          type: Database["public"]["Enums"]["reward_type"]
          updated_at?: string | null
          valid_duration_days?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fixed_expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_infinite?: boolean | null
          reward_value?: Json
          title?: string
          trigger_conditions?: Json
          type?: Database["public"]["Enums"]["reward_type"]
          updated_at?: string | null
          valid_duration_days?: number | null
        }
        Relationships: []
      }
      transaction_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_public: boolean
          member_order_id: string | null
          merchant_order_id: string | null
          rating: number
          reviewee_id: string
          reviewee_persona: Database["public"]["Enums"]["review_persona"]
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          member_order_id?: string | null
          merchant_order_id?: string | null
          rating: number
          reviewee_id: string
          reviewee_persona: Database["public"]["Enums"]["review_persona"]
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          member_order_id?: string | null
          merchant_order_id?: string | null
          rating?: number
          reviewee_id?: string
          reviewee_persona?: Database["public"]["Enums"]["review_persona"]
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviews_reviewee"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviews_reviewer"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_reviews_member_order_id_fkey"
            columns: ["member_order_id"]
            isOneToOne: false
            referencedRelation: "member_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_reviews_merchant_order_id_fkey"
            columns: ["merchant_order_id"]
            isOneToOne: false
            referencedRelation: "merchant_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_collections: {
        Row: {
          created_at: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_collections_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          calculated_expiry: string | null
          created_at: string | null
          id: string
          is_used: boolean | null
          template_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          calculated_expiry?: string | null
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          template_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          calculated_expiry?: string | null
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          template_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "reward_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      escape_ilike_pattern: { Args: { input: string }; Returns: string }
      generate_profile_username: { Args: never; Returns: string }
      get_marketplace_price_bounds: {
        Args: never
        Returns: {
          max_price: number
          min_price: number
        }[]
      }
      get_marketplace_product_listings: {
        Args: {
          p_grade_filters?: Json
          p_only_graded?: boolean
          p_page?: number
          p_page_size?: number
          p_product_id: string
          p_sort?: string
        }
        Returns: {
          created_at: string
          filtered_lowest_price: number
          grading_company: string
          grading_score: string
          listing_id: string
          page: number
          page_size: number
          price: number
          range_end: number
          range_start: number
          seller_id: string
          seller_name: string
          seller_persona: Database["public"]["Enums"]["seller_persona_type"]
          seller_rating: number
          seller_total_trades: number
          total_count: number
          total_pages: number
          use_authentication: boolean
        }[]
      }
      is_display_name_available: { Args: { name: string }; Returns: boolean }
      listing_grade_sort_score: {
        Args: { grading_company: string; grading_score: string }
        Returns: number
      }
      rpc_accept_offer: {
        Args: { p_offer_id: string; p_seller_id: string }
        Returns: Json
      }
      rpc_make_offer: {
        Args: {
          p_buyer_id: string
          p_content: string
          p_listing_id: string
          p_offer_price: number
        }
        Returns: Json
      }
      rpc_modify_offer: {
        Args: {
          p_buyer_id: string
          p_content: string
          p_new_price: number
          p_offer_id: string
        }
        Returns: Json
      }
      search_marketplace_products: {
        Args: {
          p_card_number?: string
          p_grade_filters?: Json
          p_keyword?: string
          p_name_query?: string
          p_page?: number
          p_page_size?: number
          p_price_max?: number
          p_price_min?: number
          p_rarities?: string[]
          p_seller_modes?: string[]
          p_set_code?: string
          p_sort?: string
        }
        Returns: {
          card_number: string
          catalog_type: Database["public"]["Enums"]["catalog_type"]
          display_id: string
          grading_company: string
          grading_score: string
          highest_price: number
          image_url: string
          latest_listing_at: string
          listing_count: number
          lowest_listing_created_at: string
          lowest_listing_id: string
          lowest_price: number
          name_en: string
          name_ja: string
          name_zh: string
          page: number
          page_size: number
          product_id: string
          product_name: string
          range_end: number
          range_start: number
          rarity: string
          seller_id: string
          seller_name: string
          seller_persona: Database["public"]["Enums"]["seller_persona_type"]
          set_code: string
          total_count: number
          total_pages: number
          use_authentication: boolean
        }[]
      }
    }
    Enums: {
      catalog_type:
        | "single_card"
        | "booster_pack"
        | "booster_box"
        | "gift_set"
        | "starter_deck"
      escrow_state:
        | "payment_held"
        | "authenticating"
        | "authenticated"
        | "completed_and_transferred"
        | "refunded"
      kyc_state: "pending" | "verified" | "rejected"
      listing_status: "active" | "sold" | "inactive"
      member_order_state:
        | "pending"
        | "meetup_arranged"
        | "completed"
        | "cancelled"
      offer_status: "pending" | "accepted" | "rejected" | "cancelled"
      report_state: "pending" | "reviewing" | "resolved" | "dismissed"
      review_persona: "member" | "merchant"
      reward_type: "discount_coupon" | "free_shipping" | "lucky_draw_ticket"
      seller_persona_type: "member" | "merchant"
      sync_state: "synced" | "partial" | "needs_review"
      transaction_type:
        | "escrow_payment"
        | "commission_deduction"
        | "shipping_subsidy"
        | "refund"
        | "payout"
      user_role: "admin" | "merchant" | "member"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      catalog_type: [
        "single_card",
        "booster_pack",
        "booster_box",
        "gift_set",
        "starter_deck",
      ],
      escrow_state: [
        "payment_held",
        "authenticating",
        "authenticated",
        "completed_and_transferred",
        "refunded",
      ],
      kyc_state: ["pending", "verified", "rejected"],
      listing_status: ["active", "sold", "inactive"],
      member_order_state: [
        "pending",
        "meetup_arranged",
        "completed",
        "cancelled",
      ],
      offer_status: ["pending", "accepted", "rejected", "cancelled"],
      report_state: ["pending", "reviewing", "resolved", "dismissed"],
      review_persona: ["member", "merchant"],
      reward_type: ["discount_coupon", "free_shipping", "lucky_draw_ticket"],
      seller_persona_type: ["member", "merchant"],
      sync_state: ["synced", "partial", "needs_review"],
      transaction_type: [
        "escrow_payment",
        "commission_deduction",
        "shipping_subsidy",
        "refund",
        "payout",
      ],
      user_role: ["admin", "merchant", "member"],
    },
  },
} as const
