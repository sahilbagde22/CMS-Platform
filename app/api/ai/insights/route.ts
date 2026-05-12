import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Fetch latest metrics
    const { data: latestUpload } = await supabase
      .from('uploads')
      .select('id')
      .eq('status', 'ready')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestUpload) {
      return NextResponse.json({ success: false, error: 'No data available' }, { status: 404 });
    }

    const { data: companyMetrics } = await supabase
      .from('company_metrics')
      .select('*')
      .eq('upload_id', latestUpload.id)
      .single();

    const { data: departmentMetrics } = await supabase
      .from('department_metrics')
      .select('*')
      .eq('upload_id', latestUpload.id);

    // 2. Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'AI is not configured.' }, { status: 500 });
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // 3. Construct prompt
    const prompt = `
      You are an expert Operations & Finance Analyst for a services company.
      Analyze the following operational metrics and provide 3-4 bullet points of high-level insights.
      Focus on anomalies, bench utilization, and gross margin profitability.
      Keep it professional, actionable, and extremely concise (maximum 1-2 sentences per bullet point).
      Format as a clean Markdown list without any intro or outro text.

      Company Metrics:
      ${JSON.stringify(companyMetrics, null, 2)}

      Department Metrics:
      ${JSON.stringify(departmentMetrics, null, 2)}
    `;

    // 4. Generate content
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ success: true, insights: text });
  } catch (error) {
    logger.error('[ai/insights] Failed to generate insights', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
