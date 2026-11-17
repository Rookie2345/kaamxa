export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PayType = 'hour' | 'day' | 'month' | 'job';
export type JobStatus = 'open' | 'filled' | 'closed' | 'expired';
export type AppStatus = 'applied' | 'shortlisted' | 'rejected' | 'hired' | 'withdrawn';
export type QuestionKind = 'mcq' | 'text';
export type HireStatus = 'active' | 'completed' | 'cancelled';
export type ReportReason = 'spam' | 'fake' | 'foreign_job' | 'asks_money' | 'abuse' | 'other';

export interface Database {
  public: {
    Tables: {
      provinces: {
        Row: {
          id: number;
          name_en: string;
          name_ne: string;
        };
        Insert: {
          id: number;
          name_en: string;
          name_ne: string;
        };
        Update: {
          id?: number;
          name_en?: string;
          name_ne?: string;
        };
        Relationships: [];
      };
      districts: {
        Row: {
          id: number;
          province_id: number;
          name_en: string;
          name_ne: string;
        };
        Insert: {
          id?: number;
          province_id: number;
          name_en: string;
          name_ne: string;
        };
        Update: {
          id?: number;
          province_id?: number;
          name_en?: string;
          name_ne?: string;
        };
        Relationships: [];
      };
      municipalities: {
        Row: {
          id: number;
          district_id: number;
          name_en: string;
          name_ne: string;
          kind: 'metropolitan' | 'sub-metropolitan' | 'municipality' | 'rural municipality' | null;
        };
        Insert: {
          id?: number;
          district_id: number;
          name_en: string;
          name_ne: string;
          kind?: 'metropolitan' | 'sub-metropolitan' | 'municipality' | 'rural municipality' | null;
        };
        Update: {
          id?: number;
          district_id?: number;
          name_en?: string;
          name_ne?: string;
          kind?: 'metropolitan' | 'sub-metropolitan' | 'municipality' | 'rural municipality' | null;
        };
        Relationships: [];
      };
      trades: {
        Row: {
          slug: string;
          name_en: string;
          name_ne: string;
          sort: number;
        };
        Insert: {
          slug: string;
          name_en: string;
          name_ne: string;
          sort?: number;
        };
        Update: {
          slug?: string;
          name_en?: string;
          name_ne?: string;
          sort?: number;
        };
        Relationships: [];
      };
      question_templates: {
        Row: {
          id: number;
          trade_slug: string | null;
          kind: QuestionKind;
          question_en: string;
          question_ne: string;
          options_en: Json | null;
          options_ne: Json | null;
          correct_index: number | null;
        };
        Insert: {
          id?: number;
          trade_slug?: string | null;
          kind: QuestionKind;
          question_en: string;
          question_ne: string;
          options_en?: Json | null;
          options_ne?: Json | null;
          correct_index?: number | null;
        };
        Update: {
          id?: number;
          trade_slug?: string | null;
          kind?: QuestionKind;
          question_en?: string;
          question_ne?: string;
          options_en?: Json | null;
          options_ne?: Json | null;
          correct_index?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          district_id: number | null;
          municipality_id: number | null;
          tole: string | null;
          language: 'ne' | 'en';
          is_admin: boolean;
          is_hidden: boolean;
          report_count: number;
          rating_avg: number;
          rating_count: number;
          completed_jobs: number;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          district_id?: number | null;
          municipality_id?: number | null;
          tole?: string | null;
          language?: 'ne' | 'en';
          is_admin?: boolean;
          is_hidden?: boolean;
          report_count?: number;
          rating_avg?: number;
          rating_count?: number;
          completed_jobs?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          district_id?: number | null;
          municipality_id?: number | null;
          tole?: string | null;
          language?: 'ne' | 'en';
          is_admin?: boolean;
          is_hidden?: boolean;
          report_count?: number;
          rating_avg?: number;
          rating_count?: number;
          completed_jobs?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      profile_contacts: {
        Row: {
          user_id: string;
          phone: string;
          whatsapp: string | null;
        };
        Insert: {
          user_id: string;
          phone: string;
          whatsapp?: string | null;
        };
        Update: {
          user_id?: string;
          phone?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      worker_details: {
        Row: {
          user_id: string;
          headline: string | null;
          bio: string | null;
          skills: string[];
          experience_years: number | null;
          available: boolean;
          photos: string[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          headline?: string | null;
          bio?: string | null;
          skills?: string[];
          experience_years?: number | null;
          available?: boolean;
          photos?: string[];
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          headline?: string | null;
          bio?: string | null;
          skills?: string[];
          experience_years?: number | null;
          available?: boolean;
          photos?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          employer_id: string;
          title: string;
          description: string;
          trade_slug: string;
          district_id: number;
          municipality_id: number | null;
          tole: string | null;
          pay_type: PayType;
          pay_min: number | null;
          pay_max: number | null;
          negotiable: boolean;
          positions: number;
          filled: number;
          status: JobStatus;
          is_hidden: boolean;
          report_count: number;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employer_id: string;
          title: string;
          description?: string;
          trade_slug: string;
          district_id: number;
          municipality_id?: number | null;
          tole?: string | null;
          pay_type: PayType;
          pay_min?: number | null;
          pay_max?: number | null;
          negotiable?: boolean;
          positions?: number;
          filled?: number;
          status?: JobStatus;
          is_hidden?: boolean;
          report_count?: number;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employer_id?: string;
          title?: string;
          description?: string;
          trade_slug?: string;
          district_id?: number;
          municipality_id?: number | null;
          tole?: string | null;
          pay_type?: PayType;
          pay_min?: number | null;
          pay_max?: number | null;
          negotiable?: boolean;
          positions?: number;
          filled?: number;
          status?: JobStatus;
          is_hidden?: boolean;
          report_count?: number;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      job_questions: {
        Row: {
          id: string;
          job_id: string;
          position: number;
          kind: QuestionKind;
          question: string;
          options: Json | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          position: number;
          kind: QuestionKind;
          question: string;
          options?: Json | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          position?: number;
          kind?: QuestionKind;
          question?: string;
          options?: Json | null;
        };
        Relationships: [];
      };
      job_question_keys: {
        Row: {
          question_id: string;
          correct_index: number;
        };
        Insert: {
          question_id: string;
          correct_index: number;
        };
        Update: {
          question_id?: string;
          correct_index?: number;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_id: string;
          status: AppStatus;
          message: string | null;
          score: number;
          max_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          applicant_id: string;
          status?: AppStatus;
          message?: string | null;
          score?: number;
          max_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          applicant_id?: string;
          status?: AppStatus;
          message?: string | null;
          score?: number;
          max_score?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      application_answers: {
        Row: {
          id: string;
          application_id: string;
          question_id: string;
          answer_text: string | null;
          answer_index: number | null;
          is_correct: boolean | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          question_id: string;
          answer_text?: string | null;
          answer_index?: number | null;
          is_correct?: boolean | null;
        };
        Update: {
          id?: string;
          application_id?: string;
          question_id?: string;
          answer_text?: string | null;
          answer_index?: number | null;
          is_correct?: boolean | null;
        };
        Relationships: [];
      };
      hires: {
        Row: {
          id: string;
          job_id: string;
          application_id: string;
          employer_id: string;
          worker_id: string;
          status: HireStatus;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          application_id: string;
          employer_id: string;
          worker_id: string;
          status?: HireStatus;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          job_id?: string;
          application_id?: string;
          employer_id?: string;
          worker_id?: string;
          status?: HireStatus;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          hire_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          hire_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          hire_id?: string;
          reviewer_id?: string;
          reviewee_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          job_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          job_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_a?: string;
          user_b?: string;
          job_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: number;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: never;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: never;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          job_id: string | null;
          profile_id: string | null;
          reason: ReportReason;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          job_id?: string | null;
          profile_id?: string | null;
          reason: ReportReason;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          job_id?: string | null;
          profile_id?: string | null;
          reason?: ReportReason;
          details?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      hire_applicant: {
        Args: { app_id: string };
        Returns: string;
      };
      complete_hire: {
        Args: { hire_id: string };
        Returns: void;
      };
      get_or_create_conversation: {
        Args: { other: string; for_job?: string | null };
        Returns: string;
      };
      mark_read: {
        Args: { conv: string };
        Returns: void;
      };
      admin_restore: {
        Args: { kind: string; target: string };
        Returns: void;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Enums: {
      pay_type: PayType;
      job_status: JobStatus;
      app_status: AppStatus;
      question_kind: QuestionKind;
      hire_status: HireStatus;
      report_reason: ReportReason;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

