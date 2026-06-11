import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseExcelBuffer } from '@/lib/excel/parser';
import { validateSheets } from '@/lib/excel/sheet-validator';
import {
  findSheet,
  normalizeEmployeeSheet,
  normalizeProjectSheet,
  normalizeDeploymentSheet,
  SHEET_NAMES,
} from '@/lib/excel/normalizer';
import { enrichDeployments } from '@/lib/calculations/deployment-calculator';
import { calcAllEmployeeMetrics } from '@/lib/calculations/employee-metrics';
import { calcAllDepartmentMetrics } from '@/lib/calculations/department-metrics';
import { calcCompanyMetrics } from '@/lib/calculations/company-metrics';
import { employeeRowSchema } from '@/lib/validators/employee.schema';
import { projectRowSchema } from '@/lib/validators/project.schema';
import { deploymentRowSchema } from '@/lib/validators/deployment.schema';
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/validators/upload.schema';
import { logger } from '@/lib/utils/logger';
import type { ApiResponse, UploadResult } from '@/types/app.types';

export const runtime = 'nodejs'; // SheetJS requires Node.js — not Edge

// Magic bytes for XLSX (PK zip header) and XLS (D0 CF header)
const MAGIC_BYTES = {
  xlsx: [0x50, 0x4b, 0x03, 0x04],
  xls: [0xd0, 0xcf, 0x11, 0xe0],
} as const;

function validateMagicBytes(buffer: Buffer): boolean {
  const xlsxMatch = MAGIC_BYTES.xlsx.every((b, i) => buffer[i] === b);
  const xlsMatch = MAGIC_BYTES.xls.every((b, i) => buffer[i] === b);
  return xlsxMatch || xlsMatch;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<UploadResult>>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 1. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mappingsStr = formData.get('mappings') as string | null;
    let customMappings: Record<string, Record<string, string | null>> | undefined = undefined;

    if (mappingsStr) {
      try {
        customMappings = JSON.parse(mappingsStr);
      } catch (e) {
        return NextResponse.json({ success: false, error: 'Invalid mappings JSON format', code: 'INVALID_MAPPINGS' }, { status: 400 });
      }
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      );
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size must not exceed 10MB', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // 3. Validate MIME type + extension
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (
      !(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type) ||
      !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
    ) {
      return NextResponse.json(
        { success: false, error: 'Only Excel files (.xlsx, .xls) are allowed', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // 4. Read buffer + validate magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer)) {
      return NextResponse.json(
        { success: false, error: 'File content does not match a valid Excel file', code: 'INVALID_MAGIC_BYTES' },
        { status: 400 }
      );
    }

    // 5. Parse Excel
    const parsedSheets = parseExcelBuffer(buffer);

    if (parsedSheets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No sheets found in the uploaded file', code: 'EMPTY_FILE' },
        { status: 400 }
      );
    }

    // 6. Validate 3 required sheets + columns
    const validation = validateSheets(parsedSheets);

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => e.message).join(' | ');
      return NextResponse.json(
        { success: false, error: errorMessages, code: 'VALIDATION_FAILED' },
        { status: 422 }
      );
    }

    // 7. Create upload record (status: processing)
    const storagePath = `uploads/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data: uploadRecord, error: uploadInsertError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        status: 'processing',
      })
      .select('id')
      .single();

    if (uploadInsertError || !uploadRecord) {
      logger.error('[upload] Failed to create upload record', { error: uploadInsertError });
      return NextResponse.json(
        { success: false, error: 'Failed to initialize upload', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    const uploadId = uploadRecord.id;

    try {
      // 8. Normalize each sheet
      const employeeSheet = findSheet(parsedSheets, SHEET_NAMES.EMPLOYEE_MASTER)!;
      const projectSheet = findSheet(parsedSheets, SHEET_NAMES.PROJECT_MASTER)!;
      const deploymentSheet = findSheet(parsedSheets, SHEET_NAMES.DEPLOYMENT_LOG)!;

      const rawEmployees = normalizeEmployeeSheet(employeeSheet, customMappings?.[SHEET_NAMES.EMPLOYEE_MASTER]);
      const rawProjects = normalizeProjectSheet(projectSheet, customMappings?.[SHEET_NAMES.PROJECT_MASTER]);
      const rawDeployments = normalizeDeploymentSheet(deploymentSheet, customMappings?.[SHEET_NAMES.DEPLOYMENT_LOG]);

      // 9. Validate rows with Zod (filter out invalid rows with warning)
      const validEmployees = rawEmployees
        .map((r) => employeeRowSchema.safeParse(r))
        .filter((r) => r.success)
        .map((r) => r.data!);

      const validProjects = rawProjects
        .map((r) => projectRowSchema.safeParse(r))
        .filter((r) => r.success)
        .map((r) => r.data!);

      const validDeployments = rawDeployments
        .map((r) => deploymentRowSchema.safeParse(r))
        .filter((r) => r.success)
        .map((r) => r.data!);

      // 10. Insert employees
      if (validEmployees.length > 0) {
        const empInserts = validEmployees.map((e) => ({
          upload_id: uploadId,
          emp_id: e.emp_id,
          name: e.name,
          department: e.department,
          designation: e.designation ?? null,
          annual_ctc: e.annual_ctc ?? null,
          monthly_ctc: e.monthly_ctc ?? null,
          status: e.status,
        }));

        const { error: empError } = await supabase.from('employees').insert(empInserts);
        if (empError) {
          logger.error('[upload] Failed to insert employees', { error: empError });
          throw new Error('Failed to store employee data');
        }
      }

      // 11. Insert projects
      if (validProjects.length > 0) {
        const projInserts = validProjects.map((p) => ({
          upload_id: uploadId,
          po_number: p.po_number,
          project_name: p.project_name ?? null,
          client: p.client ?? null,
          vertical: p.vertical ?? null,
          po_value: p.po_value ?? null,
          start_date: p.start_date ?? null,
          end_date: p.end_date ?? null,
          gm_target_pct: p.gm_target_pct ?? null,
        }));

        const { error: projError } = await supabase.from('projects').insert(projInserts);
        if (projError) {
          logger.error('[upload] Failed to insert projects', { error: projError });
          throw new Error('Failed to store project data');
        }
      }

      // 12. Enrich + insert deployments
      const enrichedDeployments = enrichDeployments(validDeployments);

      if (enrichedDeployments.length > 0) {
        const deplInserts = enrichedDeployments.map((d) => ({
          upload_id: uploadId,
          emp_id: d.emp_id,
          po_number: d.po_number,
          deployment_start: d.deployment_start ?? null,
          deployment_end: d.deployment_end ?? null,
          revenue: d.revenue ?? null,
          proprietary_charges: d.proprietary_charges ?? null,
          blended_revenue_multiplier: d.blended_revenue_multiplier ?? null,
          status: d.status,
          duration_days: d.duration_days,
        }));

        const { error: deplError } = await supabase.from('deployments').insert(deplInserts);
        if (deplError) {
          logger.error('[upload] Failed to insert deployments', { error: deplError });
          throw new Error('Failed to store deployment data');
        }
      }

      // 13. Run calculation engine
      const employeeMetrics = calcAllEmployeeMetrics(validEmployees, enrichedDeployments);
      const departmentMetrics = calcAllDepartmentMetrics(validEmployees, employeeMetrics);
      const companyMetrics = calcCompanyMetrics(employeeMetrics, departmentMetrics);

      // 14. Store employee_metrics
      if (employeeMetrics.length > 0) {
        const empMetricInserts = employeeMetrics.map((m) => ({
          upload_id: uploadId,
          emp_id: m.emp_id,
          total_revenue: m.total_revenue,
          total_cost: m.total_cost,
          gross_margin: m.gross_margin,
          gross_margin_pct: m.gross_margin_pct,
          deployment_status: m.deployment_status,
          active_po_count: m.active_po_count,
          total_days_deployed: m.total_days_deployed,
        }));

        const { error: empMetricError } = await supabase
          .from('employee_metrics')
          .insert(empMetricInserts);
        if (empMetricError) {
          logger.error('[upload] Failed to insert employee_metrics', { error: empMetricError });
        }
      }

      // 15. Store department_metrics
      if (departmentMetrics.length > 0) {
        const deptMetricInserts = departmentMetrics.map((m) => ({
          upload_id: uploadId,
          department: m.department,
          headcount: m.headcount,
          deployed_count: m.deployed_count,
          bench_count: m.bench_count,
          deployment_pct: m.deployment_pct,
          total_revenue: m.total_revenue,
          total_cost: m.total_cost,
          total_profit: m.total_profit,
          gross_margin_pct: m.gross_margin_pct,
        }));

        const { error: deptMetricError } = await supabase
          .from('department_metrics')
          .insert(deptMetricInserts);
        if (deptMetricError) {
          logger.error('[upload] Failed to insert department_metrics', { error: deptMetricError });
        }
      }

      // 16. Store company_metrics
      const { error: companyMetricError } = await supabase.from('company_metrics').insert({
        upload_id: uploadId,
        total_employees: companyMetrics.total_employees,
        deployed_count: companyMetrics.deployed_count,
        bench_count: companyMetrics.bench_count,
        overall_deploy_pct: companyMetrics.overall_deploy_pct,
        total_revenue: companyMetrics.total_revenue,
        total_cost: companyMetrics.total_cost,
        total_profit: companyMetrics.total_profit,
        overall_gm_pct: companyMetrics.overall_gm_pct,
      });

      if (companyMetricError) {
        logger.error('[upload] Failed to insert company_metrics', { error: companyMetricError });
      }

      // 17. Mark upload as ready
      await supabase.from('uploads').update({ status: 'ready' }).eq('id', uploadId);

      return NextResponse.json(
        {
          success: true,
          data: {
            uploadId,
            warnings: validation.warnings,
          },
        },
        { status: 201 }
      );
    } catch (pipelineError) {
      // Mark upload as error
      await supabase
        .from('uploads')
        .update({
          status: 'error',
          error_msg:
            pipelineError instanceof Error ? pipelineError.message : 'Pipeline failed',
        })
        .eq('id', uploadId);

      logger.error('[upload] Pipeline error', { error: pipelineError });
      return NextResponse.json(
        { success: false, error: 'Processing failed. Please check your Excel file and try again.', code: 'PIPELINE_ERROR' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('[upload] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
