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
          email: string | null
          first_name: string | null
          last_name: string | null
          organization_id: number | null
          phone_number: string | null
          user_id: string
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          organization_id?: number | null
          phone_number?: string | null
          user_id: string
        }
        Update: {
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          organization_id?: number | null
          phone_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          gateway: string | null
          payer_id: string | null
          payment_id: number
          status: string | null
          transaction_reference: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          gateway?: string | null
          payer_id?: string | null
          payment_id?: number
          status?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          gateway?: string | null
          payer_id?: string | null
          payment_id?: number
          status?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_payer_id_fkey"
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

// export type PublicSchema = Database[Extract<keyof Database, "public">]
