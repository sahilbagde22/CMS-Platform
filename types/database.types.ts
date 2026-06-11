/**
 * OpsHive Database Schema Types
 * Generated manually — run `supabase gen types typescript` after connecting Supabase project
 * to regenerate from live schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ───────────────────────────────────────────────────────────────────

export type EmployeeStatus = 'Active' | 'Inactive';
export type DeploymentStatus = 'Active' | 'Completed' | 'Bench';
export type UploadStatus = 'processing' | 'ready' | 'error';

// ─── Database Interface ───────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      uploads: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          storage_path: string;
          file_size: number | null;
          status: UploadStatus;
          error_msg: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          storage_path: string;
          file_size?: number | null;
          status?: UploadStatus;
          error_msg?: string | null;
          uploaded_at?: string;
        };
        Update: {
          status?: UploadStatus;
          error_msg?: string | null;
        };
      };
      employees: {
        Row: {
          id: string;
          upload_id: string;
          emp_id: string;
          name: string;
          department: string;
          designation: string | null;
          annual_ctc: number | null;
          monthly_ctc: number | null;
          status: EmployeeStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          upload_id: string;
          emp_id: string;
          name: string;
          department: string;
          designation?: string | null;
          annual_ctc?: number | null;
          monthly_ctc?: number | null;
          status?: EmployeeStatus;
          created_at?: string;
        };
        Update: {
          status?: EmployeeStatus;
        };
      };
      projects: {
        Row: {
          id: string;
          upload_id: string;
          po_number: string;
          project_name: string | null;
          client: string | null;
          vertical: string | null;
          po_value: number | null;
          start_date: string | null;
          end_date: string | null;
          gm_target_pct: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          upload_id: string;
          po_number: string;
          project_name?: string | null;
          client?: string | null;
          vertical?: string | null;
          po_value?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          gm_target_pct?: number | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      deployments: {
        Row: {
          id: string;
          upload_id: string;
          emp_id: string;
          po_number: string;
          deployment_start: string | null;
          deployment_end: string | null;
          revenue: number | null;
          proprietary_charges: number | null;
          blended_revenue_multiplier: number | null;
          status: DeploymentStatus;
          duration_days: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          upload_id: string;
          emp_id: string;
          po_number: string;
          deployment_start?: string | null;
          deployment_end?: string | null;
          revenue?: number | null;
          proprietary_charges?: number | null;
          blended_revenue_multiplier?: number | null;
          status?: DeploymentStatus;
          duration_days?: number | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      employee_metrics: {
        Row: {
          id: string;
          upload_id: string;
          emp_id: string;
          total_revenue: number | null;
          total_cost: number | null;
          gross_margin: number | null;
          gross_margin_pct: number | null;
          deployment_status: DeploymentStatus;
          active_po_count: number;
          total_days_deployed: number;
        };
        Insert: {
          id?: string;
          upload_id: string;
          emp_id: string;
          total_revenue?: number | null;
          total_cost?: number | null;
          gross_margin?: number | null;
          gross_margin_pct?: number | null;
          deployment_status?: DeploymentStatus;
          active_po_count?: number;
          total_days_deployed?: number;
        };
        Update: Record<string, never>;
      };
      department_metrics: {
        Row: {
          id: string;
          upload_id: string;
          department: string;
          headcount: number;
          deployed_count: number;
          bench_count: number;
          deployment_pct: number | null;
          total_revenue: number | null;
          total_cost: number | null;
          total_profit: number | null;
          gross_margin_pct: number | null;
        };
        Insert: {
          id?: string;
          upload_id: string;
          department: string;
          headcount?: number;
          deployed_count?: number;
          bench_count?: number;
          deployment_pct?: number | null;
          total_revenue?: number | null;
          total_cost?: number | null;
          total_profit?: number | null;
          gross_margin_pct?: number | null;
        };
        Update: Record<string, never>;
      };
      company_metrics: {
        Row: {
          id: string;
          upload_id: string;
          total_employees: number;
          deployed_count: number;
          bench_count: number;
          overall_deploy_pct: number | null;
          total_revenue: number | null;
          total_cost: number | null;
          total_profit: number | null;
          overall_gm_pct: number | null;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          upload_id: string;
          total_employees?: number;
          deployed_count?: number;
          bench_count?: number;
          overall_deploy_pct?: number | null;
          total_revenue?: number | null;
          total_cost?: number | null;
          total_profit?: number | null;
          overall_gm_pct?: number | null;
          calculated_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      employee_status: EmployeeStatus;
      deployment_status: DeploymentStatus;
      upload_status: UploadStatus;
    };
  };
}
