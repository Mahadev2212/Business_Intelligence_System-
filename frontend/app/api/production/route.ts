import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const schedule = await query<Record<string, unknown>>(
      `SELECT pr.production_id, p.product_name, e.name AS employee_name,
              pr.planned_qty, pr.actual_qty, pr.production_date,
              pr.status, pr.machine_id, pr.shift,
              ROUND(CASE WHEN pr.planned_qty > 0 THEN (pr.actual_qty / pr.planned_qty) * 100 ELSE 0 END, 1) AS efficiency_pct
       FROM production pr
       JOIN products p ON pr.product_id = p.product_id
       JOIN employees e ON pr.employee_id = e.employee_id
       ORDER BY pr.production_date DESC`
    );

    const dailyOutput = await query<{ PRODUCTION_DATE: string; TOTAL_PRODUCED: number; PLANNED: number }>(
      `SELECT TO_CHAR(production_date, 'DD Mon') AS PRODUCTION_DATE,
              SUM(actual_qty) AS TOTAL_PRODUCED,
              SUM(planned_qty) AS PLANNED
       FROM production
       GROUP BY TO_CHAR(production_date, 'DD Mon'), TRUNC(production_date)
       ORDER BY TRUNC(production_date)`
    );

    const employeeOutput = await query<{ EMPLOYEE_NAME: string; TOTAL_OUTPUT: number; EFFICIENCY: number }>(
      `SELECT e.name AS EMPLOYEE_NAME,
              SUM(pr.actual_qty) AS TOTAL_OUTPUT,
              ROUND(AVG(CASE WHEN pr.planned_qty > 0 THEN (pr.actual_qty / pr.planned_qty) * 100 ELSE 0 END), 1) AS EFFICIENCY
       FROM production pr JOIN employees e ON pr.employee_id = e.employee_id
       GROUP BY e.name
       ORDER BY TOTAL_OUTPUT DESC`
    );

    const statusCounts = await query<{ STATUS: string; COUNT: number }>(
      `SELECT status, COUNT(*) AS COUNT FROM production GROUP BY status`
    );

    const productBreakdown = await query<{ PRODUCT_NAME: string; TOTAL_PRODUCED: number; TOTAL_PLANNED: number }>(
      `SELECT p.product_name,
              SUM(pr.actual_qty) AS TOTAL_PRODUCED,
              SUM(pr.planned_qty) AS TOTAL_PLANNED
       FROM production pr JOIN products p ON pr.product_id = p.product_id
       GROUP BY p.product_name
       ORDER BY TOTAL_PRODUCED DESC`
    );

    return NextResponse.json({ schedule, dailyOutput, employeeOutput, statusCounts, productBreakdown });
  } catch (err) {
    console.error('Production API error:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
