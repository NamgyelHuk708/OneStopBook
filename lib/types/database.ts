// ── Enum aliases ─────────────────────────────────────────────────────────────
export type FacilityCategory = 'outdoor' | 'indoor' | 'service';
export type FacilityStatus = 'open' | 'delayed' | 'closed';
export type BookingStatus = 'confirmed' | 'cancelled' | 'delayed' | 'completed';
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'credited';
export type AlertType = 'weather' | 'maintenance' | 'emergency' | 'operational';
export type NotificationType =
  | 'confirmation'
  | 'reminder_day'
  | 'reminder_5hr'
  | 'disruption'
  | 'reschedule'
  | 'credit';

// ── Plain row interfaces (used in components) ────────────────────────────────
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Facility {
  id: string;
  name: string;
  description: string | null;
  category: FacilityCategory;
  surface_type: string | null;
  capacity: number | null;
  price_per_hour: number;
  slot_duration_hours: number;
  images: string[] | null;
  status: FacilityStatus;
  rules: string[] | null;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  facility_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  facility_id: string;
  slot_id: string;
  status: BookingStatus;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  booking_ref: string;
  created_at: string;
  // Joined fields (not in DB row — populated by select with relations)
  facility?: Facility;
  slot?: TimeSlot;
  profile?: Profile;
}

export interface Alert {
  id: string;
  facility_id: string;
  title: string;
  message: string;
  alert_type: AlertType;
  is_active: boolean;
  created_by: string;
  created_at: string;
  facility?: Facility;
}

export interface Notification {
  id: string;
  user_id: string;
  booking_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  scheduled_for: string | null;
  created_at: string;
  booking?: Booking;
}

export interface Review {
  id: string;
  user_id: string;
  facility_id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile?: Profile;
}

export interface Credit {
  id: string;
  user_id: string;
  amount: number;
  reason: string | null;
  booking_id: string | null;
  is_used: boolean;
  created_at: string;
}

// ── Supabase Database type (must match @supabase/supabase-js generic shape) ──
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      facilities: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: FacilityCategory;
          surface_type: string | null;
          capacity: number | null;
          price_per_hour: number;
          slot_duration_hours: number;
          images: string[] | null;
          status: FacilityStatus;
          rules: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: FacilityCategory;
          surface_type?: string | null;
          capacity?: number | null;
          price_per_hour: number;
          slot_duration_hours?: number;
          images?: string[] | null;
          status?: FacilityStatus;
          rules?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: FacilityCategory;
          surface_type?: string | null;
          capacity?: number | null;
          price_per_hour?: number;
          slot_duration_hours?: number;
          images?: string[] | null;
          status?: FacilityStatus;
          rules?: string[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
      time_slots: {
        Row: {
          id: string;
          facility_id: string;
          date: string;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          facility_id: string;
          date: string;
          start_time: string;
          end_time: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          facility_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'time_slots_facility_id_fkey';
            columns: ['facility_id'];
            referencedRelation: 'facilities';
            referencedColumns: ['id'];
          }
        ];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          facility_id: string;
          slot_id: string;
          status: BookingStatus;
          total_amount: number;
          payment_status: PaymentStatus;
          payment_method: string | null;
          booking_ref: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          facility_id: string;
          slot_id: string;
          status?: BookingStatus;
          total_amount: number;
          payment_status?: PaymentStatus;
          payment_method?: string | null;
          booking_ref: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          facility_id?: string;
          slot_id?: string;
          status?: BookingStatus;
          total_amount?: number;
          payment_status?: PaymentStatus;
          payment_method?: string | null;
          booking_ref?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_facility_id_fkey';
            columns: ['facility_id'];
            referencedRelation: 'facilities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_slot_id_fkey';
            columns: ['slot_id'];
            referencedRelation: 'time_slots';
            referencedColumns: ['id'];
          }
        ];
      };
      alerts: {
        Row: {
          id: string;
          facility_id: string;
          title: string;
          message: string;
          alert_type: AlertType;
          is_active: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          facility_id: string;
          title: string;
          message: string;
          alert_type: AlertType;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          facility_id?: string;
          title?: string;
          message?: string;
          alert_type?: AlertType;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'alerts_facility_id_fkey';
            columns: ['facility_id'];
            referencedRelation: 'facilities';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          booking_id: string | null;
          title: string;
          message: string;
          type: NotificationType;
          is_read: boolean;
          scheduled_for: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          booking_id?: string | null;
          title: string;
          message: string;
          type: NotificationType;
          is_read?: boolean;
          scheduled_for?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          booking_id?: string | null;
          title?: string;
          message?: string;
          type?: NotificationType;
          is_read?: boolean;
          scheduled_for?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_booking_id_fkey';
            columns: ['booking_id'];
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          facility_id: string;
          booking_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          facility_id: string;
          booking_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          facility_id?: string;
          booking_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      credits: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          reason: string | null;
          booking_id: string | null;
          is_used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          reason?: string | null;
          booking_id?: string | null;
          is_used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          reason?: string | null;
          booking_id?: string | null;
          is_used?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
