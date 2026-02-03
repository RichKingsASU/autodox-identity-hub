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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          company_name: string
          created_at: string
          ein: string
          id: string
          last_notified_at: string | null
          monthly_volume: string
          privacy_url: string
          status: Database["public"]["Enums"]["application_status"]
          tos_url: string
          updated_at: string
          use_case: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          ein: string
          id?: string
          last_notified_at?: string | null
          monthly_volume: string
          privacy_url: string
          status?: Database["public"]["Enums"]["application_status"]
          tos_url: string
          updated_at?: string
          use_case: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          ein?: string
          id?: string
          last_notified_at?: string | null
          monthly_volume?: string
          privacy_url?: string
          status?: Database["public"]["Enums"]["application_status"]
          tos_url?: string
          updated_at?: string
          use_case?: string
          user_id?: string
        }
        Relationships: []
      }
      brand_email_settings: {
        Row: {
          brand_id: string
          created_at: string
          custom_api_key: string | null
          from_email: string
          from_name: string
          id: string
          reply_to_email: string | null
          sending_domain: string | null
          sending_domain_status: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          custom_api_key?: string | null
          from_email?: string
          from_name?: string
          id?: string
          reply_to_email?: string | null
          sending_domain?: string | null
          sending_domain_status?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          custom_api_key?: string | null
          from_email?: string
          from_name?: string
          id?: string
          reply_to_email?: string | null
          sending_domain?: string | null
          sending_domain_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_email_settings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          active_template_id: string | null
          applied_template_version: number | null
          cloudflare_hostname_id: string | null
          created_at: string
          current_month_usage: number | null
          domain: string | null
          domain_error: string | null
          domain_status: Database["public"]["Enums"]["domain_status"] | null
          domain_verification_token: string | null
          domain_verified_at: string | null
          id: string
          last_notified_at: string | null
          monthly_sms_limit: number | null
          name: string
          owner_user_id: string | null
          previous_template_id: string | null
          previous_template_version: number | null
          settings: Json | null
          slug: string
          ssl_status: string | null
          status: Database["public"]["Enums"]["brand_status"]
          template_applied_at: string | null
          template_applied_by: string | null
          updated_at: string
        }
        Insert: {
          active_template_id?: string | null
          applied_template_version?: number | null
          cloudflare_hostname_id?: string | null
          created_at?: string
          current_month_usage?: number | null
          domain?: string | null
          domain_error?: string | null
          domain_status?: Database["public"]["Enums"]["domain_status"] | null
          domain_verification_token?: string | null
          domain_verified_at?: string | null
          id?: string
          last_notified_at?: string | null
          monthly_sms_limit?: number | null
          name: string
          owner_user_id?: string | null
          previous_template_id?: string | null
          previous_template_version?: number | null
          settings?: Json | null
          slug: string
          ssl_status?: string | null
          status?: Database["public"]["Enums"]["brand_status"]
          template_applied_at?: string | null
          template_applied_by?: string | null
          updated_at?: string
        }
        Update: {
          active_template_id?: string | null
          applied_template_version?: number | null
          cloudflare_hostname_id?: string | null
          created_at?: string
          current_month_usage?: number | null
          domain?: string | null
          domain_error?: string | null
          domain_status?: Database["public"]["Enums"]["domain_status"] | null
          domain_verification_token?: string | null
          domain_verified_at?: string | null
          id?: string
          last_notified_at?: string | null
          monthly_sms_limit?: number | null
          name?: string
          owner_user_id?: string | null
          previous_template_id?: string | null
          previous_template_version?: number | null
          settings?: Json | null
          slug?: string
          ssl_status?: string | null
          status?: Database["public"]["Enums"]["brand_status"]
          template_applied_at?: string | null
          template_applied_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_active_template_id_fkey"
            columns: ["active_template_id"]
            isOneToOne: false
            referencedRelation: "landing_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_previous_template_id_fkey"
            columns: ["previous_template_id"]
            isOneToOne: false
            referencedRelation: "landing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          last_notified_at: string | null
          message: string
          name: string
          responded_at: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          last_notified_at?: string | null
          message: string
          name: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          last_notified_at?: string | null
          message?: string
          name?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      debug_logs: {
        Row: {
          brand_id: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          error_type: string
          function_name: string
          id: string
          request_payload: Json | null
          response_status: number | null
          user_id: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          error_type?: string
          function_name: string
          id?: string
          request_payload?: Json | null
          response_status?: number | null
          user_id?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          function_name?: string
          id?: string
          request_payload?: Json | null
          response_status?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debug_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          brand_id: string | null
          created_at: string
          error_message: string | null
          from_email: string
          id: string
          resend_id: string | null
          status: string
          subject: string
          template_key: string | null
          to_email: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          error_message?: string | null
          from_email: string
          id?: string
          resend_id?: string | null
          status?: string
          subject: string
          template_key?: string | null
          to_email: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          error_message?: string | null
          from_email?: string
          id?: string
          resend_id?: string | null
          status?: string
          subject?: string
          template_key?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_templates: {
        Row: {
          base_layout: Database["public"]["Enums"]["landing_base_layout"]
          category: string | null
          created_at: string | null
          default_copy: Json
          default_theme_overrides: Json
          editable_fields: Json
          id: string
          name: string
          sections_enabled: Json
          slug: string
          status: Database["public"]["Enums"]["template_status"]
          updated_at: string | null
          version: number
        }
        Insert: {
          base_layout: Database["public"]["Enums"]["landing_base_layout"]
          category?: string | null
          created_at?: string | null
          default_copy: Json
          default_theme_overrides: Json
          editable_fields: Json
          id?: string
          name: string
          sections_enabled: Json
          slug: string
          status?: Database["public"]["Enums"]["template_status"]
          updated_at?: string | null
          version?: number
        }
        Update: {
          base_layout?: Database["public"]["Enums"]["landing_base_layout"]
          category?: string | null
          created_at?: string | null
          default_copy?: Json
          default_theme_overrides?: Json
          editable_fields?: Json
          id?: string
          name?: string
          sections_enabled?: Json
          slug?: string
          status?: Database["public"]["Enums"]["template_status"]
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      portal_configs: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_name?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          sms_volume: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          sms_volume?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          sms_volume?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      template_activity_log: {
        Row: {
          action: string
          brand_id: string | null
          changes: Json | null
          id: string
          performed_at: string | null
          performed_by: string
          template_id: string | null
          template_slug: string
        }
        Insert: {
          action: string
          brand_id?: string | null
          changes?: Json | null
          id?: string
          performed_at?: string | null
          performed_by: string
          template_id?: string | null
          template_slug: string
        }
        Update: {
          action?: string
          brand_id?: string | null
          changes?: Json | null
          id?: string
          performed_at?: string | null
          performed_by?: string
          template_id?: string | null
          template_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_activity_log_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_activity_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "landing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "super_admin" | "user"
      application_status: "pending" | "approved" | "rejected"
      brand_status: "provisioning" | "active" | "suspended" | "archived"
      domain_status:
        | "pending"
        | "verifying"
        | "verified"
        | "provisioning_ssl"
        | "active"
        | "failed"
      landing_base_layout:
        | "hero_focused"
        | "compliance_heavy"
        | "trust_signal_dense"
        | "minimal_enterprise"
        | "sdk_focused"
        | "global_reach"
        | "security_first"
        | "conversion_optimized"
      template_status: "draft" | "published" | "disabled"
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
      app_role: ["admin", "super_admin", "user"],
      application_status: ["pending", "approved", "rejected"],
      brand_status: ["provisioning", "active", "suspended", "archived"],
      domain_status: [
        "pending",
        "verifying",
        "verified",
        "provisioning_ssl",
        "active",
        "failed",
      ],
      landing_base_layout: [
        "hero_focused",
        "compliance_heavy",
        "trust_signal_dense",
        "minimal_enterprise",
        "sdk_focused",
        "global_reach",
        "security_first",
        "conversion_optimized",
      ],
      template_status: ["draft", "published", "disabled"],
    },
  },
} as const
