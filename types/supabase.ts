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
      chat_room_reads: {
        Row: {
          last_read_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_reads_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          buyer_id: string
          buyer_persona: Database["public"]["Enums"]["seller_persona_type"]
          created_at: string | null
          id: string
          seller_id: string
          seller_persona: Database["public"]["Enums"]["seller_persona_type"]
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          buyer_persona?: Database["public"]["Enums"]["seller_persona_type"]
          created_at?: string | null
          id?: string
          seller_id: string
          seller_persona?: Database["public"]["Enums"]["seller_persona_type"]
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          buyer_persona?: Database["public"]["Enums"]["seller_persona_type"]
          created_at?: string | null
          id?: string
          seller_id?: string
          seller_persona?: Database["public"]["Enums"]["seller_persona_type"]
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
          points_balance: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          last_check_in?: string | null
          longest_streak?: number | null
          points_balance?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          last_check_in?: string | null
          longest_streak?: number | null
          points_balance?: number
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
      grading_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          from_status: string | null
          id: string
          notes: string | null
          order_id: string
          order_kind: string
          to_status: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id: string
          order_kind: string
          to_status?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          order_kind?: string
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grading_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_applications: {
        Row: {
          bank_account_holder: string | null
          bank_account_masked: string | null
          bank_account_number: string | null
          bank_code: string | null
          bank_name: string | null
          br_number: string
          branch_code: string | null
          company_address: Json
          company_name_en: string
          company_name_zh: string | null
          company_phone: string
          created_at: string
          id: string
          reject_reason: string | null
          rep_address: Json
          rep_dob: string
          rep_email: string
          rep_hkid: string
          rep_name_en: string
          rep_name_zh: string | null
          rep_phone: string
          rep_title: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["kyc_application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account_holder?: string | null
          bank_account_masked?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          br_number: string
          branch_code?: string | null
          company_address: Json
          company_name_en: string
          company_name_zh?: string | null
          company_phone: string
          created_at?: string
          id?: string
          reject_reason?: string | null
          rep_address: Json
          rep_dob: string
          rep_email: string
          rep_hkid: string
          rep_name_en: string
          rep_name_zh?: string | null
          rep_phone: string
          rep_title: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account_holder?: string | null
          bank_account_masked?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          br_number?: string
          branch_code?: string | null
          company_address?: Json
          company_name_en?: string
          company_name_zh?: string | null
          company_phone?: string
          created_at?: string
          id?: string
          reject_reason?: string | null
          rep_address?: Json
          rep_dob?: string
          rep_email?: string
          rep_hkid?: string
          rep_name_en?: string
          rep_name_zh?: string | null
          rep_phone?: string
          rep_title?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["kyc_application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          application_id: string
          content_type: string
          created_at: string
          document_type: string
          id: string
          storage_path: string
          stripe_file_id: string | null
        }
        Insert: {
          application_id: string
          content_type: string
          created_at?: string
          document_type: string
          id?: string
          storage_path: string
          stripe_file_id?: string | null
        }
        Update: {
          application_id?: string
          content_type?: string
          created_at?: string
          document_type?: string
          id?: string
          storage_path?: string
          stripe_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "kyc_applications"
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
          stripe_charges_enabled: boolean
          stripe_payouts_enabled: boolean
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_state"] | null
          merchant_id: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_payouts_enabled?: boolean
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_state"] | null
          merchant_id?: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_payouts_enabled?: boolean
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
          {
            foreignKeyName: "fk_listing_bookmarks_listing_id"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_summaries"
            referencedColumns: ["lowest_listing_id"]
          },
        ]
      }
      listing_engagement_events: {
        Row: {
          actor_id: string | null
          event_type: Database["public"]["Enums"]["listing_engagement_event_type"]
          id: string
          listing_id: string
          occurred_at: string
        }
        Insert: {
          actor_id?: string | null
          event_type: Database["public"]["Enums"]["listing_engagement_event_type"]
          id?: string
          listing_id: string
          occurred_at?: string
        }
        Update: {
          actor_id?: string | null
          event_type?: Database["public"]["Enums"]["listing_engagement_event_type"]
          id?: string
          listing_id?: string
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_engagement_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_engagement_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_engagement_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_summaries"
            referencedColumns: ["lowest_listing_id"]
          },
        ]
      }
      listing_stats: {
        Row: {
          listing_id: string
          offers_count: number
          updated_at: string | null
          views: number
        }
        Insert: {
          listing_id: string
          offers_count?: number
          updated_at?: string | null
          views?: number
        }
        Update: {
          listing_id?: string
          offers_count?: number
          updated_at?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_stats_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_stats_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "marketplace_product_summaries"
            referencedColumns: ["lowest_listing_id"]
          },
        ]
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
          source_collection_id: string | null
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
          source_collection_id?: string | null
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
          source_collection_id?: string | null
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
          {
            foreignKeyName: "listings_source_collection_id_fkey"
            columns: ["source_collection_id"]
            isOneToOne: false
            referencedRelation: "user_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      member_orders: {
        Row: {
          auth_fee: number
          auth_fee_captured_at: string | null
          auth_graded_at: string | null
          auth_graded_by: string | null
          auth_notes: string | null
          auth_result: string | null
          buyer_confirmed_at: string | null
          buyer_id: string
          created_at: string | null
          escrow_status:
            | Database["public"]["Enums"]["member_escrow_status"]
            | null
          expires_at: string
          extended_count: number
          fault_party: Database["public"]["Enums"]["grading_fault_party"] | null
          final_price: number
          id: string
          inbound_tracking_no: string | null
          item_subtotal: number | null
          listing_id: string
          logistics_proof_path: string | null
          meetup_details: Json | null
          mock_payment_session_id: string | null
          order_number: string | null
          outbound_tracking_no: string | null
          payment_capture_status: Database["public"]["Enums"]["payment_capture_status"]
          payment_confirmed_at: string | null
          payout_hold_until: string | null
          platform_received_at: string | null
          refund_amount: number | null
          refund_attempted_at: string | null
          refund_error: string | null
          refund_status: string
          refunded_at: string | null
          seller_id: string
          seller_payout_status: Database["public"]["Enums"]["member_seller_payout_status"]
          status: Database["public"]["Enums"]["member_order_state"] | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          total_amount: number | null
          updated_at: string | null
          use_authentication: boolean
        }
        Insert: {
          auth_fee?: number
          auth_fee_captured_at?: string | null
          auth_graded_at?: string | null
          auth_graded_by?: string | null
          auth_notes?: string | null
          auth_result?: string | null
          buyer_confirmed_at?: string | null
          buyer_id: string
          created_at?: string | null
          escrow_status?:
            | Database["public"]["Enums"]["member_escrow_status"]
            | null
          expires_at?: string
          extended_count?: number
          fault_party?:
            | Database["public"]["Enums"]["grading_fault_party"]
            | null
          final_price: number
          id?: string
          inbound_tracking_no?: string | null
          item_subtotal?: number | null
          listing_id: string
          logistics_proof_path?: string | null
          meetup_details?: Json | null
          mock_payment_session_id?: string | null
          order_number?: string | null
          outbound_tracking_no?: string | null
          payment_capture_status?: Database["public"]["Enums"]["payment_capture_status"]
          payment_confirmed_at?: string | null
          payout_hold_until?: string | null
          platform_received_at?: string | null
          refund_amount?: number | null
          refund_attempted_at?: string | null
          refund_error?: string | null
          refund_status?: string
          refunded_at?: string | null
          seller_id: string
          seller_payout_status?: Database["public"]["Enums"]["member_seller_payout_status"]
          status?: Database["public"]["Enums"]["member_order_state"] | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          use_authentication?: boolean
        }
        Update: {
          auth_fee?: number
          auth_fee_captured_at?: string | null
          auth_graded_at?: string | null
          auth_graded_by?: string | null
          auth_notes?: string | null
          auth_result?: string | null
          buyer_confirmed_at?: string | null
          buyer_id?: string
          created_at?: string | null
          escrow_status?:
            | Database["public"]["Enums"]["member_escrow_status"]
            | null
          expires_at?: string
          extended_count?: number
          fault_party?:
            | Database["public"]["Enums"]["grading_fault_party"]
            | null
          final_price?: number
          id?: string
          inbound_tracking_no?: string | null
          item_subtotal?: number | null
          listing_id?: string
          logistics_proof_path?: string | null
          meetup_details?: Json | null
          mock_payment_session_id?: string | null
          order_number?: string | null
          outbound_tracking_no?: string | null
          payment_capture_status?: Database["public"]["Enums"]["payment_capture_status"]
          payment_confirmed_at?: string | null
          payout_hold_until?: string | null
          platform_received_at?: string | null
          refund_amount?: number | null
          refund_attempted_at?: string | null
          refund_error?: string | null
          refund_status?: string
          refunded_at?: string | null
          seller_id?: string
          seller_payout_status?: Database["public"]["Enums"]["member_seller_payout_status"]
          status?: Database["public"]["Enums"]["member_order_state"] | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          use_authentication?: boolean
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
            foreignKeyName: "fk_member_orders_listing_id"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_summaries"
            referencedColumns: ["lowest_listing_id"]
          },
          {
            foreignKeyName: "fk_member_orders_seller"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_orders_auth_graded_by_fkey"
            columns: ["auth_graded_by"]
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
          auth_fee: number
          auth_fee_captured_at: string | null
          auth_graded_at: string | null
          auth_graded_by: string | null
          auth_notes: string | null
          auth_result: string | null
          buyer_confirmed_at: string | null
          buyer_id: string
          commission_amount: number | null
          commission_rate_applied: number | null
          created_at: string | null
          escrow_status: Database["public"]["Enums"]["escrow_state"] | null
          fault_party: Database["public"]["Enums"]["grading_fault_party"] | null
          final_price: number
          id: string
          inbound_tracking_no: string | null
          item_subtotal: number | null
          listing_id: string
          logistics_proof_path: string | null
          merchant_id: string
          merchant_payout_amount: number | null
          order_number: string | null
          outbound_tracking_no: string | null
          paid_at: string | null
          payment_capture_status: Database["public"]["Enums"]["payment_capture_status"]
          payout_attempted_at: string | null
          payout_error: string | null
          payout_status: string
          platform_received_at: string | null
          refund_amount: number | null
          refund_attempted_at: string | null
          refund_error: string | null
          refund_status: string
          refunded_at: string | null
          requires_authentication: boolean | null
          shipping_fee: number
          shipping_method: string | null
          stripe_destination_account_id: string | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          stripe_transfer_id: string | null
          total_amount: number | null
          transferred_at: string | null
          updated_at: string | null
        }
        Insert: {
          auth_fee?: number
          auth_fee_captured_at?: string | null
          auth_graded_at?: string | null
          auth_graded_by?: string | null
          auth_notes?: string | null
          auth_result?: string | null
          buyer_confirmed_at?: string | null
          buyer_id: string
          commission_amount?: number | null
          commission_rate_applied?: number | null
          created_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_state"] | null
          fault_party?:
            | Database["public"]["Enums"]["grading_fault_party"]
            | null
          final_price: number
          id?: string
          inbound_tracking_no?: string | null
          item_subtotal?: number | null
          listing_id: string
          logistics_proof_path?: string | null
          merchant_id: string
          merchant_payout_amount?: number | null
          order_number?: string | null
          outbound_tracking_no?: string | null
          paid_at?: string | null
          payment_capture_status?: Database["public"]["Enums"]["payment_capture_status"]
          payout_attempted_at?: string | null
          payout_error?: string | null
          payout_status?: string
          platform_received_at?: string | null
          refund_amount?: number | null
          refund_attempted_at?: string | null
          refund_error?: string | null
          refund_status?: string
          refunded_at?: string | null
          requires_authentication?: boolean | null
          shipping_fee?: number
          shipping_method?: string | null
          stripe_destination_account_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          total_amount?: number | null
          transferred_at?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_fee?: number
          auth_fee_captured_at?: string | null
          auth_graded_at?: string | null
          auth_graded_by?: string | null
          auth_notes?: string | null
          auth_result?: string | null
          buyer_confirmed_at?: string | null
          buyer_id?: string
          commission_amount?: number | null
          commission_rate_applied?: number | null
          created_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_state"] | null
          fault_party?:
            | Database["public"]["Enums"]["grading_fault_party"]
            | null
          final_price?: number
          id?: string
          inbound_tracking_no?: string | null
          item_subtotal?: number | null
          listing_id?: string
          logistics_proof_path?: string | null
          merchant_id?: string
          merchant_payout_amount?: number | null
          order_number?: string | null
          outbound_tracking_no?: string | null
          paid_at?: string | null
          payment_capture_status?: Database["public"]["Enums"]["payment_capture_status"]
          payout_attempted_at?: string | null
          payout_error?: string | null
          payout_status?: string
          platform_received_at?: string | null
          refund_amount?: number | null
          refund_attempted_at?: string | null
          refund_error?: string | null
          refund_status?: string
          refunded_at?: string | null
          requires_authentication?: boolean | null
          shipping_fee?: number
          shipping_method?: string | null
          stripe_destination_account_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          total_amount?: number | null
          transferred_at?: string | null
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
            foreignKeyName: "fk_merchant_orders_listing_id"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_summaries"
            referencedColumns: ["lowest_listing_id"]
          },
          {
            foreignKeyName: "fk_merchant_orders_merchant_id"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_orders_auth_graded_by_fkey"
            columns: ["auth_graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_shops: {
        Row: {
          business_details: Json | null
          cancelled_trades_count: number
          completed_trades_count: number
          created_at: string | null
          merchant_id: string
          rating_score: number | null
          reputation_tag: Json | null
          shipping_speed_score: number | null
          shop_avatar_path: string | null
          shop_description: string | null
          shop_handle: string | null
          shop_name: string | null
          shop_rating_score: number | null
          top_banner_path: string | null
          updated_at: string | null
        }
        Insert: {
          business_details?: Json | null
          cancelled_trades_count?: number
          completed_trades_count?: number
          created_at?: string | null
          merchant_id: string
          rating_score?: number | null
          reputation_tag?: Json | null
          shipping_speed_score?: number | null
          shop_avatar_path?: string | null
          shop_description?: string | null
          shop_handle?: string | null
          shop_name?: string | null
          shop_rating_score?: number | null
          top_banner_path?: string | null
          updated_at?: string | null
        }
        Update: {
          business_details?: Json | null
          cancelled_trades_count?: number
          completed_trades_count?: number
          created_at?: string | null
          merchant_id?: string
          rating_score?: number | null
          reputation_tag?: Json | null
          shipping_speed_score?: number | null
          shop_avatar_path?: string | null
          shop_description?: string | null
          shop_handle?: string | null
          shop_name?: string | null
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
          use_authentication: boolean
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
          use_authentication?: boolean
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
          use_authentication?: boolean
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
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_summaries"
            referencedColumns: ["lowest_listing_id"]
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
      point_ledger: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          source_ref: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          source_ref?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          source_ref?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          id_canonical: string | null
          id_compact: string | null
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
          id_canonical?: string | null
          id_compact?: string | null
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
          id_canonical?: string | null
          id_compact?: string | null
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
          market_data_source: string
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
          market_data_source?: string
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
          market_data_source?: string
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
          member_order_id: string | null
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
          member_order_id?: string | null
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
          member_order_id?: string | null
          price_hkd?: number | null
          price_jpy?: number
          product_id?: string
          snapshot_date?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_price_snapshots_member_order_id_fkey"
            columns: ["member_order_id"]
            isOneToOne: false
            referencedRelation: "member_orders"
            referencedColumns: ["id"]
          },
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
          alert_enabled: boolean
          created_at: string
          grading_company: string
          grading_score: string
          last_alerted_at: string | null
          product_id: string
          target_price: number | null
          tracked_price: number | null
          user_id: string
        }
        Insert: {
          alert_enabled?: boolean
          created_at?: string
          grading_company?: string
          grading_score?: string
          last_alerted_at?: string | null
          product_id: string
          target_price?: number | null
          tracked_price?: number | null
          user_id: string
        }
        Update: {
          alert_enabled?: boolean
          created_at?: string
          grading_company?: string
          grading_score?: string
          last_alerted_at?: string | null
          product_id?: string
          target_price?: number | null
          tracked_price?: number | null
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
      payout_batches: {
        Row: {
          created_at: string
          cutoff_at: string
          id: string
          notes: string | null
          processed_by: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["payout_batch_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          cutoff_at: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["payout_batch_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          cutoff_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["payout_batch_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_batches_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          admin_fps_reference: string | null
          amount: number
          batch_id: string | null
          created_at: string
          fps_id_snapshot: string
          id: string
          order_id: string
          paid_at: string | null
          paid_by: string | null
          ready_at: string | null
          seller_id: string
          status: Database["public"]["Enums"]["payout_request_status"]
          updated_at: string
        }
        Insert: {
          admin_fps_reference?: string | null
          amount: number
          batch_id?: string | null
          created_at?: string
          fps_id_snapshot: string
          id?: string
          order_id: string
          paid_at?: string | null
          paid_by?: string | null
          ready_at?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["payout_request_status"]
          updated_at?: string
        }
        Update: {
          admin_fps_reference?: string | null
          amount?: number
          batch_id?: string | null
          created_at?: string
          fps_id_snapshot?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          paid_by?: string | null
          ready_at?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["payout_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "member_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          fps_id: string | null
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
          fps_id?: string | null
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
          fps_id?: string | null
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
          claimed_count: number
          created_at: string | null
          description: string | null
          fixed_expiry_date: string | null
          id: string
          is_active: boolean | null
          is_infinite: boolean | null
          max_claims: number | null
          reward_value: Json
          title: string
          trigger_conditions: Json
          type: Database["public"]["Enums"]["reward_type"]
          updated_at: string | null
          valid_duration_days: number | null
        }
        Insert: {
          claimed_count?: number
          created_at?: string | null
          description?: string | null
          fixed_expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_infinite?: boolean | null
          max_claims?: number | null
          reward_value: Json
          title: string
          trigger_conditions: Json
          type: Database["public"]["Enums"]["reward_type"]
          updated_at?: string | null
          valid_duration_days?: number | null
        }
        Update: {
          claimed_count?: number
          created_at?: string | null
          description?: string | null
          fixed_expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_infinite?: boolean | null
          max_claims?: number | null
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
          grading_company: string
          grading_score: string
          id: string
          product_id: string
          purchase_price: number
          sold_at: string | null
          sold_listing_id: string | null
          sold_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grading_company?: string
          grading_score?: string
          id?: string
          product_id: string
          purchase_price?: number
          sold_at?: string | null
          sold_listing_id?: string | null
          sold_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grading_company?: string
          grading_score?: string
          id?: string
          product_id?: string
          purchase_price?: number
          sold_at?: string | null
          sold_listing_id?: string | null
          sold_price?: number | null
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
          {
            foreignKeyName: "user_collections_sold_listing_id_fkey"
            columns: ["sold_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_collections_sold_listing_id_fkey"
            columns: ["sold_listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_product_summaries"
            referencedColumns: ["lowest_listing_id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          acknowledged_at: string | null
          calculated_expiry: string | null
          created_at: string | null
          grant_dedup_key: string
          id: string
          is_used: boolean | null
          template_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          calculated_expiry?: string | null
          created_at?: string | null
          grant_dedup_key?: string
          id?: string
          is_used?: boolean | null
          template_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          calculated_expiry?: string | null
          created_at?: string | null
          grant_dedup_key?: string
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
      marketplace_product_summaries: {
        Row: {
          card_number: string | null
          catalog_type: Database["public"]["Enums"]["catalog_type"] | null
          display_id: string | null
          grading_company: string | null
          grading_score: string | null
          highest_price: number | null
          image_url: string | null
          latest_listing_at: string | null
          listing_count: number | null
          lowest_listing_created_at: string | null
          lowest_listing_id: string | null
          lowest_price: number | null
          name_en: string | null
          name_ja: string | null
          name_zh: string | null
          product_id: string | null
          product_name: string | null
          rarity: string | null
          seller_id: string | null
          seller_name: string | null
          seller_persona:
            | Database["public"]["Enums"]["seller_persona_type"]
            | null
          set_code: string | null
          use_authentication: boolean | null
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
    }
    Functions: {
      _grading_require_admin: { Args: never; Returns: string }
      _grading_write_audit_log: {
        Args: {
          p_action: string
          p_admin_id: string
          p_from_status: string
          p_notes?: string
          p_order_id: string
          p_order_kind: string
          p_to_status: string
        }
        Returns: undefined
      }
      acknowledge_reward_grants: {
        Args: { p_user_reward_ids: string[] }
        Returns: Json
      }
      canonical_card_search_key: { Args: { input: string }; Returns: string }
      card_identifier_flexible_match: {
        Args: { p_query: string; p_target: string }
        Returns: boolean
      }
      card_search_tokens_array: { Args: { input: string }; Returns: string[] }
      catalog_card_identifier_matches: {
        Args: {
          p_card_number: string
          p_display_id: string
          p_query: string
          p_set_code: string
        }
        Returns: boolean
      }
      compact_alphanumeric: { Args: { input: string }; Returns: string }
      compute_price_vs_market_pct: {
        Args: { p_listing_price: number; p_market_avg_price: number }
        Returns: number
      }
      escape_ilike_pattern: { Args: { input: string }; Returns: string }
      execute_daily_check_in: { Args: never; Returns: Json }
      fn_apply_point_transaction: {
        Args: {
          p_amount: number
          p_description?: string
          p_source_ref?: string
          p_source_type: string
          p_user_id: string
        }
        Returns: number
      }
      fn_archive_seller_collection_for_listing: {
        Args: {
          p_final_price: number
          p_listing_id: string
          p_seller_id: string
        }
        Returns: undefined
      }
      fn_assert_offer_not_self_dealing: {
        Args: { p_buyer_id: string; p_seller_id: string }
        Returns: undefined
      }
      fn_assert_p2p_offer_aml_limits: {
        Args: {
          p_buyer_id: string
          p_listing_id: string
          p_offer_price: number
          p_use_authentication: boolean
        }
        Returns: undefined
      }
      fn_bump_listing_offers_count: {
        Args: { p_actor_id?: string; p_listing_id: string }
        Returns: undefined
      }
      fn_chat_party_profile_snippet: {
        Args: {
          p_persona: Database["public"]["Enums"]["seller_persona_type"]
          p_profile_id: string
        }
        Returns: Json
      }
      fn_claim_mission_points: {
        Args: { p_description?: string; p_mission_id: string; p_points: number }
        Returns: Json
      }
      fn_effective_check_in_streak: {
        Args: { p_user_id: string }
        Returns: number
      }
      fn_grant_points_from_template: {
        Args: { p_template_id: string; p_user_id: string }
        Returns: Json
      }
      fn_issue_reward_from_template: {
        Args: {
          p_grant_dedup_key?: string
          p_template_id: string
          p_user_id: string
        }
        Returns: string
      }
      fn_map_merchant_escrow_to_member_status: {
        Args: { p_escrow_status: Database["public"]["Enums"]["escrow_state"] }
        Returns: Database["public"]["Enums"]["member_order_state"]
      }
      fn_member_order_is_open: {
        Args: {
          p_escrow_status: Database["public"]["Enums"]["member_escrow_status"]
          p_status: Database["public"]["Enums"]["member_order_state"]
          p_use_authentication: boolean
        }
        Returns: boolean
      }
      fn_merchant_checkout_auth_fee: {
        Args: { p_use_auth: boolean }
        Returns: number
      }
      fn_merchant_checkout_shipping_fee: {
        Args: { p_shipping_method: string }
        Returns: number
      }
      fn_merchant_order_is_auth_in_progress: {
        Args: {
          p_escrow_status: Database["public"]["Enums"]["escrow_state"]
          p_requires_authentication: boolean
        }
        Returns: boolean
      }
      fn_merchant_order_is_open: {
        Args: { p_escrow_status: Database["public"]["Enums"]["escrow_state"] }
        Returns: boolean
      }
      fn_merchant_order_is_payment_stage: {
        Args: { p_escrow_status: Database["public"]["Enums"]["escrow_state"] }
        Returns: boolean
      }
      fn_merchant_order_needs_seller_action:
        | {
            Args: {
              p_escrow_status: Database["public"]["Enums"]["escrow_state"]
              p_requires_authentication: boolean
            }
            Returns: boolean
          }
        | {
            Args: {
              p_escrow_status: Database["public"]["Enums"]["escrow_state"]
              p_inbound_tracking_no?: string
              p_requires_authentication: boolean
            }
            Returns: boolean
          }
      fn_recalculate_member_reputation_tags: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      fn_recalculate_merchant_reputation_tags: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      fn_recalculate_reputation_tags: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      fn_redeem_member_points: {
        Args: {
          p_amount: number
          p_description?: string
          p_source_ref?: string
        }
        Returns: Json
      }
      fn_resolve_member_listing_id: {
        Args: { p_listing_ref: string; p_seller_id: string }
        Returns: string
      }
      fn_reward_template_has_stock: {
        Args: {
          p_template: Database["public"]["Tables"]["reward_templates"]["Row"]
        }
        Returns: boolean
      }
      fn_reward_template_progress_detail: {
        Args: {
          p_template: Database["public"]["Tables"]["reward_templates"]["Row"]
          p_user_id: string
        }
        Returns: Json
      }
      fn_sync_broken_check_in_streak: {
        Args: { p_user_id: string }
        Returns: number
      }
      fn_template_is_eligible: {
        Args: {
          p_template: Database["public"]["Tables"]["reward_templates"]["Row"]
          p_user_id: string
        }
        Returns: {
          eligible: boolean
          grant_dedup_key: string
        }[]
      }
      fn_try_auto_grant_rewards: { Args: { p_user_id: string }; Returns: Json }
      fn_try_reveal_order_reviews: {
        Args: { p_order_id: string; p_order_kind: string }
        Returns: boolean
      }
      generate_merchant_shop_handle: { Args: never; Returns: string }
      generate_profile_username: { Args: never; Returns: string }
      get_admin_grading_audit_history: {
        Args: { p_order_id: string; p_order_kind: string }
        Returns: Json
      }
      get_chat_room_thread:
        | { Args: { p_room_id: string }; Returns: Json }
        | {
            Args: {
              p_before_created_at?: string
              p_limit?: number
              p_room_id: string
            }
            Returns: Json
          }
      get_gamification_stats_for_me: { Args: never; Returns: Json }
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
      get_marketplace_rarities: {
        Args: never
        Returns: {
          rarity: string
        }[]
      }
      get_merchant_performance_analytics: {
        Args: { p_time_range?: string; p_top_limit?: number }
        Returns: Json
      }
      get_merchant_product_analytics: {
        Args: {
          p_history_page?: number
          p_history_page_size?: number
          p_product_id: string
          p_time_range?: string
        }
        Returns: Json
      }
      get_reward_coupon_center: { Args: never; Returns: Json }
      get_unacknowledged_reward_grants: { Args: never; Returns: Json }
      get_user_chat_inbox: { Args: never; Returns: Json }
      get_user_chat_inbox_lobby: { Args: never; Returns: Json }
      get_user_reward_coupons: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_card_identifier_query: { Args: { p_query: string }; Returns: boolean }
      is_chat_room_member: {
        Args: { p_room_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_display_name_available: { Args: { name: string }; Returns: boolean }
      listing_grade_sort_score: {
        Args: { grading_company: string; grading_score: string }
        Returns: number
      }
      refresh_marketplace_product_summaries: { Args: never; Returns: undefined }
      resolve_listing_market_price_company: {
        Args: { p_grading_company: string }
        Returns: string
      }
      resolve_listing_market_price_score: {
        Args: { p_grading_company: string; p_grading_score: string }
        Returns: string
      }
      rpc_accept_offer: {
        Args: { p_offer_id: string; p_seller_id: string }
        Returns: Json
      }
      rpc_admin_confirm_grading_intake: {
        Args: { p_order_id: string; p_order_kind: string }
        Returns: Json
      }
      rpc_admin_pass_grading: {
        Args: { p_notes?: string; p_order_id: string; p_order_kind: string }
        Returns: Json
      }
      rpc_admin_prepare_auth_refund: {
        Args: { p_order_id: string; p_order_kind: string; p_reason?: string }
        Returns: Json
      }
      rpc_admin_submit_grading_outbound: {
        Args: {
          p_order_id: string
          p_order_kind: string
          p_tracking_no: string
        }
        Returns: Json
      }
      rpc_attach_member_auth_order_payment_intent: {
        Args: { p_order_id: string; p_payment_intent_id: string }
        Returns: Json
      }
      rpc_attach_merchant_order_payment_intent: {
        Args: { p_order_id: string; p_payment_intent_id: string }
        Returns: Json
      }
      rpc_buy_now_listing: {
        Args: { p_buyer_id: string; p_listing_id: string; p_use_auth?: boolean }
        Returns: Json
      }
      rpc_buy_now_merchant_listing: {
        Args: { p_buyer_id: string; p_listing_id: string; p_use_auth?: boolean }
        Returns: Json
      }
      rpc_cancel_member_order: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      rpc_complete_member_auth_grading: {
        Args: { p_order_id: string }
        Returns: Json
      }
      rpc_complete_member_order: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      rpc_complete_merchant_order: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      rpc_confirm_buyer_received: {
        Args: { p_buyer_id: string; p_order_id: string }
        Returns: Json
      }
      rpc_confirm_platform_received: {
        Args: { p_order_id: string }
        Returns: Json
      }
      rpc_e2e_reset_listing_trading_fixture: {
        Args: { p_buyer_id: string; p_listing_id: string; p_seller_id: string }
        Returns: Json
      }
      rpc_fail_member_auth_order: {
        Args: { p_order_id: string }
        Returns: Json
      }
      rpc_finalize_auth_fee_capture: {
        Args: {
          p_admin_id?: string
          p_captured_amount_cents: number
          p_order_id: string
          p_order_kind: string
          p_payment_intent_id: string
        }
        Returns: Json
      }
      rpc_finalize_auth_grading_fail: {
        Args: {
          p_order_id: string
          p_order_kind: string
          p_payment_intent_id: string
        }
        Returns: Json
      }
      rpc_finalize_auth_refund: {
        Args: {
          p_order_id: string
          p_order_kind: string
          p_refund_amount_cents: number
          p_refund_id: string
        }
        Returns: Json
      }
      rpc_finalize_goods_capture: {
        Args: {
          p_admin_id?: string
          p_captured_amount_cents: number
          p_notes?: string
          p_order_id: string
          p_order_kind: string
          p_payment_intent_id: string
        }
        Returns: Json
      }
      rpc_finalize_merchant_order_payout: {
        Args: {
          p_destination_account_id: string
          p_order_id: string
          p_transfer_amount_cents: number
          p_transfer_id: string
        }
        Returns: Json
      }
      rpc_finalize_merchant_pending_payment_expiry: {
        Args: { p_order_id: string }
        Returns: Json
      }
      rpc_get_user_reviewed_member_order_ids: {
        Args: { p_order_ids: string[] }
        Returns: string[]
      }
      rpc_get_user_reviewed_merchant_order_ids: {
        Args: { p_order_ids: string[] }
        Returns: string[]
      }
      rpc_increment_listing_view: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      rpc_list_merchant_pending_payment_expiry_candidates: {
        Args: { p_limit?: number }
        Returns: {
          listing_id: string
          order_id: string
          stripe_payment_intent_id: string
        }[]
      }
      rpc_make_offer:
        | {
            Args: {
              p_buyer_id: string
              p_content: string
              p_listing_id: string
              p_offer_price: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_buyer_id: string
              p_content: string
              p_listing_id: string
              p_offer_price: number
              p_use_authentication?: boolean
            }
            Returns: Json
          }
      rpc_mark_auth_grading_fail_failed: {
        Args: { p_error: string; p_order_id: string; p_order_kind: string }
        Returns: Json
      }
      rpc_mark_auth_order_payment_voided: {
        Args: {
          p_order_id: string
          p_order_kind: string
          p_payment_intent_id: string
        }
        Returns: Json
      }
      rpc_mark_auth_refund_failed: {
        Args: { p_error: string; p_order_id: string; p_order_kind: string }
        Returns: Json
      }
      rpc_mark_chat_room_read: {
        Args: { p_read_at?: string; p_room_id: string }
        Returns: Json
      }
      rpc_mark_member_auth_order_authorized: {
        Args: {
          p_amounts?: Json
          p_order_id: string
          p_payment_intent_id: string
        }
        Returns: Json
      }
      rpc_mark_member_auth_order_paid: {
        Args: {
          p_amounts?: Json
          p_order_id: string
          p_payment_intent_id: string
        }
        Returns: Json
      }
      rpc_mark_merchant_order_authorized: {
        Args: {
          p_amounts?: Json
          p_order_id: string
          p_payment_intent_id: string
        }
        Returns: Json
      }
      rpc_mark_merchant_order_paid: {
        Args: {
          p_amounts?: Json
          p_order_id: string
          p_payment_intent_id: string
        }
        Returns: Json
      }
      rpc_mark_merchant_order_payout_failed: {
        Args: { p_error: string; p_order_id: string }
        Returns: Json
      }
      rpc_mock_pay_member_auth_order: {
        Args: {
          p_buyer_id: string
          p_mock_session_id?: string
          p_order_id: string
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
      rpc_prepare_auth_fee_capture: {
        Args: { p_order_id: string; p_order_kind: string }
        Returns: Json
      }
      rpc_prepare_auth_grading_fail: {
        Args: {
          p_fault_party: Database["public"]["Enums"]["grading_fault_party"]
          p_order_id: string
          p_order_kind: string
          p_reason?: string
        }
        Returns: Json
      }
      rpc_prepare_goods_capture: {
        Args: { p_notes?: string; p_order_id: string; p_order_kind: string }
        Returns: Json
      }
      rpc_prepare_member_auth_order_payment: {
        Args: { p_order_id: string }
        Returns: Json
      }
      rpc_prepare_merchant_order_payment: {
        Args: {
          p_order_id: string
          p_shipping_method: string
          p_use_auth?: boolean
        }
        Returns: Json
      }
      rpc_prepare_merchant_order_payout: {
        Args: { p_order_id: string }
        Returns: Json
      }
      rpc_reject_offer: {
        Args: { p_offer_id: string; p_seller_id: string }
        Returns: Json
      }
      rpc_send_chat_message: {
        Args: { p_content: string; p_room_id: string; p_sender_id: string }
        Returns: Json
      }
      rpc_submit_inbound_tracking: {
        Args: { p_order_id: string; p_seller_id: string; p_tracking_no: string }
        Returns: Json
      }
      rpc_submit_merchant_auth_inbound_tracking: {
        Args: {
          p_merchant_id: string
          p_order_id: string
          p_tracking_no: string
        }
        Returns: Json
      }
      rpc_submit_merchant_kyc_application: {
        Args: { p_application: Json; p_documents: Json; p_user_id: string }
        Returns: Json
      }
      rpc_submit_outbound_tracking: {
        Args: { p_order_id: string; p_tracking_no: string }
        Returns: Json
      }
      rpc_submit_transaction_review: {
        Args: {
          p_comment?: string
          p_order_id: string
          p_rating: number
          p_reviewee_id: string
          p_user_id?: string
        }
        Returns: Json
      }
      run_auto_grant_rewards_for_me: { Args: never; Returns: Json }
      search_admin_grading_orders: {
        Args: {
          p_keyword?: string
          p_order_kind?: string
          p_page?: number
          p_page_size?: number
          p_tab: string
        }
        Returns: Json
      }
      search_marketplace_products: {
        Args: {
          p_card_number?: string
          p_catalog_types?: Database["public"]["Enums"]["catalog_type"][]
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
          market_avg_price: number
          market_data_source: string
          name_en: string
          name_ja: string
          name_zh: string
          page: number
          page_size: number
          price_vs_market_pct: number
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
      search_marketplace_products_browse: {
        Args: { p_page?: number; p_page_size?: number; p_sort?: string }
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
          market_avg_price: number
          market_data_source: string
          name_en: string
          name_ja: string
          name_zh: string
          page: number
          page_size: number
          price_vs_market_pct: number
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
      search_marketplace_seller_listings: {
        Args: {
          p_grade_filters?: Json
          p_name_query?: string
          p_page?: number
          p_page_size?: number
          p_price_max?: number
          p_price_min?: number
          p_rarities?: string[]
          p_seller_id: string
          p_sort?: string
        }
        Returns: {
          card_number: string
          created_at: string
          display_id: string
          grading_company: string
          grading_score: string
          image_url: string
          listing_id: string
          market_avg_price: number
          market_data_source: string
          name_en: string
          name_ja: string
          name_zh: string
          page: number
          page_size: number
          price: number
          price_vs_market_pct: number
          product_id: string
          product_name: string
          range_end: number
          range_start: number
          rarity: string
          seller_id: string
          seller_max_price: number
          seller_min_price: number
          seller_name: string
          seller_persona: Database["public"]["Enums"]["seller_persona_type"]
          set_code: string
          total_count: number
          total_pages: number
          use_authentication: boolean
        }[]
      }
      search_merchant_trading_orders: {
        Args: {
          p_include_auth_in_progress?: boolean
          p_include_payment_pending?: boolean
          p_page?: number
          p_page_size?: number
          p_search_query?: string
          p_tab_status?: string
        }
        Returns: {
          buyer_avatar_path: string
          buyer_display_name: string
          buyer_id: string
          buyer_username: string
          card_number: string
          catalog_image_url: string
          count_needs_action: number
          count_pending_auth: number
          count_pending_payment: number
          count_status_all: number
          count_status_cancelled: number
          count_status_completed: number
          count_status_pending: number
          created_at: string
          display_id: string
          escrow_status: Database["public"]["Enums"]["escrow_state"]
          final_price: number
          grading_company: string
          grading_score: string
          has_reviewed_by_me: boolean
          listing_images: Json
          merchant_id: string
          order_id: string
          order_number: string
          page: number
          page_size: number
          product_name_en: string
          product_name_ja: string
          product_name_zh: string
          range_end: number
          range_start: number
          requires_authentication: boolean
          set_code: string
          total_count: number
          total_pages: number
        }[]
      }
      search_product_catalog: {
        Args: { p_item_type?: string; p_query: string }
        Returns: {
          card_number: string
          display_id: string
          id: string
          image_url: string
          jan_code: string
          name_en: string
          name_ja: string
          name_zh: string
          pokemon_stage: string
          rarity: string
          set_code: string
          snkr_rank: number
          total_count: number
          type: Database["public"]["Enums"]["catalog_type"]
        }[]
      }
      search_public_profile_reviews: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_persona: Database["public"]["Enums"]["review_persona"]
          p_profile_id: string
          p_sort?: string
        }
        Returns: {
          aggregate_rating: number
          comment: string
          created_at: string
          is_merchant_tx: boolean
          page: number
          page_size: number
          public_review_count: number
          range_end: number
          range_start: number
          rating: number
          review_id: string
          reviewer_avatar_path: string
          reviewer_display_name: string
          reviewer_id: string
          reviewer_persona: Database["public"]["Enums"]["review_persona"]
          reviewer_username: string
          total_count: number
          total_pages: number
        }[]
      }
      search_user_trading_orders: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_persona?: string
          p_search_query?: string
          p_tab_status?: string
        }
        Returns: {
          buyer_id: string
          card_number: string
          catalog_image_url: string
          count_needs_action: number
          count_persona_all: number
          count_persona_buy: number
          count_persona_sell: number
          count_status_all: number
          count_status_cancelled: number
          count_status_completed: number
          count_status_pending: number
          counterparty_avatar_path: string
          counterparty_display_name: string
          counterparty_id: string
          counterparty_username: string
          created_at: string
          display_id: string
          escrow_status: Database["public"]["Enums"]["member_escrow_status"]
          expires_at: string
          final_price: number
          grading_company: string
          grading_score: string
          has_reviewed_by_me: boolean
          listing_images: Json
          order_id: string
          order_number: string
          page: number
          page_size: number
          persona: string
          product_name_en: string
          product_name_ja: string
          product_name_zh: string
          range_end: number
          range_start: number
          seller_id: string
          set_code: string
          status: Database["public"]["Enums"]["member_order_state"]
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
        | "accessories"
      escrow_state:
        | "pending_payment"
        | "payment_held"
        | "authenticating"
        | "authenticated"
        | "completed_and_transferred"
        | "refunded"
      grading_fault_party:
        | "buyer"
        | "seller"
        | "platform"
        | "carrier"
        | "inconclusive"
      kyc_application_status: "pending" | "approved" | "rejected"
      kyc_state: "pending" | "verified" | "rejected"
      listing_engagement_event_type: "view" | "offer"
      listing_status: "active" | "sold" | "inactive"
      member_escrow_status:
        | "payment"
        | "custody"
        | "grading"
        | "shipped"
        | "released"
        | "cancelled"
      member_seller_payout_status:
        | "none"
        | "held"
        | "ready"
        | "processing"
        | "paid"
        | "frozen"
        | "failed"
      member_order_state:
        | "pending"
        | "meetup_arranged"
        | "completed"
        | "cancelled"
      offer_status: "pending" | "accepted" | "rejected" | "cancelled"
      payout_batch_status: "draft" | "processing" | "completed"
      payout_request_status:
        | "pending"
        | "ready"
        | "processing"
        | "completed"
        | "failed"
      payment_capture_status:
        | "none"
        | "authorized"
        | "auth_fee_captured"
        | "fully_captured"
        | "voided"
        | "refunded"
        | "partially_refunded"
      report_state: "pending" | "reviewing" | "resolved" | "dismissed"
      review_persona: "member" | "merchant"
      reward_type:
        | "discount_coupon"
        | "free_shipping"
        | "lucky_draw_ticket"
        | "points"
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
        "accessories",
      ],
      escrow_state: [
        "pending_payment",
        "payment_held",
        "authenticating",
        "authenticated",
        "completed_and_transferred",
        "refunded",
      ],
      grading_fault_party: [
        "buyer",
        "seller",
        "platform",
        "carrier",
        "inconclusive",
      ],
      kyc_application_status: ["pending", "approved", "rejected"],
      kyc_state: ["pending", "verified", "rejected"],
      listing_engagement_event_type: ["view", "offer"],
      listing_status: ["active", "sold", "inactive"],
      member_escrow_status: [
        "payment",
        "custody",
        "grading",
        "shipped",
        "released",
        "cancelled",
      ],
      member_seller_payout_status: [
        "none",
        "held",
        "ready",
        "processing",
        "paid",
        "frozen",
        "failed",
      ],
      member_order_state: [
        "pending",
        "meetup_arranged",
        "completed",
        "cancelled",
      ],
      offer_status: ["pending", "accepted", "rejected", "cancelled"],
      payout_batch_status: ["draft", "processing", "completed"],
      payout_request_status: [
        "pending",
        "ready",
        "processing",
        "completed",
        "failed",
      ],
      payment_capture_status: [
        "none",
        "authorized",
        "auth_fee_captured",
        "fully_captured",
        "voided",
        "refunded",
        "partially_refunded",
      ],
      report_state: ["pending", "reviewing", "resolved", "dismissed"],
      review_persona: ["member", "merchant"],
      reward_type: [
        "discount_coupon",
        "free_shipping",
        "lucky_draw_ticket",
        "points",
      ],
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
