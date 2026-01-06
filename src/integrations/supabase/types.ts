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
      active_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          os: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          os?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          os?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_access_logs: {
        Row: {
          action: string
          browser: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          os: string | null
          session_id: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          os?: string | null
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          os?: string | null
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_email: string | null
          admin_id: string | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          new_value: Json | null
          old_value: Json | null
          target_record_id: string | null
          target_table: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          target_record_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          target_record_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
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
      admin_user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          page_path: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_featured: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content_html: string | null
          content_md: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean | null
          og_image: string | null
          pillar_page_slug: string | null
          published_at: string | null
          reading_time_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          og_image?: string | null
          pillar_page_slug?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          og_image?: string | null
          pillar_page_slug?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
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
      content_versions: {
        Row: {
          content_id: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          data: Json
          id: string
          is_published: boolean | null
          publish_note: string | null
          published_at: string | null
          version_number: number
        }
        Insert: {
          content_id?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          data: Json
          id?: string
          is_published?: boolean | null
          publish_note?: string | null
          published_at?: string | null
          version_number: number
        }
        Update: {
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          is_published?: boolean | null
          publish_note?: string | null
          published_at?: string | null
          version_number?: number
        }
        Relationships: []
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
      depot_clients: {
        Row: {
          address_city: string | null
          address_neighborhood: string | null
          address_number: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          total_orders: number | null
          total_spent: number | null
          unidade_id: string | null
          updated_at: string | null
          user_id: string
          whatsapp: string
        }
        Insert: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          total_orders?: number | null
          total_spent?: number | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp: string
        }
        Update: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          total_orders?: number | null
          total_spent?: number | null
          unidade_id?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "depot_clients_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      depot_employees: {
        Row: {
          created_at: string | null
          email: string
          employee_user_id: string | null
          id: string
          initial_password_set: boolean | null
          is_active: boolean | null
          last_login_at: string | null
          name: string
          owner_user_id: string
          password_changed_at: string | null
          phone: string | null
          role: string | null
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          employee_user_id?: string | null
          id?: string
          initial_password_set?: boolean | null
          is_active?: boolean | null
          last_login_at?: string | null
          name: string
          owner_user_id: string
          password_changed_at?: string | null
          phone?: string | null
          role?: string | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          employee_user_id?: string | null
          id?: string
          initial_password_set?: boolean | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string
          owner_user_id?: string
          password_changed_at?: string | null
          phone?: string | null
          role?: string | null
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "depot_employees_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_permissions: {
        Row: {
          employee_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: string
        }
        Insert: {
          employee_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: string
        }
        Update: {
          employee_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "depot_employees"
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
      feature_flags: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled_for_users: string[] | null
          enabled_percentage: number | null
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled_for_users?: string[] | null
          enabled_percentage?: number | null
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled_for_users?: string[] | null
          enabled_percentage?: number | null
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
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
          video_bullets: string | null
          video_enabled: boolean | null
          video_poster_url: string | null
          video_subtitle: string | null
          video_title: string | null
          video_url: string | null
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
          video_bullets?: string | null
          video_enabled?: boolean | null
          video_poster_url?: string | null
          video_subtitle?: string | null
          video_title?: string | null
          video_url?: string | null
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
          video_bullets?: string | null
          video_enabled?: boolean | null
          video_poster_url?: string | null
          video_subtitle?: string | null
          video_title?: string | null
          video_url?: string | null
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
      glossary_terms: {
        Row: {
          created_at: string
          examples: string | null
          id: string
          long_definition: string | null
          related_links: Json | null
          related_terms: string[] | null
          seo_description: string | null
          seo_title: string | null
          short_definition: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          term: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          examples?: string | null
          id?: string
          long_definition?: string | null
          related_links?: Json | null
          related_terms?: string[] | null
          seo_description?: string | null
          seo_title?: string | null
          short_definition: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          term: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          examples?: string | null
          id?: string
          long_definition?: string | null
          related_links?: Json | null
          related_terms?: string[] | null
          seo_description?: string | null
          seo_title?: string | null
          short_definition?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          term?: string
          updated_at?: string
          view_count?: number | null
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
      help_articles: {
        Row: {
          category_id: string | null
          content_html: string | null
          content_md: string | null
          created_at: string
          excerpt: string | null
          id: string
          module: Database["public"]["Enums"]["system_module"] | null
          og_image: string | null
          reading_time_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          module?: Database["public"]["Enums"]["system_module"] | null
          og_image?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          module?: Database["public"]["Enums"]["system_module"] | null
          og_image?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "help_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          module: Database["public"]["Enums"]["system_module"] | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          module?: Database["public"]["Enums"]["system_module"] | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          module?: Database["public"]["Enums"]["system_module"] | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      landing_page_settings: {
        Row: {
          author: string | null
          background_image_url: string | null
          canonical_url: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          favicon_url: string | null
          footer_text: string
          hero_badge_text: string
          hero_button_text: string
          hero_description: string
          hero_main_title: string
          hero_subtitle: string
          id: string
          json_ld_data: string | null
          logo_url: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          robots_directive: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          testimonials: string | null
          twitter_card: string | null
          updated_at: string
          user_id: string
          video_bullets: string | null
          video_enabled: boolean | null
          video_poster_url: string | null
          video_subtitle: string | null
          video_title: string | null
          video_url: string | null
        }
        Insert: {
          author?: string | null
          background_image_url?: string | null
          canonical_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          favicon_url?: string | null
          footer_text?: string
          hero_badge_text?: string
          hero_button_text?: string
          hero_description?: string
          hero_main_title?: string
          hero_subtitle?: string
          id?: string
          json_ld_data?: string | null
          logo_url?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          robots_directive?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          testimonials?: string | null
          twitter_card?: string | null
          updated_at?: string
          user_id: string
          video_bullets?: string | null
          video_enabled?: boolean | null
          video_poster_url?: string | null
          video_subtitle?: string | null
          video_title?: string | null
          video_url?: string | null
        }
        Update: {
          author?: string | null
          background_image_url?: string | null
          canonical_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          favicon_url?: string | null
          footer_text?: string
          hero_badge_text?: string
          hero_button_text?: string
          hero_description?: string
          hero_main_title?: string
          hero_subtitle?: string
          id?: string
          json_ld_data?: string | null
          logo_url?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          robots_directive?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          testimonials?: string | null
          twitter_card?: string | null
          updated_at?: string
          user_id?: string
          video_bullets?: string | null
          video_enabled?: boolean | null
          video_poster_url?: string | null
          video_subtitle?: string | null
          video_title?: string | null
          video_url?: string | null
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
          followup_1h_sent: boolean | null
          followup_24h_sent: boolean | null
          followup_48h_sent: boolean | null
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
          followup_1h_sent?: boolean | null
          followup_24h_sent?: boolean | null
          followup_48h_sent?: boolean | null
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
          followup_1h_sent?: boolean | null
          followup_24h_sent?: boolean | null
          followup_48h_sent?: boolean | null
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
          depot_client_id: string | null
          id: string
          payment_method: string | null
          payment_method_type: string | null
          payment_status: string | null
          pix_key_type: string | null
          pix_key_value: string | null
          receipt_saved: boolean | null
          receipt_saved_at: string | null
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
          depot_client_id?: string | null
          id?: string
          payment_method?: string | null
          payment_method_type?: string | null
          payment_status?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          receipt_saved?: boolean | null
          receipt_saved_at?: string | null
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
          depot_client_id?: string | null
          id?: string
          payment_method?: string | null
          payment_method_type?: string | null
          payment_status?: string | null
          pix_key_type?: string | null
          pix_key_value?: string | null
          receipt_saved?: boolean | null
          receipt_saved_at?: string | null
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
            foreignKeyName: "orders_depot_client_id_fkey"
            columns: ["depot_client_id"]
            isOneToOne: false
            referencedRelation: "depot_clients"
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
      payment_ledger: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          operation_type: string
          provider: string
          provider_event_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          operation_type: string
          provider: string
          provider_event_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          operation_type?: string
          provider?: string
          provider_event_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      pillar_pages: {
        Row: {
          benefits: Json | null
          created_at: string
          cta_primary_text: string | null
          cta_primary_url: string | null
          cta_secondary_text: string | null
          cta_secondary_url: string | null
          faq: Json | null
          features: Json | null
          headline: string
          hero_image: string | null
          how_it_works: Json | null
          id: string
          intro_text: string | null
          og_image: string | null
          sections: Json | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          subheadline: string | null
          testimonials: Json | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string
          cta_primary_text?: string | null
          cta_primary_url?: string | null
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          faq?: Json | null
          features?: Json | null
          headline: string
          hero_image?: string | null
          how_it_works?: Json | null
          id?: string
          intro_text?: string | null
          og_image?: string | null
          sections?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          subheadline?: string | null
          testimonials?: Json | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string
          cta_primary_text?: string | null
          cta_primary_url?: string | null
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          faq?: Json | null
          features?: Json | null
          headline?: string
          hero_image?: string | null
          how_it_works?: Json | null
          id?: string
          intro_text?: string | null
          og_image?: string | null
          sections?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          subheadline?: string | null
          testimonials?: Json | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          deactivated_at: string | null
          email: string | null
          first_login_completed: boolean | null
          id: string
          indicador_id: string | null
          is_active: boolean | null
          last_login_at: string | null
          name: string | null
          onboarding_completed: boolean | null
          onboarding_progress: Json | null
          phone: string | null
          ref_key: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          email?: string | null
          first_login_completed?: boolean | null
          id: string
          indicador_id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_progress?: Json | null
          phone?: string | null
          ref_key?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          email?: string | null
          first_login_completed?: boolean | null
          id?: string
          indicador_id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_progress?: Json | null
          phone?: string | null
          ref_key?: string | null
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
      rate_limit_attempts: {
        Row: {
          action: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt_at: string | null
          id: string
          identifier: string
        }
        Insert: {
          action: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier: string
        }
        Update: {
          action?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier?: string
        }
        Relationships: []
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
          numero_renovacao: number | null
          plano_ativado: string
          tipo_bonus: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_credito?: string
          dias_creditados: number
          id?: string
          indicado_id: string
          numero_renovacao?: number | null
          plano_ativado: string
          tipo_bonus?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_credito?: string
          dias_creditados?: number
          id?: string
          indicado_id?: string
          numero_renovacao?: number | null
          plano_ativado?: string
          tipo_bonus?: string | null
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
      role_default_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      security_blocks: {
        Row: {
          attempt_count: number | null
          auto_blocked: boolean | null
          block_type: Database["public"]["Enums"]["block_type"]
          blocked_until: string | null
          created_at: string | null
          created_by: string | null
          id: string
          identifier: string
          is_permanent: boolean | null
          reason: string
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          auto_blocked?: boolean | null
          block_type: Database["public"]["Enums"]["block_type"]
          blocked_until?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          identifier: string
          is_permanent?: boolean | null
          reason: string
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          auto_blocked?: boolean | null
          block_type?: Database["public"]["Enums"]["block_type"]
          blocked_until?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          identifier?: string
          is_permanent?: boolean | null
          reason?: string
          updated_at?: string | null
        }
        Relationships: []
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
          period_days: number | null
          plan_id: string
          plan_type: string
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
          period_days?: number | null
          plan_id: string
          plan_type?: string
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
          period_days?: number | null
          plan_id?: string
          plan_type?: string
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
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
      user_consents: {
        Row: {
          consent_type: string
          consent_version: string
          consented_at: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          revoked_at: string | null
          revoked_reason: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_type: string
          consent_version: string
          consented_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          revoked_reason?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          consent_version?: string
          consented_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          revoked_at?: string | null
          revoked_reason?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      user_lifecycle: {
        Row: {
          churn_reason: string | null
          created_at: string | null
          current_stage: string | null
          id: string
          last_active_at: string | null
          metadata: Json | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          stage_changed_at: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          churn_reason?: string | null
          created_at?: string | null
          current_stage?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          stage_changed_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          churn_reason?: string | null
          created_at?: string | null
          current_stage?: string | null
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          stage_changed_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          payment_method: string | null
          payment_reference: string | null
          plan_type: string
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_method?: string | null
          payment_reference?: string | null
          plan_type?: string
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_method?: string | null
          payment_reference?: string | null
          plan_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_video_progress: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          user_id: string
          video_id: string
          watched_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          user_id: string
          video_id: string
          watched_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          user_id?: string
          video_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "guide_videos"
            referencedColumns: ["id"]
          },
        ]
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
      calcular_bonus_indicacao: {
        Args: { p_is_renewal?: boolean; p_plan_type: string }
        Returns: number
      }
      check_password_breach: {
        Args: { password_hash: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_block_minutes?: number
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      cleanup_inactive_unidade_sessions: { Args: never; Returns: undefined }
      cleanup_old_presence: { Args: never; Returns: undefined }
      deactivate_unidade_session: {
        Args: { unidade_uuid: string }
        Returns: undefined
      }
      generate_ref_key: { Args: { user_name: string }; Returns: string }
      get_admin_access_level: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      get_dashboard_summary: {
        Args: {
          filter_end?: string
          filter_start?: string
          target_user_id: string
        }
        Returns: Json
      }
      get_database_statistics: { Args: never; Returns: Json }
      get_effective_user_id: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_function_count: { Args: never; Returns: Json }
      get_online_users: {
        Args: never
        Returns: {
          last_seen_at: string
          session_id: string
          user_id: string
        }[]
      }
      get_referral_stats: { Args: { p_user_id: string }; Returns: Json }
      get_storage_usage: { Args: never; Returns: Json }
      get_system_stats: { Args: never; Returns: Json }
      get_table_count: { Args: never; Returns: Json }
      get_unread_admin_messages: {
        Args: never
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_unread_direct_messages: {
        Args: never
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_unread_error_reports: {
        Args: never
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
        Args: never
        Returns: {
          created_at: string
          id: string
          message: string
          sender_name: string
          title: string
        }[]
      }
      get_unread_realtime_messages: {
        Args: never
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
        SetofOptions: {
          from: "*"
          to: "cash_registers"
          isOneToOne: false
          isSetofReturn: true
        }
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
        SetofOptions: {
          from: "*"
          to: "cash_registers"
          isOneToOne: false
          isSetofReturn: true
        }
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
        SetofOptions: {
          from: "*"
          to: "materials"
          isOneToOne: false
          isSetofReturn: true
        }
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
          depot_client_id: string | null
          id: string
          payment_method: string | null
          payment_method_type: string | null
          payment_status: string | null
          pix_key_type: string | null
          pix_key_value: string | null
          receipt_saved: boolean | null
          receipt_saved_at: string | null
          status: string | null
          total: number
          type: string
          unidade_id: string | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
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
        Args: never
        Returns: Database["public"]["Enums"]["user_status"]
      }
      get_user_roles: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      get_user_status: {
        Args: never
        Returns: Database["public"]["Enums"]["user_status"]
      }
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_view_count: {
        Args: { record_id: string; table_name: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_master: { Args: { _user_id?: string }; Returns: boolean }
      is_blocked: {
        Args: {
          p_block_type: Database["public"]["Enums"]["block_type"]
          p_identifier: string
        }
        Returns: boolean
      }
      is_employee: { Args: { target_user_id: string }; Returns: boolean }
      is_feature_enabled: {
        Args: { p_feature_name: string; p_user_id?: string }
        Returns: boolean
      }
      is_subscription_active: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_unidade_available: { Args: { unidade_uuid: string }; Returns: boolean }
      log_access: {
        Args: {
          p_action: string
          p_error_message?: string
          p_metadata?: Json
          p_success?: boolean
        }
        Returns: string
      }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_description?: string
          p_new_value?: Json
          p_old_value?: Json
          p_target_record_id?: string
          p_target_table?: string
          p_target_user_id?: string
        }
        Returns: string
      }
      regenerate_all_ref_keys: { Args: never; Returns: number }
      sanitize_input: { Args: { input_text: string }; Returns: string }
      sanitize_text_input: { Args: { input_text: string }; Returns: string }
      schedule_presence_cleanup: { Args: never; Returns: undefined }
      validate_customer_name: { Args: { name_input: string }; Returns: string }
      validate_email: { Args: { email_input: string }; Returns: string }
      validate_material_name: { Args: { name_input: string }; Returns: string }
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
      validate_user_input: { Args: { input_text: string }; Returns: string }
    }
    Enums: {
      admin_role: "admin_master" | "admin_operacional" | "suporte" | "leitura"
      app_role: "admin" | "moderator" | "user"
      block_type: "ip" | "user" | "email" | "device"
      content_status: "draft" | "published"
      system_module:
        | "caixa"
        | "despesas"
        | "compra"
        | "venda"
        | "estoque"
        | "relatorios"
        | "transacoes"
        | "assinatura"
        | "geral"
      user_lifecycle_stage:
        | "registered"
        | "activated"
        | "trial"
        | "trial_ending"
        | "paying"
        | "at_risk"
        | "churned"
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
      admin_role: ["admin_master", "admin_operacional", "suporte", "leitura"],
      app_role: ["admin", "moderator", "user"],
      block_type: ["ip", "user", "email", "device"],
      content_status: ["draft", "published"],
      system_module: [
        "caixa",
        "despesas",
        "compra",
        "venda",
        "estoque",
        "relatorios",
        "transacoes",
        "assinatura",
        "geral",
      ],
      user_lifecycle_stage: [
        "registered",
        "activated",
        "trial",
        "trial_ending",
        "paying",
        "at_risk",
        "churned",
      ],
      user_status: ["user", "admin"],
    },
  },
} as const
