import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const employees = await query<Record<string, unknown>>(
      `SELECT e.employee_id, e.name, e.department, e.role, e.shift,
              e.salary, e.status, e.hire_date,
              NVL(SUM(p.actual_qty), 0) AS TOTAL_OUTPUT,
              COUNT(p.production_id) AS PRODUCTION_RUNS,
              ROUND(AVG(CASE WHEN p.planned_qty > 0
                THEN (p.actual_qty / p.planned_qty) * 100 ELSE 0 END), 1) AS AVG_EFFICIENCY
       FROM employees e
       LEFT JOIN production p ON e.employee_id = p.employee_id AND p.status = 'Completed'
       GROUP BY e.employee_id, e.name, e.department, e.role, e.shift, e.salary, e.status, e.hire_date
       ORDER BY TOTAL_OUTPUT DESC`
    );

    const deptPerformance = await query<{ DEPARTMENT: string; TOTAL_OUTPUT: number; AVG_EFFICIENCY: number; HEADCOUNT: number }>(
      `SELECT e.department,
              NVL(SUM(p.actual_qty), 0) AS TOTAL_OUTPUT,
              ROUND(AVG(CASE WHEN p.planned_qty > 0
                THEN (p.actual_qty / p.planned_qty) * 100 ELSE 0 END), 1) AS AVG_EFFICIENCY,
              COUNT(DISTINCT e.employee_id) AS HEADCOUNT
       FROM employees e
       LEFT JOIN production p ON e.employee_id = p.employee_id
       GROUP BY e.department`
    );

    const shiftDistribution = await query<{ SHIFT: string; HEADCOUNT: number }>(
      `SELECT shift, COUNT(*) AS HEADCOUNT FROM employees GROUP BY shift`
    );

    const topProducers = await query<{ NAME: string; DEPARTMENT: string; TOTAL_OUTPUT: number; EFFICIENCY: number }>(
      `SELECT e.name, e.department,
              SUM(p.actual_qty) AS TOTAL_OUTPUT,
              ROUND(AVG(CASE WHEN p.planned_qty > 0
                THEN (p.actual_qty / p.planned_qty) * 100 ELSE 0 END), 1) AS EFFICIENCY
       FROM employees e JOIN production p ON e.employee_id = p.employee_id
       WHERE p.status = 'Completed'
       GROUP BY e.name, e.department
       ORDER BY TOTAL_OUTPUT DESC
       FETCH FIRST 5 ROWS ONLY`
    );

    return NextResponse.json({ employees, deptPerformance, shiftDistribution, topProducers });
  } catch (err) {
    console.error('Employees API error:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
