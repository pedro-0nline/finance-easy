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
      bank_accounts: {
        Row: {
          balance: number
          color: string
          created_at: string
          id: string
          institution: string
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          color?: string
          created_at?: string
          id?: string
          institution?: string
          name: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          color?: string
          created_at?: string
          id?: string
          institution?: string
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          budget_limit: number
          category: Database["public"]["Enums"]["category"]
          created_at: string
          id: string
          month: string
          spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_limit?: number
          category: Database["public"]["Enums"]["category"]
          created_at?: string
          id?: string
          month: string
          spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_limit?: number
          category?: Database["public"]["Enums"]["category"]
          created_at?: string
          id?: string
          month?: string
          spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          closing_day: number
          color: string
          created_at: string
          credit_limit: number
          due_day: number
          id: string
          institution: string
          name: string
          updated_at: string
          used: number
          user_id: string
        }
        Insert: {
          closing_day?: number
          color?: string
          created_at?: string
          credit_limit?: number
          due_day?: number
          id?: string
          institution?: string
          name: string
          updated_at?: string
          used?: number
          user_id: string
        }
        Update: {
          closing_day?: number
          color?: string
          created_at?: string
          credit_limit?: number
          due_day?: number
          id?: string
          institution?: string
          name?: string
          updated_at?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      custom_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          label: string
          slug: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          label: string
          slug: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          label?: string
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          color: string
          created_at: string
          current_amount: number
          deadline: string
          id: string
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          current_amount?: number
          deadline: string
          id?: string
          target_amount?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          current_amount?: number
          deadline?: string
          id?: string
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          group_id: string
          id: string
          name: string
          role: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          group_id: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          action_taken: boolean
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["insight_priority"]
          title: string
          type: Database["public"]["Enums"]["insight_type"]
          user_id: string
        }
        Insert: {
          action_taken?: boolean
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["insight_priority"]
          title: string
          type?: Database["public"]["Enums"]["insight_type"]
          user_id: string
        }
        Update: {
          action_taken?: boolean
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["insight_priority"]
          title?: string
          type?: Database["public"]["Enums"]["insight_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          email: string | null
          first_day_of_week: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          first_day_of_week?: number
          id: string
          name?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          first_day_of_week?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["category"]
          created_at: string
          date: string
          description: string
          id: string
          installment_group_id: string | null
          installment_number: number | null
          is_installment: boolean
          is_paid: boolean
          is_shared: boolean
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          shared_with: Json | null
          total_installments: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["category"]
          created_at?: string
          date?: string
          description?: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_installment?: boolean
          is_paid?: boolean
          is_shared?: boolean
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shared_with?: Json | null
          total_installments?: number | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["category"]
          created_at?: string
          date?: string
          description?: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_installment?: boolean
          is_paid?: boolean
          is_shared?: boolean
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shared_with?: Json | null
          total_installments?: number | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      join_group_by_code: { Args: { _invite_code: string }; Returns: string }
    }
    Enums: {
      account_type: "checking" | "savings" | "investment"
      category:
        | "food"
        | "health"
        | "transport"
        | "education"
        | "leisure"
        | "housing"
        | "utilities"
        | "other"
      group_role: "owner" | "manager" | "editor" | "viewer"
      insight_priority: "high" | "medium" | "low"
      insight_type: "analysis" | "recommendation" | "alert" | "opportunity"
      payment_method:
        | "cash"
        | "credit_card"
        | "debit_card"
        | "pix"
        | "transfer"
        | "boleto"
      transaction_type: "income" | "expense" | "recurring" | "fixed"
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
      account_type: ["checking", "savings", "investment"],
      category: [
        "food",
        "health",
        "transport",
        "education",
        "leisure",
        "housing",
        "utilities",
        "other",
      ],
      group_role: ["owner", "manager", "editor", "viewer"],
      insight_priority: ["high", "medium", "low"],
      insight_type: ["analysis", "recommendation", "alert", "opportunity"],
      payment_method: [
        "cash",
        "credit_card",
        "debit_card",
        "pix",
        "transfer",
        "boleto",
      ],
      transaction_type: ["income", "expense", "recurring", "fixed"],
    },
  },
} as const
