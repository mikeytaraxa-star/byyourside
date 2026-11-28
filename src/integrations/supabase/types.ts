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
      care_access_codes: {
        Row: {
          code_hash: string
          expires_at: string
          member_id: string
          used_at: string | null
        }
        Insert: {
          code_hash: string
          expires_at: string
          member_id: string
          used_at?: string | null
        }
        Update: {
          code_hash?: string
          expires_at?: string
          member_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_access_codes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "care_members"
            referencedColumns: ["id"]
          },
        ]
      }
      care_circles: {
        Row: {
          created_at: string
          display_name: string
          findme_requested_at: string | null
          id: string
          preferences: Json
          summary_sent_on: string | null
          summary_time: string
          telegram_chat_id: number
          timezone: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          findme_requested_at?: string | null
          id?: string
          preferences?: Json
          summary_sent_on?: string | null
          summary_time?: string
          telegram_chat_id: number
          timezone?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          findme_requested_at?: string | null
          id?: string
          preferences?: Json
          summary_sent_on?: string | null
          summary_time?: string
          telegram_chat_id?: number
          timezone?: string
        }
        Relationships: []
      }
      care_events: {
        Row: {
          acknowledged_by: string | null
          actor_name: string
          circle_id: string
          created_at: string
          delivery: string
          escalated_at: string | null
          id: string
          idempotency_key: string
          kind: string
          label: string
          reminder_id: string | null
        }
        Insert: {
          acknowledged_by?: string | null
          actor_name?: string
          circle_id: string
          created_at?: string
          delivery?: string
          escalated_at?: string | null
          id?: string
          idempotency_key: string
          kind: string
          label: string
          reminder_id?: string | null
        }
        Update: {
          acknowledged_by?: string | null
          actor_name?: string
          circle_id?: string
          created_at?: string
          delivery?: string
          escalated_at?: string | null
          id?: string
          idempotency_key?: string
          kind?: string
          label?: string
          reminder_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_events_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "care_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_events_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_events_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      care_history: {
        Row: {
          after_version: string
          before_value: Json | null
          circle_id: string
          created_at: string
          entity: string
          entity_id: string
          id: string
          label: string
          undone_at: string | null
        }
        Insert: {
          after_version: string
          before_value?: Json | null
          circle_id: string
          created_at?: string
          entity: string
          entity_id: string
          id?: string
          label: string
          undone_at?: string | null
        }
        Update: {
          after_version?: string
          before_value?: Json | null
          circle_id?: string
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          label?: string
          undone_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_history_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_invitations: {
        Row: {
          circle_id: string
          code_hash: string
          created_by: string
          expires_at: string
          role: string
          used_at: string | null
        }
        Insert: {
          circle_id: string
          code_hash: string
          created_by: string
          expires_at: string
          role: string
          used_at?: string | null
        }
        Update: {
          circle_id?: string
          code_hash?: string
          created_by?: string
          expires_at?: string
          role?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_invitations_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "care_members"
            referencedColumns: ["id"]
          },
        ]
      }
      care_members: {
        Row: {
          circle_id: string
          created_at: string
          direct_chat_id: number | null
          id: string
          member_name: string
          notify_order: number
          revoked_at: string | null
          role: string
          telegram_user_id: number
        }
        Insert: {
          circle_id: string
          created_at?: string
          direct_chat_id?: number | null
          id?: string
          member_name?: string
          notify_order?: number
          revoked_at?: string | null
          role?: string
          telegram_user_id: number
        }
        Update: {
          circle_id?: string
          created_at?: string
          direct_chat_id?: number | null
          id?: string
          member_name?: string
          notify_order?: number
          revoked_at?: string | null
          role?: string
          telegram_user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "care_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_notes: {
        Row: {
          answer: string
          category: string
          circle_id: string
          id: string
          label: string
          media_kind: string | null
          media_path: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          circle_id: string
          id?: string
          label: string
          media_kind?: string | null
          media_path?: string | null
          phone?: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          circle_id?: string
          id?: string
          label?: string
          media_kind?: string | null
          media_path?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_notes_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_occurrences: {
        Row: {
          circle_id: string
          local_date: string
          postponed_minute: number | null
          reminder_id: string
          state: string
          step: number
          updated_at: string
          version: number
        }
        Insert: {
          circle_id: string
          local_date: string
          postponed_minute?: number | null
          reminder_id: string
          state?: string
          step?: number
          updated_at?: string
          version?: number
        }
        Update: {
          circle_id?: string
          local_date?: string
          postponed_minute?: number | null
          reminder_id?: string
          state?: string
          step?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "care_occurrences_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_occurrences_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      care_routines: {
        Row: {
          circle_id: string
          date_override: string | null
          enabled: boolean
          id: string
          local_time: string
          progress: Json
          steps: Json
          title: string
          updated_at: string
        }
        Insert: {
          circle_id: string
          date_override?: string | null
          enabled?: boolean
          id?: string
          local_time: string
          progress?: Json
          steps?: Json
          title: string
          updated_at?: string
        }
        Update: {
          circle_id?: string
          date_override?: string | null
          enabled?: boolean
          id?: string
          local_time?: string
          progress?: Json
          steps?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_routines_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_sessions: {
        Row: {
          created_at: string
          expires_at: string
          member_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          member_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          member_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "care_members"
            referencedColumns: ["id"]
          },
        ]
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
          critical: boolean
          date_override: string | null
          deleted_at: string | null
          detail: string | null
          id: string
          last_missed_on: string | null
          local_time: string
          missed_streak: number
          nudged_on: string | null
          snooze_minutes: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          alerted_on?: string | null
          circle_id: string
          confirmed_at?: string | null
          confirmed_on?: string | null
          created_at?: string
          critical?: boolean
          date_override?: string | null
          deleted_at?: string | null
          detail?: string | null
          id?: string
          last_missed_on?: string | null
          local_time: string
          missed_streak?: number
          nudged_on?: string | null
          snooze_minutes?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          alerted_on?: string | null
          circle_id?: string
          confirmed_at?: string | null
          confirmed_on?: string | null
          created_at?: string
          critical?: boolean
          date_override?: string | null
          deleted_at?: string | null
          detail?: string | null
          id?: string
          last_missed_on?: string | null
          local_time?: string
          missed_streak?: number
          nudged_on?: string | null
          snooze_minutes?: number
          status?: string
          title?: string
          updated_at?: string
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
      care_apply_action: {
        Args: {
          p_action: string
          p_actor: string
          p_circle: string
          p_date: string
          p_key: string
          p_minute: number
          p_minutes?: number
          p_reminder: string
        }
        Returns: Json
      }
      care_claim_access: {
        Args: { p_hash: string; p_token_hash: string }
        Returns: string
      }
      care_claim_invitation: {
        Args: { p_chat: number; p_hash: string; p_name: string; p_user: number }
        Returns: string
      }
      care_routine_step: {
        Args: {
          p_circle: string
          p_date: string
          p_key: string
          p_routine: string
          p_step: number
        }
        Returns: number
      }
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
