import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const materials = await query<Record<string, unknown>>(
      `SELECT rm.material_id, rm.material_name, s.supplier_name,
              rm.unit_cost, rm.stock_qty, rm.reorder_level, rm.unit,
              CASE WHEN rm.stock_qty <= rm.reorder_level THEN 'Low' ELSE 'OK' END AS STOCK_STATUS,
              NVL(SUM(mu.quantity_used), 0) AS TOTAL_USED,
              NVL(SUM(mu.waste_qty), 0) AS TOTAL_WASTE
       FROM raw_materials rm
       JOIN suppliers s ON rm.supplier_id = s.supplier_id
       LEFT JOIN material_usage mu ON rm.material_id = mu.material_id
       GROUP BY rm.material_id, rm.material_name, s.supplier_name,
                rm.unit_cost, rm.stock_qty, rm.reorder_level, rm.unit
       ORDER BY rm.stock_qty ASC`
    );

    const usageVsAvailability = await query<{ MATERIAL_NAME: string; STOCK_QTY: number; TOTAL_USED: number }>(
      `SELECT rm.material_name,
              rm.stock_qty AS STOCK_QTY,
              NVL(SUM(mu.quantity_used), 0) AS TOTAL_USED
       FROM raw_materials rm
       LEFT JOIN material_usage mu ON rm.material_id = mu.material_id
       GROUP BY rm.material_name, rm.stock_qty
       ORDER BY TOTAL_USED DESC`
    );

    const costAnalysis = await query<{ MATERIAL_NAME: string; UNIT_COST: number; TOTAL_VALUE: number; SUPPLIER_NAME: string }>(
      `SELECT rm.material_name, rm.unit_cost,
              rm.unit_cost * rm.stock_qty AS TOTAL_VALUE,
              s.supplier_name
       FROM raw_materials rm JOIN suppliers s ON rm.supplier_id = s.supplier_id
       ORDER BY TOTAL_VALUE DESC`
    );

    const lowStockAlerts = await query<Record<string, unknown>>(
      `SELECT rm.material_name, rm.stock_qty, rm.reorder_level,
              (rm.reorder_level - rm.stock_qty) AS SHORTAGE,
              s.supplier_name, rm.unit
       FROM raw_materials rm JOIN suppliers s ON rm.supplier_id = s.supplier_id
       WHERE rm.stock_qty <= rm.reorder_level
       ORDER BY SHORTAGE DESC`
    );

    const dailyUsage = await query<{ USAGE_DATE: string; TOTAL_USED: number; TOTAL_WASTE: number }>(
      `SELECT TO_CHAR(usage_date, 'DD Mon') AS USAGE_DATE,
              SUM(quantity_used) AS TOTAL_USED,
              SUM(waste_qty) AS TOTAL_WASTE
       FROM material_usage
       GROUP BY TO_CHAR(usage_date, 'DD Mon'), TRUNC(usage_date)
       ORDER BY TRUNC(usage_date)`
    );

    return NextResponse.json({ materials, usageVsAvailability, costAnalysis, lowStockAlerts, dailyUsage });
  } catch (err) {
    console.error('Raw Materials API error:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
