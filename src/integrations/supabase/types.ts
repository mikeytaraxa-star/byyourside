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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      care_circles: {
        Row: {
          created_at: string
          display_name: string
          findme_requested_at: string | null
          id: string
          telegram_chat_id: number
          timezone: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          findme_requested_at?: string | null
          id?: string
          telegram_chat_id: number
          timezone?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          findme_requested_at?: string | null
          id?: string
          telegram_chat_id?: number
          timezone?: string
        }
        Relationships: []
      }
      g2_devices: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          last_accuracy: number | null
          last_lat: number | null
          last_lng: number | null
          last_location_at: string | null
          last_seen_at: string | null
          token_hash: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          last_accuracy?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_location_at?: string | null
          last_seen_at?: string | null
          token_hash: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          last_accuracy?: number | null
          last_lat?: number | null
          last_lng?: number | null
          last_location_at?: string | null
          last_seen_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "g2_devices_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      pairing_codes: {
        Row: {
          circle_id: string
          code: string
          created_at: string
          expires_at: string
          used_at: string | null
        }
        Insert: {
          circle_id: string
          code: string
          created_at?: string
          expires_at: string
          used_at?: string | null
        }
        Update: {
          circle_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pairing_codes_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          name: string
          note: string
          relation: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          name: string
          note?: string
          relation: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          name?: string
          note?: string
          relation?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          alerted_on: string | null
          circle_id: string
          confirmed_at: string | null
          confirmed_on: string | null
          created_at: string
          detail: string | null
          id: string
          local_time: string
          nudged_on: string | null
          status: string
          title: string
        }
        Insert: {
          alerted_on?: string | null
          circle_id: string
          confirmed_at?: string | null
          confirmed_on?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          local_time: string
          nudged_on?: string | null
          status?: string
          title: string
        }
        Update: {
          alerted_on?: string | null
          circle_id?: string
          confirmed_at?: string | null
          confirmed_on?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          local_time?: string
          nudged_on?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_updates: {
        Row: {
          chat_id: number
          created_at: string
          raw_update: Json
          telegram_user_id: number | null
          text: string | null
          update_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          raw_update: Json
          telegram_user_id?: number | null
          text?: string | null
          update_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          raw_update?: Json
          telegram_user_id?: number | null
          text?: string | null
          update_id?: number
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
