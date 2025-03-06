export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type NotificationTemplateType = 
  | 'package_arrival'
  | 'followup_24h'
  | 'followup_48h'
  | 'followup_72h'
  | 'followup_7d'
  | 'package_pickup';

export type NotificationStatus = 
  | 'pending'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type DoormanStatus = 
  | 'active'
  | 'vacation'
  | 'away'
  | 'inactive';

export type DoormanShift = 
  | 'morning'
  | 'afternoon'
  | 'night';

export interface Database {
  public: {
    Tables: {
      signatures: {
        Row: {
          id: string
          signature_url: string
          created_at: string
        }
        Insert: {
          id?: string
          signature_url: string
          created_at?: string
        }
        Update: {
          id?: string
          signature_url?: string
          created_at?: string
        }
      }

      buildings: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }

      apartment_complex: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      apartments: {
        Row: {
          id: string
          number: string
          building_id: string
          created_at: string
        }
        Insert: {
          id?: string
          number: string
          building_id: string
          created_at?: string
        }
        Update: {
          id?: string
          number?: string
          building_id?: string
          created_at?: string
        }
      }
      residents: {
        Row: {
          id: string
          name: string
          apartment_id: string
          phone: string
          email: string
          receive_notifications: boolean
          notifications_paused_at: string | null
          notifications_paused_by: string | null
          notifications_resume_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          apartment_id: string
          phone: string
          email: string
          receive_notifications?: boolean
          notifications_paused_at?: string | null
          notifications_paused_by?: string | null
          notifications_resume_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          apartment_id?: string
          phone?: string
          email?: string
          receive_notifications?: boolean
          notifications_paused_at?: string | null
          notifications_paused_by?: string | null
          notifications_resume_at?: string | null
          created_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          qr_code: string
          apartment_id: string
          delivery_company: string
          store_name: string
          doorman_id: string | null
          doorman_name: string
          resident_id: string | null
          notes: string | null
          storage_location: string | null
          received_at: string
          delivered_at: string | null
          status: 'pending' | 'delivered'
          signature_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          qr_code: string
          apartment_id: string
          delivery_company: string
          store_name: string
          doorman_id?: string | null
          doorman_name: string
          resident_id?: string | null
          notes?: string | null
          storage_location?: string | null
          received_at?: string
          delivered_at?: string | null
          status?: 'pending' | 'delivered'
          created_at?: string
        }
        Update: {
          id?: string
          qr_code?: string
          apartment_id?: string
          delivery_company?: string
          store_name?: string
          doorman_id?: string | null
          doorman_name?: string
          resident_id?: string | null
          notes?: string | null
          storage_location?: string | null
          received_at?: string
          delivered_at?: string | null
          status?: 'pending' | 'delivered'
          created_at?: string
        }
      }
      notification_templates: {
        Row: {
          id: string
          type: NotificationTemplateType
          title: string
          content: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: NotificationTemplateType
          title: string
          content: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: NotificationTemplateType
          title?: string
          content?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notification_queue: {
        Row: {
          id: string
          resident_id: string
          template_id: string
          package_id: string | null
          status: NotificationStatus
          scheduled_for: string
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          template_id: string
          package_id?: string | null
          status?: NotificationStatus
          scheduled_for: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          template_id?: string
          package_id?: string | null
          status?: NotificationStatus
          scheduled_for?: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error?: string | null
          created_at?: string
        }
      }
      notification_logs: {
        Row: {
          id: string
          queue_id: string
          status: NotificationStatus
          error: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          queue_id: string
          status: NotificationStatus
          error?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          queue_id?: string
          status?: NotificationStatus
          error?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      doormen: {
        Row: {
          id: string
          user_id: string | null
          name: string
          cpf: string
          email: string
          phone: string
          status: DoormanStatus
          shift: DoormanShift
          photo_url: string | null
          documents: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          cpf: string
          email: string
          phone: string
          status?: DoormanStatus
          shift: DoormanShift
          photo_url?: string | null
          documents?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          cpf?: string
          email?: string
          phone?: string
          status?: DoormanStatus
          shift?: DoormanShift
          photo_url?: string | null
          documents?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      doormen_history: {
        Row: {
          id: string
          doorman_id: string
          status: DoormanStatus
          start_date: string
          end_date: string | null
          reason: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          doorman_id: string
          status: DoormanStatus
          start_date: string
          end_date?: string | null
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          doorman_id?: string
          status?: DoormanStatus
          start_date?: string
          end_date?: string | null
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      managers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string
          apartment_complex_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone: string
          apartment_complex_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string
          created_at?: string
        }
      }
    }
  }
}