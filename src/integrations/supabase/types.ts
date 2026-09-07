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
      admin_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_name: string | null
          file_path: string
          id: string
          kind: string
          label: string | null
          restored_from: string | null
          rows_count: number
          size_bytes: number
          tables_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          file_path: string
          id?: string
          kind?: string
          label?: string | null
          restored_from?: string | null
          rows_count?: number
          size_bytes?: number
          tables_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          file_path?: string
          id?: string
          kind?: string
          label?: string | null
          restored_from?: string | null
          rows_count?: number
          size_bytes?: number
          tables_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "backups_restored_from_fkey"
            columns: ["restored_from"]
            isOneToOne: false
            referencedRelation: "backups"
            referencedColumns: ["id"]
          },
        ]
      }
      client_service_references: {
        Row: {
          contract_id: string
          created_at: string
          erp_reference: string | null
          id: string
          option_service_id: string | null
          requires_intervention: boolean
          service_label: string
          tickets_initial: number | null
          tickets_remaining: number | null
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          erp_reference?: string | null
          id?: string
          option_service_id?: string | null
          requires_intervention?: boolean
          service_label: string
          tickets_initial?: number | null
          tickets_remaining?: number | null
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          erp_reference?: string | null
          id?: string
          option_service_id?: string | null
          requires_intervention?: boolean
          service_label?: string
          tickets_initial?: number | null
          tickets_remaining?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_service_references_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_service_references_option_service_id_fkey"
            columns: ["option_service_id"]
            isOneToOne: false
            referencedRelation: "options_services"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount_ht: number | null
          attachment_name: string | null
          attachment_url: string | null
          cession_percent: number | null
          client_name: string
          closed_at: string | null
          commercial_id: string
          commercial_name: string | null
          contract_number: string | null
          created_at: string
          duration_months: number | null
          erp_reference: string | null
          external_providers: Json
          financial_partner: string | null
          id: string
          implementation_month: string | null
          is_quick_contract: boolean
          monthly_rent_ht: number | null
          payment_frequency: string | null
          proposal_id: string | null
          proposal_type: string
          quarterly_rent_ht: number | null
          template_name: string | null
          updated_at: string
          validated_at: string
        }
        Insert: {
          amount_ht?: number | null
          attachment_name?: string | null
          attachment_url?: string | null
          cession_percent?: number | null
          client_name: string
          closed_at?: string | null
          commercial_id: string
          commercial_name?: string | null
          contract_number?: string | null
          created_at?: string
          duration_months?: number | null
          erp_reference?: string | null
          external_providers?: Json
          financial_partner?: string | null
          id?: string
          implementation_month?: string | null
          is_quick_contract?: boolean
          monthly_rent_ht?: number | null
          payment_frequency?: string | null
          proposal_id?: string | null
          proposal_type?: string
          quarterly_rent_ht?: number | null
          template_name?: string | null
          updated_at?: string
          validated_at?: string
        }
        Update: {
          amount_ht?: number | null
          attachment_name?: string | null
          attachment_url?: string | null
          cession_percent?: number | null
          client_name?: string
          closed_at?: string | null
          commercial_id?: string
          commercial_name?: string | null
          contract_number?: string | null
          created_at?: string
          duration_months?: number | null
          erp_reference?: string | null
          external_providers?: Json
          financial_partner?: string | null
          id?: string
          implementation_month?: string | null
          is_quick_contract?: boolean
          monthly_rent_ht?: number | null
          payment_frequency?: string | null
          proposal_id?: string | null
          proposal_type?: string
          quarterly_rent_ht?: number | null
          template_name?: string | null
          updated_at?: string
          validated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposal_exports"
            referencedColumns: ["id"]
          },
        ]
      }
      edi_import_lines: {
        Row: {
          date_reappro: string | null
          ean: string
          fournisseur_id: number | null
          id: string
          imported_at: string | null
          prix_achat: number | null
          ref_fseur: string | null
          source_file: string | null
          stock: number | null
        }
        Insert: {
          date_reappro?: string | null
          ean: string
          fournisseur_id?: number | null
          id?: string
          imported_at?: string | null
          prix_achat?: number | null
          ref_fseur?: string | null
          source_file?: string | null
          stock?: number | null
        }
        Update: {
          date_reappro?: string | null
          ean?: string
          fournisseur_id?: number | null
          id?: string
          imported_at?: string | null
          prix_achat?: number | null
          ref_fseur?: string | null
          source_file?: string | null
          stock?: number | null
        }
        Relationships: []
      }
      gantt_dependencies: {
        Row: {
          dependency_type: Database["public"]["Enums"]["gantt_dependency_type"]
          id: string
          source_task_id: string
          target_task_id: string
        }
        Insert: {
          dependency_type?: Database["public"]["Enums"]["gantt_dependency_type"]
          id?: string
          source_task_id: string
          target_task_id: string
        }
        Update: {
          dependency_type?: Database["public"]["Enums"]["gantt_dependency_type"]
          id?: string
          source_task_id?: string
          target_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gantt_dependencies_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "gantt_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_dependencies_target_task_id_fkey"
            columns: ["target_task_id"]
            isOneToOne: false
            referencedRelation: "gantt_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_milestones: {
        Row: {
          created_at: string
          date: string
          description: string | null
          global_sort_order: number
          id: string
          sort_order: number
          status: Database["public"]["Enums"]["gantt_status"]
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          global_sort_order?: number
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["gantt_status"]
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          global_sort_order?: number
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["gantt_status"]
          title?: string
        }
        Relationships: []
      }
      gantt_projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          global_sort_order: number
          id: string
          milestone_id: string | null
          owner: string | null
          sort_order: number
          start_date: string
          status: Database["public"]["Enums"]["gantt_status"]
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          global_sort_order?: number
          id?: string
          milestone_id?: string | null
          owner?: string | null
          sort_order?: number
          start_date: string
          status?: Database["public"]["Enums"]["gantt_status"]
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          global_sort_order?: number
          id?: string
          milestone_id?: string | null
          owner?: string | null
          sort_order?: number
          start_date?: string
          status?: Database["public"]["Enums"]["gantt_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gantt_projects_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "gantt_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_subtasks: {
        Row: {
          end_date: string
          global_sort_order: number
          id: string
          sort_order: number
          start_date: string
          status: Database["public"]["Enums"]["gantt_status"]
          task_id: string
          title: string
        }
        Insert: {
          end_date: string
          global_sort_order?: number
          id?: string
          sort_order?: number
          start_date: string
          status?: Database["public"]["Enums"]["gantt_status"]
          task_id: string
          title: string
        }
        Update: {
          end_date?: string
          global_sort_order?: number
          id?: string
          sort_order?: number
          start_date?: string
          status?: Database["public"]["Enums"]["gantt_status"]
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gantt_subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "gantt_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_tasks: {
        Row: {
          description: string | null
          end_date: string
          global_sort_order: number
          id: string
          owner: string | null
          priority: Database["public"]["Enums"]["gantt_priority"]
          project_id: string
          sort_order: number
          start_date: string
          status: Database["public"]["Enums"]["gantt_status"]
          title: string
        }
        Insert: {
          description?: string | null
          end_date: string
          global_sort_order?: number
          id?: string
          owner?: string | null
          priority?: Database["public"]["Enums"]["gantt_priority"]
          project_id: string
          sort_order?: number
          start_date: string
          status?: Database["public"]["Enums"]["gantt_status"]
          title: string
        }
        Update: {
          description?: string | null
          end_date?: string
          global_sort_order?: number
          id?: string
          owner?: string | null
          priority?: Database["public"]["Enums"]["gantt_priority"]
          project_id?: string
          sort_order?: number
          start_date?: string
          status?: Database["public"]["Enums"]["gantt_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gantt_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gantt_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_planning: {
        Row: {
          client_name: string | null
          commentaire: string | null
          created_at: string
          created_by: string | null
          date_intervention: string
          duree_estimee_minutes: number | null
          id: string
          reference_id: string | null
          service_label: string | null
          statut: Database["public"]["Enums"]["intervention_status"]
          technician_name: string
          technician_user_id: string | null
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          date_intervention: string
          duree_estimee_minutes?: number | null
          id?: string
          reference_id?: string | null
          service_label?: string | null
          statut?: Database["public"]["Enums"]["intervention_status"]
          technician_name: string
          technician_user_id?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          date_intervention?: string
          duree_estimee_minutes?: number | null
          id?: string
          reference_id?: string | null
          service_label?: string | null
          statut?: Database["public"]["Enums"]["intervention_status"]
          technician_name?: string
          technician_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_planning_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "client_service_references"
            referencedColumns: ["id"]
          },
        ]
      }
      options_services: {
        Row: {
          created_at: string
          erp_reference: string | null
          id: string
          is_active: boolean
          kind: string
          pack_service_ids: string[]
          price: Json | null
          requires_intervention: boolean
          services: Json
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          erp_reference?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          pack_service_ids?: string[]
          price?: Json | null
          requires_intervention?: boolean
          services?: Json
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          erp_reference?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          pack_service_ids?: string[]
          price?: Json | null
          requires_intervention?: boolean
          services?: Json
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdf_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          target_view: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          target_view?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          target_view?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pre_registered_commercials: {
        Row: {
          adresse: string | null
          commercial_id: string
          created_at: string
          email: string
          entity: string | null
          full_name: string
          telephone: string | null
        }
        Insert: {
          adresse?: string | null
          commercial_id: string
          created_at?: string
          email: string
          entity?: string | null
          full_name: string
          telephone?: string | null
        }
        Update: {
          adresse?: string | null
          commercial_id?: string
          created_at?: string
          email?: string
          entity?: string | null
          full_name?: string
          telephone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposal_exports: {
        Row: {
          client_name: string | null
          commercial_id: string | null
          commercial_name: string | null
          created_at: string
          created_by: string | null
          file_name: string
          id: string
          loyer_mensuel_ht: number | null
          montant_investissement: number | null
          options_count: number | null
          pdf_html_content: string | null
          proposal_name: string
          proposal_state: Json | null
          proposal_type: string
          row_count: number | null
          selected_nos_options_names: Json | null
          selected_options_names: Json | null
          service_proposal_id: string | null
          status: string
          template_id: string | null
          template_name: string
        }
        Insert: {
          client_name?: string | null
          commercial_id?: string | null
          commercial_name?: string | null
          created_at?: string
          created_by?: string | null
          file_name: string
          id?: string
          loyer_mensuel_ht?: number | null
          montant_investissement?: number | null
          options_count?: number | null
          pdf_html_content?: string | null
          proposal_name: string
          proposal_state?: Json | null
          proposal_type?: string
          row_count?: number | null
          selected_nos_options_names?: Json | null
          selected_options_names?: Json | null
          service_proposal_id?: string | null
          status?: string
          template_id?: string | null
          template_name: string
        }
        Update: {
          client_name?: string | null
          commercial_id?: string | null
          commercial_name?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string
          id?: string
          loyer_mensuel_ht?: number | null
          montant_investissement?: number | null
          options_count?: number | null
          pdf_html_content?: string | null
          proposal_name?: string
          proposal_state?: Json | null
          proposal_type?: string
          row_count?: number | null
          selected_nos_options_names?: Json | null
          selected_options_names?: Json | null
          service_proposal_id?: string | null
          status?: string
          template_id?: string | null
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_exports_service_proposal_id_fkey"
            columns: ["service_proposal_id"]
            isOneToOne: false
            referencedRelation: "service_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_exports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pdf_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      remote_support_clients: {
        Row: {
          attribution: string | null
          bu: string | null
          client_number: string | null
          commercial_name: string | null
          created_at: string
          end_date: string | null
          entity: string
          forfait: string | null
          id: string
          invoice_number: string | null
          is_paid: boolean
          machines_count: number | null
          order_number: string | null
          products_sn: string | null
          start_date: string | null
          tickets_initial: number | null
          tickets_label: string | null
          tickets_remaining: number | null
          updated_at: string
        }
        Insert: {
          attribution?: string | null
          bu?: string | null
          client_number?: string | null
          commercial_name?: string | null
          created_at?: string
          end_date?: string | null
          entity: string
          forfait?: string | null
          id?: string
          invoice_number?: string | null
          is_paid?: boolean
          machines_count?: number | null
          order_number?: string | null
          products_sn?: string | null
          start_date?: string | null
          tickets_initial?: number | null
          tickets_label?: string | null
          tickets_remaining?: number | null
          updated_at?: string
        }
        Update: {
          attribution?: string | null
          bu?: string | null
          client_number?: string | null
          commercial_name?: string | null
          created_at?: string
          end_date?: string | null
          entity?: string
          forfait?: string | null
          id?: string
          invoice_number?: string | null
          is_paid?: boolean
          machines_count?: number | null
          order_number?: string | null
          products_sn?: string | null
          start_date?: string | null
          tickets_initial?: number | null
          tickets_label?: string | null
          tickets_remaining?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      remote_support_ticket_log: {
        Row: {
          client_id: string
          id: string
          note: string | null
          used_at: string
          used_by: string | null
          used_by_name: string | null
        }
        Insert: {
          client_id: string
          id?: string
          note?: string | null
          used_at?: string
          used_by?: string | null
          used_by_name?: string | null
        }
        Update: {
          client_id?: string
          id?: string
          note?: string | null
          used_at?: string
          used_by?: string | null
          used_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remote_support_ticket_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "remote_support_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      service_proposals: {
        Row: {
          client_address: string | null
          client_capital_social: string | null
          client_company: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_siret: string | null
          commercial_id: string
          commercial_name: string | null
          contract_duration: number | null
          created_at: string
          external_providers: Json
          id: string
          invest_lines: Json | null
          invoice_number: string | null
          nos_options: Json
          operational_contact: Json
          payment_frequency: string | null
          payment_mode: string | null
          selected_services: Json | null
          show_invest_price: boolean | null
          show_offer_amount: boolean | null
          site_addresses: Json
          start_date: string | null
          status: string
          total_invest_ht: number | null
          total_services_ht: number | null
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_capital_social?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_siret?: string | null
          commercial_id: string
          commercial_name?: string | null
          contract_duration?: number | null
          created_at?: string
          external_providers?: Json
          id?: string
          invest_lines?: Json | null
          invoice_number?: string | null
          nos_options?: Json
          operational_contact?: Json
          payment_frequency?: string | null
          payment_mode?: string | null
          selected_services?: Json | null
          show_invest_price?: boolean | null
          show_offer_amount?: boolean | null
          site_addresses?: Json
          start_date?: string | null
          status?: string
          total_invest_ht?: number | null
          total_services_ht?: number | null
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_capital_social?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_siret?: string | null
          commercial_id?: string
          commercial_name?: string | null
          contract_duration?: number | null
          created_at?: string
          external_providers?: Json
          id?: string
          invest_lines?: Json | null
          invoice_number?: string | null
          nos_options?: Json
          operational_contact?: Json
          payment_frequency?: string | null
          payment_mode?: string | null
          selected_services?: Json | null
          show_invest_price?: boolean | null
          show_offer_amount?: boolean | null
          site_addresses?: Json
          start_date?: string | null
          status?: string
          total_invest_ht?: number | null
          total_services_ht?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      template_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          pages: Json
          published_at: string | null
          status: string
          template_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          pages?: Json
          published_at?: string | null
          status?: string
          template_id: string
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          pages?: Json
          published_at?: string | null
          status?: string
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pdf_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_usage_log: {
        Row: {
          id: string
          note: string | null
          reference_id: string
          used_at: string
          used_by: string
          used_by_name: string | null
        }
        Insert: {
          id?: string
          note?: string | null
          reference_id: string
          used_at?: string
          used_by: string
          used_by_name?: string | null
        }
        Update: {
          id?: string
          note?: string | null
          reference_id?: string
          used_at?: string
          used_by?: string
          used_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_usage_log_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "client_service_references"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      can_access_contract: {
        Args: {
          _commercial_id: string
          _commercial_name: string
          _user_id: string
        }
        Returns: boolean
      }
      consume_remote_support_ticket: {
        Args: { _client_id: string; _note?: string }
        Returns: {
          attribution: string | null
          bu: string | null
          client_number: string | null
          commercial_name: string | null
          created_at: string
          end_date: string | null
          entity: string
          forfait: string | null
          id: string
          invoice_number: string | null
          is_paid: boolean
          machines_count: number | null
          order_number: string | null
          products_sn: string | null
          start_date: string | null
          tickets_initial: number | null
          tickets_label: string | null
          tickets_remaining: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "remote_support_clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      consume_ticket: {
        Args: { _note?: string; _reference_id: string }
        Returns: {
          contract_id: string
          created_at: string
          erp_reference: string | null
          id: string
          option_service_id: string | null
          requires_intervention: boolean
          service_label: string
          tickets_initial: number | null
          tickets_remaining: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "client_service_references"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_commercial_id: { Args: { _user_id: string }; Returns: string }
      get_user_commercial_name: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "commercial" | "technicien"
      gantt_dependency_type: "finish_to_start" | "start_to_start"
      gantt_priority: "low" | "medium" | "high" | "critical"
      gantt_status: "not_started" | "in_progress" | "done"
      intervention_status: "prevue" | "realisee" | "annulee"
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
    Enums: {
      app_role: ["admin", "user", "commercial", "technicien"],
      gantt_dependency_type: ["finish_to_start", "start_to_start"],
      gantt_priority: ["low", "medium", "high", "critical"],
      gantt_status: ["not_started", "in_progress", "done"],
      intervention_status: ["prevue", "realisee", "annulee"],
    },
  },
} as const
