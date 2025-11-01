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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activation_keys: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          is_used: boolean | null
          key: string
          period_days: number
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          is_used?: boolean | null
          key: string
          period_days: number
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          key?: string
          period_days?: number
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      admin_message_recipients: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          received_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          received_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          received_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "admin_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          include_offline: boolean
          message: string
          sender_id: string
          sender_name: string
          target_type: string
          target_users: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          include_offline?: boolean
          message: string
          sender_id: string
          sender_name: string
          target_type: string
          target_users?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          include_offline?: boolean
          message?: string
          sender_id?: string
          sender_name?: string
          target_type?: string
          target_users?: string[] | null
          title?: string
        }
        Relationships: []
      }
      admin_realtime_messages: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          sender_id: string
          sender_name: string
          target_user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          sender_id: string
          sender_name: string
          target_user_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          sender_id?: string
          sender_name?: string
          target_user_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_system_config: {
        Row: {
          auto_update_enabled: boolean
          backup_enabled: boolean
          backup_interval: number
          created_at: string
          id: string
          log_retention: number
          maintenance_mode: boolean
          max_users: number
          server_uptime_start: string
          session_timeout: number
          system_version: string
          updated_at: string
        }
        Insert: {
          auto_update_enabled?: boolean
          backup_enabled?: boolean
          backup_interval?: number
          created_at?: string
          id?: string
          log_retention?: number
          maintenance_mode?: boolean
          max_users?: number
          server_uptime_start?: string
          session_timeout?: number
          system_version?: string
          updated_at?: string
        }
        Update: {
          auto_update_enabled?: boolean
          backup_enabled?: boolean
          backup_interval?: number
          created_at?: string
          id?: string
          log_retention?: number
          maintenance_mode?: boolean
          max_users?: number
          server_uptime_start?: string
          session_timeout?: number
          system_version?: string
          updated_at?: string
        }
        Relationships: []
      }
      assinaturas: {
        Row: {
          created_at: string
          id: string
          next_payment_date: string | null
          preapproval_id: string | null
          status: string
          updated_at: string
          user_email: string
          user_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          next_payment_date?: string | null
          preapproval_id?: string | null
          status?: string
          updated_at?: string
          user_email: string
          user_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          next_payment_date?: string | null
          preapproval_id?: string | null
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      campaign_clients: {
        Row: {
          address: string
          cpf: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address: string
          cpf: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string
          cpf?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      campaign_deliveries: {
        Row: {
          client_id: string
          created_at: string
          delivery_date: string
          id: string
          material_id: string
          period_id: string | null
          price_per_kg: number
          total_value: number
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          client_id: string
          created_at?: string
          delivery_date?: string
          id?: string
          material_id: string
          period_id?: string | null
          price_per_kg: number
          total_value: number
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          client_id?: string
          created_at?: string
          delivery_date?: string
          id?: string
          material_id?: string
          period_id?: string | null
          price_per_kg?: number
          total_value?: number
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      campaign_materials: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_per_kg: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_per_kg?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_per_kg?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_periods: {
        Row: {
          account_value: number | null
          client_id: string
          closed_at: string | null
          created_at: string
          discount_percentage: number | null
          end_date: string
          final_value: number
          id: string
          is_closed: boolean
          start_date: string
          total_accumulated: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_value?: number | null
          client_id: string
          closed_at?: string | null
          created_at?: string
          discount_percentage?: number | null
          end_date: string
          final_value?: number
          id?: string
          is_closed?: boolean
          start_date: string
          total_accumulated?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_value?: number | null
          client_id?: string
          closed_at?: string | null
          created_at?: string
          discount_percentage?: number | null
          end_date?: string
          final_value?: number
          id?: string
          is_closed?: boolean
          start_date?: string
          total_accumulated?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_vouchers: {
        Row: {
          client_id: string
          created_at: string
          generated_at: string
          id: string
          period_id: string
          user_id: string
          voucher_data: Json
        }
        Insert: {
          client_id: string
          created_at?: string
          generated_at?: string
          id?: string
          period_id: string
          user_id: string
          voucher_data: Json
        }
        Update: {
          client_id?: string
          created_at?: string
          generated_at?: string
          id?: string
          period_id?: string
          user_id?: string
          voucher_data?: Json
        }
        Relationships: []
      }
      cash_registers: {
        Row: {
          closing_timestamp: string | null
          created_at: string | null
          current_amount: number
          final_amount: number | null
          id: string
          initial_amount: number
          opening_timestamp: string | null
          status: string | null
          unidade_id: string | null
          user_id: string
        }
        Insert: {
          closing_timestamp?: string | null
          created_at?: string | null
          current_amount?: number
          final_amount?: number | null
          id?: string
          initial_amount?: number
          opening_timestamp?: string | null
          status?: string | null
          unidade_id?: string | null
          user_id: string
        }
        Update: {
          closing_timestamp?: string | null
          created_at?: string | null
          current_amount?: number
          final_amount?: number | null
          id?: string
          initial_amount?: number
          opening_timestamp?: string | null
          status?: string | null
          unidade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions: {
        Row: {
          amount: number
          cash_register_id: string
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          type: string
          unidade_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          cash_register_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type: string
          unidade_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type?: string
          unidade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          id: string
          name: string
          unidade_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          unidade_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          unidade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      error_reports: {
        Row: {
          created_at: string
          error_description: string
          error_title: string
          error_type: string
          id: string
          is_read: boolean
          read_at: string | null
          read_by: string | null
          reproduce_steps: string | null
          updated_at: string
          user_email: string
          user_id: string
          user_whatsapp: string | null
        }
        Insert: {
          created_at?: string
          error_description: string
          error_title: string
          error_type: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          reproduce_steps?: string | null
          updated_at?: string
          user_email: string
          user_id: string
          user_whatsapp?: string | null
        }
        Update: {
          created_at?: string
          error_description?: string
          error_title?: string
          error_type?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          read_by?: string | null
          reproduce_steps?: string | null
          updated_at?: string
          user_email?: string
          user_id?: string
          user_whatsapp?: string | null
        }
        Relationships: []
      }
      global_landing_settings: {
        Row: {
          background_image_url: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          footer_text: string
          hero_badge_text: string
          hero_button_text: string
          hero_description: string
          hero_main_title: string
          hero_subtitle: string
          id: string
          logo_url: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          testimonials: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          background_image_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          footer_text?: string
          hero_badge_text?: string
          hero_button_text?: string
          hero_description?: string
          hero_main_title?: string
          hero_subtitle?: string
          id?: string
          logo_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          testimonials?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          background_image_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          footer_text?: string
          hero_badge_text?: string
          hero_button_text?: string
          hero_description?: string
          hero_main_title?: string
          hero_subtitle?: string
          id?: string
          logo_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          testimonials?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      global_notification_recipients: {
        Row: {
          id: string
          notification_id: string
          received_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          received_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          received_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "global_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      global_notifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          message: string
          sender_id: string
          sender_name: string
          title: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          message: string
          sender_id: string
          sender_name: string
          title: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          message?: string
          sender_id?: string
          sender_name?: string
          title?: string
        }
        Relationships: []
      }
      guide_page_settings: {
        Row: {
          badge_text: string
          created_at: string | null
          cta_button_text: string
          cta_subtitle: string
          cta_title: string
          feature1_subtitle: string
          feature1_title: string
          feature2_subtitle: string
          feature2_title: string
          feature3_subtitle: string
          feature3_title: string
          id: string
          main_title: string
          subtitle: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_text?: string
          created_at?: string | null
          cta_button_text?: string
          cta_subtitle?: string
          cta_title?: string
          feature1_subtitle?: string
          feature1_title?: string
          feature2_subtitle?: string
          feature2_title?: string
          feature3_subtitle?: string
          feature3_title?: string
          id?: string
          main_title?: string
          subtitle?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_text?: string
          created_at?: string | null
          cta_button_text?: string
          cta_subtitle?: string
          cta_title?: string
          feature1_subtitle?: string
          feature1_title?: string
          feature2_subtitle?: string
          feature2_title?: string
          feature3_subtitle?: string
          feature3_title?: string
          id?: string
          main_title?: string
          subtitle?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      guide_videos: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          duration: string | null
          id: string
          is_active: boolean | null
          order_position: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          youtube_video_id: string | null
        }
        Insert: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration?: string | null
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          youtube_video_id?: string | null
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration?: string | null
          id?: string
          is_active?: boolean | null
          order_position?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      landing_page_settings: {
        Row: {
          background_image_url: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          footer_text: string
          hero_badge_text: string
          hero_button_text: string
          hero_description: string
          hero_main_title: string
          hero_subtitle: string
          id: string
          logo_url: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          testimonials: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_image_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          footer_text?: string
          hero_badge_text?: string
          hero_button_text?: string
          hero_description?: string
          hero_main_title?: string
          hero_subtitle?: string
          id?: string
          logo_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          testimonials?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_image_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          footer_text?: string
          hero_badge_text?: string
          hero_button_text?: string
          hero_description?: string
          hero_main_title?: string
          hero_subtitle?: string
          id?: string
          logo_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          testimonials?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      maintenance_notices: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          message: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          message: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          message?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string | null
          id: string
          name: string
          price: number
          sale_price: number
          unidade_id: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          price?: number
          sale_price?: number
          unidade_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          price?: number
          sale_price?: number
          unidade_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      mercado_pago_payments: {
        Row: {
          created_at: string
          external_reference: string | null
          id: string
          payer_email: string
          payment_id: string
          payment_method_id: string | null
          qr_code: string | null
          qr_code_base64: string | null
          status: string
          status_detail: string | null
          ticket_url: string | null
          transaction_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_reference?: string | null
          id?: string
          payer_email: string
          payment_id: string
          payment_method_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status: string
          status_detail?: string | null
          ticket_url?: string | null
          transaction_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_reference?: string | null
          id?: string
          payer_email?: string
          payment_id?: string
          payment_method_id?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          status?: string
          status_detail?: string | null
          ticket_url?: string | null
          transaction_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_cancellations: {
        Row: {
          cancellation_reason: string
          cancelled_at: string
          cancelled_by: string
          id: string
          order_id: string
          user_id: string
        }
        Insert: {
          cancellation_reason: string
          cancelled_at?: string
          cancelled_by: string
          id?: string
          order_id: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string
          cancelled_at?: string
          cancelled_by?: string
          id?: string
          order_id?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          material_id: string
          material_name: string
          order_id: string
          price: number
          quantity: number
          tara: number | null
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          material_id: string
          material_name: string
          order_id: string
          price: number
          quantity: number
          tara?: number | null
          total: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          material_id?: string
          material_name?: string
          order_id?: string
          price?: number
          quantity?: number
          tara?: number | null
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payment_details: {
        Row: {
          created_at: string
          id: string
          order_id: string
          payment_method: string
          pix_key_type: string | null
          pix_key_value: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          payment_method: string
          pix_key_type?: string | null
          pix_key_value?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          pix_key_type?: string | null
          pix_key_value?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_payments: {
        Row: {
          created_at: string
          id: string
          order_id: string
          payment_method: string
          pix_key_type: string | null
          pix_key_value: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          payment_method: string
          pix_key_type?: string | null
          pix_key_value?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          pix_key_type?: string | null
          pix_key_value?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reprints: {
        Row: {
          created_at: string
          id: string
          last_reprint_at: string | null
          order_id: string
          reprint_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reprint_at?: string | null
          order_id: string
          reprint_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reprint_at?: string | null
          order_id?: string
          reprint_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cancelled: boolean | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          customer_id: string
          id: string
          payment_method: string | null
          payment_method_type: string | null
          pix_key_type: string | null
          pix_key_value: string | null
          status: string | null
          total: number
          type: string
          unidade_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled?: boolean | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          payment_method?: string | null
          payment_method_type?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          status?: string | null
          total?: number
          type: string
          unidade_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled?: boolean | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          payment_method?: string | null
          payment_method_type?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          status?: string | null
          total?: number
          type?: string
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          deactivated_at: string | null
          email: string | null
          id: string
          indicador_id: string | null
          is_active: boolean | null
          last_login_at: string | null
          name: string | null
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          email?: string | null
          id: string
          indicador_id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          email?: string | null
          id?: string
          indicador_id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_format_settings: {
        Row: {
          address_font_size: string
          container_width: string
          created_at: string
          customer_font_size: string
          datetime_font_size: string
          final_total_font_size: string
          font_family: string
          format: string
          id: string
          logo_max_height: string
          logo_max_width: string
          margins: string
          padding: string
          phone_font_size: string
          quote_font_size: string
          table_font_size: string
          title_font_size: string
          totals_font_size: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_font_size?: string
          container_width?: string
          created_at?: string
          customer_font_size?: string
          datetime_font_size?: string
          final_total_font_size?: string
          font_family?: string
          format: string
          id?: string
          logo_max_height?: string
          logo_max_width?: string
          margins?: string
          padding?: string
          phone_font_size?: string
          quote_font_size?: string
          table_font_size?: string
          title_font_size?: string
          totals_font_size?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_font_size?: string
          container_width?: string
          created_at?: string
          customer_font_size?: string
          datetime_font_size?: string
          final_total_font_size?: string
          font_family?: string
          format?: string
          id?: string
          logo_max_height?: string
          logo_max_width?: string
          margins?: string
          padding?: string
          phone_font_size?: string
          quote_font_size?: string
          table_font_size?: string
          title_font_size?: string
          totals_font_size?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recompensas_indicacao: {
        Row: {
          created_at: string
          data_credito: string
          dias_creditados: number
          id: string
          indicado_id: string
          plano_ativado: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_credito?: string
          dias_creditados: number
          id?: string
          indicado_id: string
          plano_ativado: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_credito?: string
          dias_creditados?: number
          id?: string
          indicado_id?: string
          plano_ativado?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recompensas_indicacao_indicado_id_fkey"
            columns: ["indicado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recompensas_indicacao_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_configurations: {
        Row: {
          bing_verification: string | null
          breadcrumbs_enabled: boolean | null
          canonical_url: string | null
          created_at: string | null
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          google_search_console_verification: string | null
          google_tag_manager_id: string | null
          hreflang: Json | null
          id: string
          image_optimization_enabled: boolean | null
          lazy_loading_enabled: boolean | null
          noindex_pages: string[] | null
          og_description: string | null
          og_image: string | null
          og_site_name: string | null
          og_title: string | null
          og_type: string | null
          og_url: string | null
          priority_pages: Json | null
          robots_txt: string | null
          schema_org: Json | null
          site_author: string
          site_description: string
          site_keywords: string
          site_title: string
          sitemap_enabled: boolean | null
          twitter_card: string | null
          twitter_creator: string | null
          twitter_description: string | null
          twitter_image: string | null
          twitter_site: string | null
          twitter_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bing_verification?: string | null
          breadcrumbs_enabled?: boolean | null
          canonical_url?: string | null
          created_at?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_search_console_verification?: string | null
          google_tag_manager_id?: string | null
          hreflang?: Json | null
          id?: string
          image_optimization_enabled?: boolean | null
          lazy_loading_enabled?: boolean | null
          noindex_pages?: string[] | null
          og_description?: string | null
          og_image?: string | null
          og_site_name?: string | null
          og_title?: string | null
          og_type?: string | null
          og_url?: string | null
          priority_pages?: Json | null
          robots_txt?: string | null
          schema_org?: Json | null
          site_author?: string
          site_description?: string
          site_keywords?: string
          site_title?: string
          sitemap_enabled?: boolean | null
          twitter_card?: string | null
          twitter_creator?: string | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_site?: string | null
          twitter_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bing_verification?: string | null
          breadcrumbs_enabled?: boolean | null
          canonical_url?: string | null
          created_at?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_search_console_verification?: string | null
          google_tag_manager_id?: string | null
          hreflang?: Json | null
          id?: string
          image_optimization_enabled?: boolean | null
          lazy_loading_enabled?: boolean | null
          noindex_pages?: string[] | null
          og_description?: string | null
          og_image?: string | null
          og_site_name?: string | null
          og_title?: string | null
          og_type?: string | null
          og_url?: string | null
          priority_pages?: Json | null
          robots_txt?: string | null
          schema_org?: Json | null
          site_author?: string
          site_description?: string
          site_keywords?: string
          site_title?: string
          sitemap_enabled?: boolean | null
          twitter_card?: string | null
          twitter_creator?: string | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_site?: string | null
          twitter_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          amount: number
          created_at: string
          description: string
          display_order: number | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          is_promotional: boolean | null
          name: string
          period: string
          plan_id: string
          price: number
          promotional_description: string | null
          promotional_period: string | null
          promotional_price: number | null
          savings: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_promotional?: boolean | null
          name: string
          period: string
          plan_id: string
          price: number
          promotional_description?: string | null
          promotional_period?: string | null
          promotional_price?: number | null
          savings?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_promotional?: boolean | null
          name?: string
          period?: string
          plan_id?: string
          price?: number
          promotional_description?: string | null
          promotional_period?: string | null
          promotional_price?: number | null
          savings?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          activated_at: string | null
          activation_method: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          period_days: number | null
          plan_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activation_method?: string | null
          created_at?: string | null
          expires_at?: string | null
          id: string
          is_active?: boolean | null
          period_days?: number | null
          plan_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activation_method?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          period_days?: number | null
          plan_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          id: string
          logo: string | null
          seo_config: Json | null
          updated_at: string
          user_id: string
          whatsapp1: string | null
          whatsapp2: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          id?: string
          logo?: string | null
          seo_config?: Json | null
          updated_at?: string
          user_id: string
          whatsapp1?: string | null
          whatsapp2?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          id?: string
          logo?: string | null
          seo_config?: Json | null
          updated_at?: string
          user_id?: string
          whatsapp1?: string | null
          whatsapp2?: string | null
        }
        Relationships: []
      }
      unidade_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          session_token: string
          unidade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token: string
          unidade_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          unidade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidade_sessions_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          is_active: boolean
          nome: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accounts: {
        Row: {
          created_at: string
          email: string
          empresa: string | null
          id: string
          nome_completo: string
          plano_ativo: boolean | null
          senha_hash: string
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa?: string | null
          id?: string
          nome_completo: string
          plano_ativo?: boolean | null
          senha_hash: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          nome_completo?: string
          plano_ativo?: boolean | null
          senha_hash?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      user_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_direct_messages: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          message: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          sender_name: string
          title: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          message: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          sender_name: string
          title: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          sender_name?: string
          title?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          sender_name: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          sender_name: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          sender_name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string
          id: string
          is_online: boolean
          last_seen_at: string
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen_at?: string
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen_at?: string
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          activated_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          plan_type: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          plan_type?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          plan_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_unidade_session: {
        Args: {
          device_info_input?: string
          ip_address_input?: unknown
          session_token_input: string
          unidade_uuid: string
        }
        Returns: boolean
      }
      check_password_breach: {
        Args: { password_hash: string }
        Returns: boolean
      }
      cleanup_inactive_unidade_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_presence: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      deactivate_unidade_session: {
        Args: { unidade_uuid: string }
        Returns: undefined
      }
      generate_ref_key: {
        Args: { user_name: string }
        Returns: string
      }
      get_dashboard_summary: {
        Args: {
          filter_end?: string
          filter_start?: string
          target_user_id: string
        }
        Returns: Json
      }
      get_online_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          last_seen_at: string
          user_id: string
        }[]
      }
      get_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_unread_admin_messages: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_unread_direct_messages: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_unread_error_reports: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          error_description: string
          error_title: string
          error_type: string
          id: string
          user_email: string
        }[]
      }
      get_unread_global_notifications: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_unread_realtime_messages: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_user_active_cash_register: {
        Args: { target_user_id: string }
        Returns: {
          closing_timestamp: string | null
          created_at: string | null
          current_amount: number
          final_amount: number | null
          id: string
          initial_amount: number
          opening_timestamp: string | null
          status: string | null
          unidade_id: string | null
          user_id: string
        }[]
      }
      get_user_cash_registers: {
        Args: { target_user_id: string }
        Returns: {
          closing_timestamp: string | null
          created_at: string | null
          current_amount: number
          final_amount: number | null
          id: string
          initial_amount: number
          opening_timestamp: string | null
          status: string | null
          unidade_id: string | null
          user_id: string
        }[]
      }
      get_user_materials: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string | null
          id: string
          name: string
          price: number
          sale_price: number
          unidade_id: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }[]
      }
      get_user_orders: {
        Args: { target_user_id: string }
        Returns: {
          cancellation_reason: string | null
          cancelled: boolean | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          customer_id: string
          id: string
          payment_method: string | null
          payment_method_type: string | null
          pix_key_type: string | null
          pix_key_value: string | null
          status: string | null
          total: number
          type: string
          unidade_id: string | null
          updated_at: string | null
          user_id: string
        }[]
      }
      get_user_referrals: {
        Args: { user_uuid: string }
        Returns: {
          data_recompensa: string
          dias_recompensa: number
          indicado_email: string
          indicado_id: string
          indicado_name: string
          is_active: boolean
          plan_type: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_status"]
      }
      get_user_roles: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      get_user_status: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_status"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_subscription_active: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_unidade_available: {
        Args: { unidade_uuid: string }
        Returns: boolean
      }
      regenerate_all_ref_keys: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      sanitize_input: {
        Args: { input_text: string }
        Returns: string
      }
      sanitize_text_input: {
        Args: { input_text: string }
        Returns: string
      }
      schedule_presence_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_customer_name: {
        Args: { name_input: string }
        Returns: string
      }
      validate_email: {
        Args: { email_input: string }
        Returns: string
      }
      validate_material_name: {
        Args: { name_input: string }
        Returns: string
      }
      validate_subscription_access: {
        Args: { required_feature?: string; target_user_id: string }
        Returns: boolean
      }
      validate_user_data: {
        Args: {
          p_email: string
          p_nome_completo: string
          p_senha: string
          p_whatsapp: string
        }
        Returns: boolean
      }
      validate_user_data_with_breach_check: {
        Args: {
          p_email: string
          p_nome_completo: string
          p_senha: string
          p_whatsapp: string
        }
        Returns: boolean
      }
      validate_user_input: {
        Args: { input_text: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      user_status: "user" | "admin"
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
      app_role: ["admin", "moderator", "user"],
      user_status: ["user", "admin"],
    },
  },
} as const
