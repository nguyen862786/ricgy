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
      affiliate_clicks: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          landing_path: string | null
          referer: string | null
          referrer_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip?: string | null
          landing_path?: string | null
          referer?: string | null
          referrer_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          landing_path?: string | null
          referer?: string | null
          referrer_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      app_settings: {
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
        Relationships: []
      }
      bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          name: string
          popup_body: string | null
          popup_cta_text: string | null
          popup_cta_url: string | null
          popup_dismiss_hours: number
          popup_enabled: boolean
          popup_image_url: string | null
          popup_title: string | null
          promo_code: string | null
          segment: string
          starts_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          tag_filter: string | null
          tier_filter: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          name: string
          popup_body?: string | null
          popup_cta_text?: string | null
          popup_cta_url?: string | null
          popup_dismiss_hours?: number
          popup_enabled?: boolean
          popup_image_url?: string | null
          popup_title?: string | null
          promo_code?: string | null
          segment?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          tag_filter?: string | null
          tier_filter?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          popup_body?: string | null
          popup_cta_text?: string | null
          popup_cta_url?: string | null
          popup_dismiss_hours?: number
          popup_enabled?: boolean
          popup_image_url?: string | null
          popup_title?: string | null
          promo_code?: string | null
          segment?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          tag_filter?: string | null
          tier_filter?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_tiers: {
        Row: {
          color: string
          created_at: string
          discount_percent: number
          id: string
          min_spent: number
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          discount_percent?: number
          id?: string
          min_spent?: number
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          discount_percent?: number
          id?: string
          min_spent?: number
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      einvoices: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_no: string | null
          is_batch: boolean
          issued_at: string | null
          order_id: string | null
          payload: Json
          provider: Database["public"]["Enums"]["einvoice_provider"]
          status: Database["public"]["Enums"]["einvoice_status"]
          store_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_no?: string | null
          is_batch?: boolean
          issued_at?: string | null
          order_id?: string | null
          payload?: Json
          provider?: Database["public"]["Enums"]["einvoice_provider"]
          status?: Database["public"]["Enums"]["einvoice_status"]
          store_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_no?: string | null
          is_batch?: boolean
          issued_at?: string | null
          order_id?: string | null
          payload?: Json
          provider?: Database["public"]["Enums"]["einvoice_provider"]
          status?: Database["public"]["Enums"]["einvoice_status"]
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "einvoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "einvoices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      fashion_combos: {
        Row: {
          combo_price: number
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          items: Json
          name: string
          original_price: number
          starts_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          combo_price?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          name: string
          original_price?: number
          starts_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          combo_price?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          original_price?: number
          starts_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fashion_combos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fashion_products: {
        Row: {
          base_price: number
          brand: string | null
          category: string
          created_at: string
          description: string | null
          gender: string
          id: string
          images: Json
          is_active: boolean
          name: string
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          brand?: string | null
          category?: string
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          images?: Json
          is_active?: boolean
          name: string
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          brand?: string | null
          category?: string
          created_at?: string
          description?: string | null
          gender?: string
          id?: string
          images?: Json
          is_active?: boolean
          name?: string
          tags?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fashion_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fashion_variants: {
        Row: {
          attributes: Json
          chest_cm: number | null
          color_hex: string | null
          color_image_url: string | null
          color_name: string | null
          created_at: string
          height_max_cm: number | null
          height_min_cm: number | null
          hip_cm: number | null
          id: string
          images: Json
          is_active: boolean
          length_cm: number | null
          price_delta: number
          product_id: string
          size: string
          sku: string
          stock: number
          tenant_id: string
          updated_at: string
          waist_cm: number | null
          weight_max_kg: number | null
          weight_min_kg: number | null
        }
        Insert: {
          attributes?: Json
          chest_cm?: number | null
          color_hex?: string | null
          color_image_url?: string | null
          color_name?: string | null
          created_at?: string
          height_max_cm?: number | null
          height_min_cm?: number | null
          hip_cm?: number | null
          id?: string
          images?: Json
          is_active?: boolean
          length_cm?: number | null
          price_delta?: number
          product_id: string
          size?: string
          sku: string
          stock?: number
          tenant_id: string
          updated_at?: string
          waist_cm?: number | null
          weight_max_kg?: number | null
          weight_min_kg?: number | null
        }
        Update: {
          attributes?: Json
          chest_cm?: number | null
          color_hex?: string | null
          color_image_url?: string | null
          color_name?: string | null
          created_at?: string
          height_max_cm?: number | null
          height_min_cm?: number | null
          hip_cm?: number | null
          id?: string
          images?: Json
          is_active?: boolean
          length_cm?: number | null
          price_delta?: number
          product_id?: string
          size?: string
          sku?: string
          stock?: number
          tenant_id?: string
          updated_at?: string
          waist_cm?: number | null
          weight_max_kg?: number | null
          weight_min_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fashion_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "fashion_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fashion_variants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_bookings: {
        Row: {
          booking_code: string
          check_in: string
          check_in_actual: string | null
          check_out: string
          check_out_actual: string | null
          created_at: string
          created_by: string | null
          discount: number
          extra_charges: number
          guest_email: string | null
          guest_id_number: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          note: string | null
          num_adults: number
          num_children: number
          paid_amount: number
          payment_method: string | null
          room_id: string
          room_price: number
          source: string
          special_requests: string | null
          status: string
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          booking_code?: string
          check_in: string
          check_in_actual?: string | null
          check_out: string
          check_out_actual?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          extra_charges?: number
          guest_email?: string | null
          guest_id_number?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          note?: string | null
          num_adults?: number
          num_children?: number
          paid_amount?: number
          payment_method?: string | null
          room_id: string
          room_price?: number
          source?: string
          special_requests?: string | null
          status?: string
          tenant_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          booking_code?: string
          check_in?: string
          check_in_actual?: string | null
          check_out?: string
          check_out_actual?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          extra_charges?: number
          guest_email?: string | null
          guest_id_number?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          note?: string | null
          num_adults?: number
          num_children?: number
          paid_amount?: number
          payment_method?: string | null
          room_id?: string
          room_price?: number
          source?: string
          special_requests?: string | null
          status?: string
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hotel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_guest_services: {
        Row: {
          booking_id: string | null
          category: string
          charge: number
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          iot_command: Json | null
          iot_device_id: string | null
          priority: string
          requested_at: string
          room_id: string | null
          scheduled_at: string | null
          staff_id: string | null
          staff_note: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          category?: string
          charge?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          iot_command?: Json | null
          iot_device_id?: string | null
          priority?: string
          requested_at?: string
          room_id?: string | null
          scheduled_at?: string | null
          staff_id?: string | null
          staff_note?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          category?: string
          charge?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          iot_command?: Json | null
          iot_device_id?: string | null
          priority?: string
          requested_at?: string
          room_id?: string | null
          scheduled_at?: string | null
          staff_id?: string | null
          staff_note?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_guest_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "hotel_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_guest_services_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hotel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_guest_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_rooms: {
        Row: {
          amenities: Json
          base_price: number
          capacity: number
          created_at: string
          floor: number | null
          id: string
          images: Json
          iot_device_id: string | null
          name: string
          room_number: string
          status: string
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          amenities?: Json
          base_price?: number
          capacity?: number
          created_at?: string
          floor?: number | null
          id?: string
          images?: Json
          iot_device_id?: string | null
          name: string
          room_number: string
          status?: string
          tenant_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          amenities?: Json
          base_price?: number
          capacity?: number
          created_at?: string
          floor?: number | null
          id?: string
          images?: Json
          iot_device_id?: string | null
          name?: string
          room_number?: string
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_docs: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          posted_at: string | null
          status: Database["public"]["Enums"]["inv_doc_status"]
          store_id: string | null
          to_store_id: string | null
          total_value: number
          type: Database["public"]["Enums"]["inv_doc_type"]
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          posted_at?: string | null
          status?: Database["public"]["Enums"]["inv_doc_status"]
          store_id?: string | null
          to_store_id?: string | null
          total_value?: number
          type: Database["public"]["Enums"]["inv_doc_type"]
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          posted_at?: string | null
          status?: Database["public"]["Enums"]["inv_doc_status"]
          store_id?: string | null
          to_store_id?: string | null
          total_value?: number
          type?: Database["public"]["Enums"]["inv_doc_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_docs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_docs_to_store_id_fkey"
            columns: ["to_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          doc_id: string
          id: string
          product_id: string
          product_name: string | null
          qty: number
          unit_cost: number
        }
        Insert: {
          doc_id: string
          id?: string
          product_id: string
          product_name?: string | null
          qty?: number
          unit_cost?: number
        }
        Update: {
          doc_id?: string
          id?: string
          product_id?: string
          product_name?: string | null
          qty?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "inventory_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          affiliate_commission: number
          agent_commission: number
          cashback_amount: number
          id: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          qty: number
          unit_price: number
        }
        Insert: {
          affiliate_commission?: number
          agent_commission?: number
          cashback_amount?: number
          id?: string
          line_total?: number
          order_id: string
          product_id: string
          product_name: string
          qty?: number
          unit_price?: number
        }
        Update: {
          affiliate_commission?: number
          agent_commission?: number
          cashback_amount?: number
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          product_name?: string
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_returns: {
        Row: {
          condition_notes: string | null
          created_at: string
          created_by: string | null
          exchange_product_name: string | null
          exchange_variant_id: string | null
          has_tags: boolean | null
          id: string
          is_clean: boolean | null
          is_not_torn: boolean | null
          order_code: string | null
          order_id: string | null
          processed_at: string | null
          processed_by: string | null
          product_name: string
          qty: number
          reason: string
          reason_detail: string | null
          refund_amount: number
          resolution: string | null
          status: string
          tenant_id: string
          unit_price: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          condition_notes?: string | null
          created_at?: string
          created_by?: string | null
          exchange_product_name?: string | null
          exchange_variant_id?: string | null
          has_tags?: boolean | null
          id?: string
          is_clean?: boolean | null
          is_not_torn?: boolean | null
          order_code?: string | null
          order_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          product_name: string
          qty?: number
          reason?: string
          reason_detail?: string | null
          refund_amount?: number
          resolution?: string | null
          status?: string
          tenant_id: string
          unit_price?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          condition_notes?: string | null
          created_at?: string
          created_by?: string | null
          exchange_product_name?: string | null
          exchange_variant_id?: string | null
          has_tags?: boolean | null
          id?: string
          is_clean?: boolean | null
          is_not_torn?: boolean | null
          order_code?: string | null
          order_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          product_name?: string
          qty?: number
          reason?: string
          reason_detail?: string | null
          refund_amount?: number
          resolution?: string | null
          status?: string
          tenant_id?: string
          unit_price?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_returns_exchange_variant_id_fkey"
            columns: ["exchange_variant_id"]
            isOneToOne: false
            referencedRelation: "fashion_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_returns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_returns_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "fashion_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          affiliate_id: string | null
          agent_id: string | null
          cashflow_mode: Database["public"]["Enums"]["cashflow_mode"]
          code: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount: number
          id: string
          note: string | null
          paid_at: string | null
          promo_code: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string | null
          subtotal: number
          total: number
        }
        Insert: {
          affiliate_id?: string | null
          agent_id?: string | null
          cashflow_mode?: Database["public"]["Enums"]["cashflow_mode"]
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          note?: string | null
          paid_at?: string | null
          promo_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string | null
          subtotal?: number
          total?: number
        }
        Update: {
          affiliate_id?: string | null
          agent_id?: string | null
          cashflow_mode?: Database["public"]["Enums"]["cashflow_mode"]
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          note?: string | null
          paid_at?: string | null
          promo_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string | null
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          bundle_price: number
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          industry: string
          is_active: boolean
          name: string
          starts_at: string | null
          store_id: string | null
          updated_at: string
        }
        Insert: {
          bundle_price?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          industry?: string
          is_active?: boolean
          name: string
          starts_at?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          bundle_price?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          industry?: string
          is_active?: boolean
          name?: string
          starts_at?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_bundles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_delta: number
          product_id: string
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_delta?: number
          product_id: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_delta?: number
          product_id?: string
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_rate_percent: number
          agent_rate_percent: number
          avg_cost: number
          cashback_type: Database["public"]["Enums"]["cashback_type"]
          cashback_value: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          list_price: number
          media: Json
          name: string
          sale_price: number | null
          sku: string | null
          stock: number
          store_id: string | null
          updated_at: string
        }
        Insert: {
          affiliate_rate_percent?: number
          agent_rate_percent?: number
          avg_cost?: number
          cashback_type?: Database["public"]["Enums"]["cashback_type"]
          cashback_value?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          list_price?: number
          media?: Json
          name: string
          sale_price?: number | null
          sku?: string | null
          stock?: number
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_rate_percent?: number
          agent_rate_percent?: number
          avg_cost?: number
          cashback_type?: Database["public"]["Enums"]["cashback_type"]
          cashback_value?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          list_price?: number
          media?: Json
          name?: string
          sale_price?: number | null
          sku?: string | null
          stock?: number
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agent_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_order_at: string | null
          marketing_notes: string | null
          phone: string | null
          referrer_id: string | null
          tags: string[]
          tenant_id: string | null
          tier: string
          total_spent: number
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_order_at?: string | null
          marketing_notes?: string | null
          phone?: string | null
          referrer_id?: string | null
          tags?: string[]
          tenant_id?: string | null
          tier?: string
          total_spent?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_order_at?: string | null
          marketing_notes?: string | null
          phone?: string | null
          referrer_id?: string | null
          tags?: string[]
          tenant_id?: string | null
          tier?: string
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_order_amount: number
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      promotions: {
        Row: {
          buy_qty: number | null
          company_subsidy_ratio: number
          created_at: string
          daily_end_min: number | null
          daily_start_min: number | null
          discount_percent: number
          ends_at: string | null
          get_qty: number | null
          id: string
          is_active: boolean
          is_qiclub_synced: boolean
          max_discount_amount: number | null
          name: string
          priority: number
          product_ids: string[] | null
          qiclub_prefix: string | null
          qiclub_subsidy_ratio: number
          starts_at: string | null
          store_id: string | null
          store_subsidy_ratio: number
          tier_name: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at: string
          weekdays: number[] | null
        }
        Insert: {
          buy_qty?: number | null
          company_subsidy_ratio?: number
          created_at?: string
          daily_end_min?: number | null
          daily_start_min?: number | null
          discount_percent?: number
          ends_at?: string | null
          get_qty?: number | null
          id?: string
          is_active?: boolean
          is_qiclub_synced?: boolean
          max_discount_amount?: number | null
          name: string
          priority?: number
          product_ids?: string[] | null
          qiclub_prefix?: string | null
          qiclub_subsidy_ratio?: number
          starts_at?: string | null
          store_id?: string | null
          store_subsidy_ratio?: number
          tier_name?: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string
          weekdays?: number[] | null
        }
        Update: {
          buy_qty?: number | null
          company_subsidy_ratio?: number
          created_at?: string
          daily_end_min?: number | null
          daily_start_min?: number | null
          discount_percent?: number
          ends_at?: string | null
          get_qty?: number | null
          id?: string
          is_active?: boolean
          is_qiclub_synced?: boolean
          max_discount_amount?: number | null
          name?: string
          priority?: number
          product_ids?: string[] | null
          qiclub_prefix?: string | null
          qiclub_subsidy_ratio?: number
          starts_at?: string | null
          store_id?: string | null
          store_subsidy_ratio?: number
          tier_name?: string | null
          type?: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      qiclub_members: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string
          qr_code: string
          total_points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone: string
          qr_code?: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string
          qr_code?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      qiclub_redemptions: {
        Row: {
          claimed_at: string | null
          code: string
          company_amount: number
          created_at: string
          created_by: string | null
          id: string
          order_id: string | null
          promotion_id: string | null
          promotion_name: string | null
          qiclub_amount: number
          qiclub_ref: string | null
          status: string
          store_amount: number
          store_id: string | null
          updated_at: string
          verified_at: string | null
          voucher_amount: number
          webhook_error: string | null
          webhook_status: string | null
        }
        Insert: {
          claimed_at?: string | null
          code: string
          company_amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string | null
          promotion_id?: string | null
          promotion_name?: string | null
          qiclub_amount?: number
          qiclub_ref?: string | null
          status?: string
          store_amount?: number
          store_id?: string | null
          updated_at?: string
          verified_at?: string | null
          voucher_amount?: number
          webhook_error?: string | null
          webhook_status?: string | null
        }
        Update: {
          claimed_at?: string | null
          code?: string
          company_amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string | null
          promotion_id?: string | null
          promotion_name?: string | null
          qiclub_amount?: number
          qiclub_ref?: string | null
          status?: string
          store_amount?: number
          store_id?: string | null
          updated_at?: string
          verified_at?: string | null
          voucher_amount?: number
          webhook_error?: string | null
          webhook_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qiclub_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qiclub_redemptions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qiclub_redemptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          closed_at: string | null
          counted_cash: number | null
          created_at: string
          diff: number | null
          id: string
          note: string | null
          opened_at: string
          opening_cash: number
          reason: string | null
          staff_email: string | null
          staff_id: string
          status: Database["public"]["Enums"]["shift_status"]
          store_id: string | null
          system_total: number
        }
        Insert: {
          closed_at?: string | null
          counted_cash?: number | null
          created_at?: string
          diff?: number | null
          id?: string
          note?: string | null
          opened_at?: string
          opening_cash?: number
          reason?: string | null
          staff_email?: string | null
          staff_id: string
          status?: Database["public"]["Enums"]["shift_status"]
          store_id?: string | null
          system_total?: number
        }
        Update: {
          closed_at?: string | null
          counted_cash?: number | null
          created_at?: string
          diff?: number | null
          id?: string
          note?: string | null
          opened_at?: string
          opening_cash?: number
          reason?: string | null
          staff_email?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["shift_status"]
          store_id?: string | null
          system_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "shifts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          billing_status: Database["public"]["Enums"]["billing_status"]
          cashflow_mode: Database["public"]["Enums"]["cashflow_mode"]
          code: string
          created_at: string
          grace_ends_at: string | null
          hardware_combo: boolean
          id: string
          industry: Database["public"]["Enums"]["app_industry"]
          is_active: boolean
          name: string
          paid_until: string | null
          phone: string | null
          plan: string
          tenant_id: string | null
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          billing_status?: Database["public"]["Enums"]["billing_status"]
          cashflow_mode?: Database["public"]["Enums"]["cashflow_mode"]
          code: string
          created_at?: string
          grace_ends_at?: string | null
          hardware_combo?: boolean
          id?: string
          industry?: Database["public"]["Enums"]["app_industry"]
          is_active?: boolean
          name: string
          paid_until?: string | null
          phone?: string | null
          plan?: string
          tenant_id?: string | null
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          billing_status?: Database["public"]["Enums"]["billing_status"]
          cashflow_mode?: Database["public"]["Enums"]["cashflow_mode"]
          code?: string
          created_at?: string
          grace_ends_at?: string | null
          hardware_combo?: boolean
          id?: string
          industry?: Database["public"]["Enums"]["app_industry"]
          is_active?: boolean
          name?: string
          paid_until?: string | null
          phone?: string | null
          plan?: string
          tenant_id?: string | null
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_leads: {
        Row: {
          barrier: string | null
          business_model: string | null
          contact_company: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          expectations: string[]
          id: string
          marketing_pains: string[]
          ops_pains: string[]
          unlocked_modules: string[]
        }
        Insert: {
          barrier?: string | null
          business_model?: string | null
          contact_company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          expectations?: string[]
          id?: string
          marketing_pains?: string[]
          ops_pains?: string[]
          unlocked_modules?: string[]
        }
        Update: {
          barrier?: string | null
          business_model?: string | null
          contact_company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          expectations?: string[]
          id?: string
          marketing_pains?: string[]
          ops_pains?: string[]
          unlocked_modules?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "survey_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_super_admins: {
        Row: {
          created_at: string
          email: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          note?: string | null
        }
        Relationships: []
      }
      tenant_memberships: {
        Row: {
          created_at: string
          id: string
          internal_tier: string
          joined_at: string
          last_purchase_at: string | null
          member_id: string
          points: number
          tenant_id: string
          total_spent: number
          updated_at: string
          visit_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          internal_tier?: string
          joined_at?: string
          last_purchase_at?: string | null
          member_id: string
          points?: number
          tenant_id: string
          total_spent?: number
          updated_at?: string
          visit_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          internal_tier?: string
          joined_at?: string
          last_purchase_at?: string | null
          member_id?: string
          points?: number
          tenant_id?: string
          total_spent?: number
          updated_at?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "qiclub_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_modules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module_key: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_key: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_key?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_id: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          reference_id: string | null
          status: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          type: Database["public"]["Enums"]["txn_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          type?: Database["public"]["Enums"]["txn_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          store_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      vegan_batches: {
        Row: {
          batch_number: string
          created_at: string
          exp_date: string
          id: string
          mfg_date: string
          product_id: string
          quantity_produced: number
          tenant_id: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          exp_date: string
          id?: string
          mfg_date?: string
          product_id: string
          quantity_produced?: number
          tenant_id?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          exp_date?: string
          id?: string
          mfg_date?: string
          product_id?: string
          quantity_produced?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vegan_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vegan_products"
            referencedColumns: ["id"]
          },
        ]
      }
      vegan_charity_programs: {
        Row: {
          budget: number
          created_at: string
          executed_at: string | null
          id: string
          note: string | null
          period_month: string
          status: string
          temple_id: string
          tenant_id: string
        }
        Insert: {
          budget?: number
          created_at?: string
          executed_at?: string | null
          id?: string
          note?: string | null
          period_month: string
          status?: string
          temple_id: string
          tenant_id?: string
        }
        Update: {
          budget?: number
          created_at?: string
          executed_at?: string | null
          id?: string
          note?: string | null
          period_month?: string
          status?: string
          temple_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vegan_charity_programs_temple_id_fkey"
            columns: ["temple_id"]
            isOneToOne: false
            referencedRelation: "vegan_temples"
            referencedColumns: ["id"]
          },
        ]
      }
      vegan_order_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: string
          tenant_id?: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vegan_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vegan_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vegan_order_items: {
        Row: {
          id: string
          name: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          name: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          id?: string
          name?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "vegan_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vegan_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vegan_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vegan_products"
            referencedColumns: ["id"]
          },
        ]
      }
      vegan_orders: {
        Row: {
          channel: string
          charity_amount: number
          code: string
          commission_amount: number
          created_at: string
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          estimated_delivery_at: string | null
          id: string
          status: string
          subtotal: number
          temple_id: string | null
          tenant_id: string
        }
        Insert: {
          channel?: string
          charity_amount?: number
          code?: string
          commission_amount?: number
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          status?: string
          subtotal?: number
          temple_id?: string | null
          tenant_id?: string
        }
        Update: {
          channel?: string
          charity_amount?: number
          code?: string
          commission_amount?: number
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          status?: string
          subtotal?: number
          temple_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vegan_orders_temple_id_fkey"
            columns: ["temple_id"]
            isOneToOne: false
            referencedRelation: "vegan_temples"
            referencedColumns: ["id"]
          },
        ]
      }
      vegan_products: {
        Row: {
          active: boolean
          category: string
          cost: number
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          sku: string
          storage_condition: string
          tenant_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          cost?: number
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
          sku: string
          storage_condition?: string
          tenant_id?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          cost?: number
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sku?: string
          storage_condition?: string
          tenant_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      vegan_shipment_items: {
        Row: {
          batch_id: string | null
          id: string
          product_id: string
          quantity: number
          shipment_id: string
        }
        Insert: {
          batch_id?: string | null
          id?: string
          product_id: string
          quantity?: number
          shipment_id: string
        }
        Update: {
          batch_id?: string | null
          id?: string
          product_id?: string
          quantity?: number
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vegan_shipment_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "vegan_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vegan_shipment_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vegan_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vegan_shipment_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "vegan_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      vegan_shipments: {
        Row: {
          code: string
          created_at: string
          id: string
          note: string | null
          received_at: string | null
          status: string
          temple_id: string
          tenant_id: string
        }
        Insert: {
          code?: string
          created_at?: string
          id?: string
          note?: string | null
          received_at?: string | null
          status?: string
          temple_id: string
          tenant_id?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          note?: string | null
          received_at?: string | null
          status?: string
          temple_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vegan_shipments_temple_id_fkey"
            columns: ["temple_id"]
            isOneToOne: false
            referencedRelation: "vegan_temples"
            referencedColumns: ["id"]
          },
        ]
      }
      vegan_temple_stock: {
        Row: {
          batch_id: string | null
          id: string
          product_id: string
          quantity: number
          temple_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          id?: string
          product_id: string
          quantity?: number
          temple_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          id?: string
          product_id?: string
          quantity?: number
          temple_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vegan_temple_stock_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "vegan_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vegan_temple_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vegan_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vegan_temple_stock_temple_id_fkey"
            columns: ["temple_id"]
            isOneToOne: false
            referencedRelation: "vegan_temples"
            referencedColumns: ["id"]
          },
        ]
      }
      vegan_temples: {
        Row: {
          address: string | null
          charity_fixed: number
          charity_mode: string
          charity_percent: number
          commission_rate: number
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          region: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          charity_fixed?: number
          charity_mode?: string
          charity_percent?: number
          commission_rate?: number
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          region?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          charity_fixed?: number
          charity_mode?: string
          charity_percent?: number
          commission_rate?: number
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          region?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          reward_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          reward_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          reward_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          bank_info: Json
          created_at: string
          id: string
          note: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Insert: {
          amount: number
          bank_info?: Json
          created_at?: string
          id?: string
          note?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Update: {
          amount?: number
          bank_info?: Json
          created_at?: string
          id?: string
          note?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_module_enabled: {
        Args: { _key: string; _tenant: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_manager: { Args: never; Returns: boolean }
      is_tenant_staff: { Args: never; Returns: boolean }
      recompute_customer_tier: {
        Args: { _user_id: string }
        Returns: undefined
      }
      restock_fashion_variant: {
        Args: { _qty: number; _variant_id: string }
        Returns: number
      }
    }
    Enums: {
      app_industry: "fnb" | "beverage" | "hotel" | "fashion"
      app_role:
        | "owner"
        | "admin"
        | "agent"
        | "affiliate"
        | "customer"
        | "super_admin"
        | "store_manager"
        | "cashier"
      billing_status: "trial" | "active" | "grace_period" | "suspended"
      campaign_status: "draft" | "active" | "ended"
      cashback_type: "percent" | "fixed"
      cashflow_mode: "per_store" | "company"
      einvoice_provider: "misa" | "viettel"
      einvoice_status: "pending" | "issued" | "cancelled"
      inv_doc_status: "draft" | "posted"
      inv_doc_type: "purchase" | "transfer" | "writeoff"
      order_status: "pending" | "paid" | "cancelled" | "refunded"
      promotion_type:
        | "flash_sale"
        | "happy_hour"
        | "buy_x_get_y"
        | "tier_discount"
      shift_status: "open" | "closed"
      txn_status: "pending" | "completed" | "failed" | "cancelled"
      txn_type: "cashback" | "commission" | "withdraw" | "adjust" | "redeem"
      withdrawal_status: "pending" | "approved" | "rejected" | "paid"
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
    Enums: {
      app_industry: ["fnb", "beverage", "hotel", "fashion"],
      app_role: [
        "owner",
        "admin",
        "agent",
        "affiliate",
        "customer",
        "super_admin",
        "store_manager",
        "cashier",
      ],
      billing_status: ["trial", "active", "grace_period", "suspended"],
      campaign_status: ["draft", "active", "ended"],
      cashback_type: ["percent", "fixed"],
      cashflow_mode: ["per_store", "company"],
      einvoice_provider: ["misa", "viettel"],
      einvoice_status: ["pending", "issued", "cancelled"],
      inv_doc_status: ["draft", "posted"],
      inv_doc_type: ["purchase", "transfer", "writeoff"],
      order_status: ["pending", "paid", "cancelled", "refunded"],
      promotion_type: [
        "flash_sale",
        "happy_hour",
        "buy_x_get_y",
        "tier_discount",
      ],
      shift_status: ["open", "closed"],
      txn_status: ["pending", "completed", "failed", "cancelled"],
      txn_type: ["cashback", "commission", "withdraw", "adjust", "redeem"],
      withdrawal_status: ["pending", "approved", "rejected", "paid"],
    },
  },
} as const
