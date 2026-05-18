import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const stockLevels = await query<Record<string, unknown>>(
      `SELECT i.inventory_id, p.product_name, p.category, w.warehouse_name,
              i.quantity, i.reorder_level,
              CASE WHEN i.quantity <= i.reorder_level THEN 'Low' ELSE 'OK' END AS stock_status,
              ROUND((i.quantity / (i.reorder_level + 1)) * 100, 0) AS stock_pct
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       JOIN warehouses w ON i.warehouse_id = w.warehouse_id
       ORDER BY stock_pct ASC`
    );

    const warehouseStock = await query<{ WAREHOUSE_NAME: string; TOTAL_ITEMS: number; TOTAL_QTY: number }>(
      `SELECT w.warehouse_name,
              COUNT(DISTINCT i.product_id) AS TOTAL_ITEMS,
              SUM(i.quantity) AS TOTAL_QTY
       FROM inventory i JOIN warehouses w ON i.warehouse_id = w.warehouse_id
       GROUP BY w.warehouse_name`
    );

    const lowStockAlerts = await query<Record<string, unknown>>(
      `SELECT p.product_name, p.category, i.quantity, i.reorder_level,
              w.warehouse_name, (i.reorder_level - i.quantity) AS SHORTAGE_QTY
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       JOIN warehouses w ON i.warehouse_id = w.warehouse_id
       WHERE i.quantity <= i.reorder_level
       ORDER BY SHORTAGE_QTY DESC`
    );

    const categoryBreakdown = await query<{ CATEGORY: string; TOTAL_QTY: number }>(
      `SELECT p.category, SUM(i.quantity) AS TOTAL_QTY
       FROM inventory i JOIN products p ON i.product_id = p.product_id
       GROUP BY p.category`
    );

    return NextResponse.json({ stockLevels, warehouseStock, lowStockAlerts, categoryBreakdown });
  } catch (err) {
    console.error('Inventory API error:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
