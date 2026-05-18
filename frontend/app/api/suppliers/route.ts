import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const suppliers = await query<Record<string, unknown>>(
      `SELECT s.supplier_id, s.supplier_name, s.contact_person, s.email,
              s.country, s.rating, s.on_time_delivery, s.status,
              COUNT(rm.material_id) AS MATERIAL_COUNT,
              NVL(SUM(rm.unit_cost * rm.stock_qty), 0) AS TOTAL_STOCK_VALUE
       FROM suppliers s
       LEFT JOIN raw_materials rm ON s.supplier_id = rm.supplier_id
       GROUP BY s.supplier_id, s.supplier_name, s.contact_person, s.email,
                s.country, s.rating, s.on_time_delivery, s.status
       ORDER BY s.rating DESC`
    );

    const materialsBySupplier = await query<Record<string, unknown>>(
      `SELECT s.supplier_name, rm.material_name,
              rm.unit_cost, rm.stock_qty, rm.reorder_level, rm.unit,
              CASE WHEN rm.stock_qty <= rm.reorder_level THEN 'Low' ELSE 'OK' END AS STOCK_STATUS
       FROM raw_materials rm JOIN suppliers s ON rm.supplier_id = s.supplier_id
       ORDER BY s.supplier_name, rm.material_name`
    );

    const deliveryChart = await query<{ SUPPLIER_NAME: string; ON_TIME: number; RATING: number }>(
      `SELECT supplier_name, on_time_delivery AS ON_TIME, rating AS RATING
       FROM suppliers ORDER BY on_time_delivery DESC`
    );

    const costComparison = await query<{ MATERIAL_NAME: string; SUPPLIER_NAME: string; UNIT_COST: number; UNIT: string }>(
      `SELECT rm.material_name, s.supplier_name, rm.unit_cost, rm.unit
       FROM raw_materials rm JOIN suppliers s ON rm.supplier_id = s.supplier_id
       ORDER BY rm.material_name, rm.unit_cost`
    );

    return NextResponse.json({ suppliers, materialsBySupplier, deliveryChart, costComparison });
  } catch (err) {
    console.error('Suppliers API error:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
