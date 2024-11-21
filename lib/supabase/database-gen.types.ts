export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      "bank-statements": {
        Row: {
          file_id: number
          file_path: string
          file_type: string
          organization_id: number
          processed: boolean
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_id?: number
          file_path: string
          file_type: string
          organization_id: number
          processed?: boolean
          uploaded_at?: string
          uploaded_by?: string
        }
        Update: {
          file_id?: number
          file_path?: string
          file_type?: string
          organization_id?: number
          processed?: boolean
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank-statements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      notes: {
        Row: {
          id: number
          title: string | null
        }
        Insert: {
          id?: number
          title?: string | null
        }
        Update: {
          id?: number
          title?: string | null
        }
        Relationships: []
      }
      organization_admins: {
        Row: {
          organization_id: number
          profile_id: string
        }
        Insert: {
          organization_id: number
          profile_id: string
        }
        Update: {
          organization_id?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_admins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organizations: {
        Row: {
          admins: string[] | null
          created_at: string | null
          created_by: string | null
          name: string
          organization_id: number
          type: string | null
          updated_at: string | null
        }
        Insert: {
          admins?: string[] | null
          created_at?: string | null
          created_by?: string | null
          name: string
          organization_id?: number
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          admins?: string[] | null
          created_at?: string | null
          created_by?: string | null
          name?: string
          organization_id?: number
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payers: {
        Row: {
          email: string
          first_name: string
          last_name: string | null
          phone_number: string
          user_id: string
        }
        Insert: {
          email: string
          first_name: string
          last_name?: string | null
          phone_number: string
          user_id?: string
        }
        Update: {
          email?: string
          first_name?: string
          last_name?: string | null
          phone_number?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          bank_statement_id: number
          created_at: string | null
          date: string
          organization_id: number | null
          payer_id: string | null
          payment_id: number
          transaction_reference: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_statement_id: number
          created_at?: string | null
          date: string
          organization_id?: number | null
          payer_id?: string | null
          payment_id?: number
          transaction_reference: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_statement_id?: number
          created_at?: string | null
          date?: string
          organization_id?: number | null
          payer_id?: string | null
          payment_id?: number
          transaction_reference?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_bank_statement_id_fkey"
            columns: ["bank_statement_id"]
            isOneToOne: false
            referencedRelation: "bank-statements"
            referencedColumns: ["file_id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payers"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
        }
        Insert: {
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
        }
        Update: {
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      references: {
        Row: {
          created_at: string | null
          organization_id: number
          payer_id: string
          reference_details: string | null
          reference_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          organization_id: number
          payer_id: string
          reference_details?: string | null
          reference_id?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          organization_id?: number
          payer_id?: string
          reference_details?: string | null
          reference_id?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "references_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "references_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payers"
            referencedColumns: ["user_id"]
          },
        ]
      }
      unallocated_payments: {
        Row: {
          amount: number
          bank_statement_id: number
          created_at: string
          date: string
          is_allocated: boolean
          organization_id: number
          transaction_reference: string
          unallocated_payment_id: number
        }
        Insert: {
          amount: number
          bank_statement_id: number
          created_at?: string
          date: string
          is_allocated?: boolean
          organization_id: number
          transaction_reference: string
          unallocated_payment_id?: number
        }
        Update: {
          amount?: number
          bank_statement_id?: number
          created_at?: string
          date?: string
          is_allocated?: boolean
          organization_id?: number
          transaction_reference?: string
          unallocated_payment_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "unallocated_payments_bank_statement_id_fkey"
            columns: ["bank_statement_id"]
            isOneToOne: false
            referencedRelation: "bank-statements"
            referencedColumns: ["file_id"]
          },
          {
            foreignKeyName: "unallocated_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
    }
    Views: {
      auth_users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string | null
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean | null
          is_sso_user: boolean | null
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string | null
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean | null
          is_sso_user?: boolean | null
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string | null
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean | null
          is_sso_user?: boolean | null
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
