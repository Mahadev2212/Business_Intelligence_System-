import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Total Revenue
    const [revenue] = await query<{ TOTAL_REVENUE: number }>(
      `SELECT NVL(SUM(total_amount), 0) AS TOTAL_REVENUE FROM orders WHERE payment_status = 'Paid'`
    );

    // Total Profit (Revenue - Cost)
    const [profit] = await query<{ TOTAL_PROFIT: number }>(
      `SELECT NVL(SUM(oi.quantity * (oi.unit_price - p.cost_price)), 0) AS TOTAL_PROFIT
       FROM order_items oi JOIN products p ON oi.product_id = p.product_id`
    );

    // Total Production Units
    const [production] = await query<{ TOTAL_UNITS: number }>(
      `SELECT NVL(SUM(actual_qty), 0) AS TOTAL_UNITS FROM production WHERE status = 'Completed'`
    );

    // Total Orders
    const [orders] = await query<{ TOTAL_ORDERS: number }>(
      `SELECT COUNT(*) AS TOTAL_ORDERS FROM orders`
    );

    // Low Stock Alerts
    const lowStock = await query<{ PRODUCT_NAME: string; QUANTITY: number; REORDER_LEVEL: number; WAREHOUSE_NAME: string }>(
      `SELECT p.product_name, i.quantity, i.reorder_level, w.warehouse_name
       FROM inventory i
       JOIN products p ON i.product_id = p.product_id
       JOIN warehouses w ON i.warehouse_id = w.warehouse_id
       WHERE i.quantity <= i.reorder_level`
    );

    // Monthly Revenue
    const monthlyRevenue = await query<{ MONTH: string; REVENUE: number }>(
      `SELECT TO_CHAR(order_date, 'Mon YYYY') AS MONTH,
              SUM(total_amount) AS REVENUE
       FROM orders
       WHERE order_date >= ADD_MONTHS(SYSDATE, -12)
       GROUP BY TO_CHAR(order_date, 'Mon YYYY'), TRUNC(order_date, 'MM')
       ORDER BY TRUNC(order_date, 'MM')`
    );

    // Top 5 Products by Revenue
    const topProducts = await query<{ PRODUCT_NAME: string; TOTAL_REVENUE: number; TOTAL_QTY: number }>(
      `SELECT p.product_name,
              SUM(oi.quantity * oi.unit_price) AS TOTAL_REVENUE,
              SUM(oi.quantity) AS TOTAL_QTY
       FROM order_items oi JOIN products p ON oi.product_id = p.product_id
       GROUP BY p.product_name
       ORDER BY TOTAL_REVENUE DESC
       FETCH FIRST 5 ROWS ONLY`
    );

    // Production vs Orders (by product)
    const prodVsDemand = await query<{ PRODUCT_NAME: string; PRODUCED: number; ORDERED: number }>(
      `SELECT p.product_name,
              NVL(SUM(pr.actual_qty), 0) AS PRODUCED,
              NVL(SUM(oi.quantity), 0) AS ORDERED
       FROM products p
       LEFT JOIN production pr ON p.product_id = pr.product_id AND pr.status = 'Completed'
       LEFT JOIN order_items oi ON p.product_id = oi.product_id
       GROUP BY p.product_name
       ORDER BY ORDERED DESC
       FETCH FIRST 8 ROWS ONLY`
    );

    // Supplier Performance
    const suppliers = await query<{ SUPPLIER_NAME: string; RATING: number; ON_TIME_DELIVERY: number }>(
      `SELECT supplier_name, rating, on_time_delivery
       FROM suppliers
       ORDER BY rating DESC`
    );

    // Order Status Distribution
    const orderStatus = await query<{ STATUS: string; COUNT: number }>(
      `SELECT status, COUNT(*) AS COUNT FROM orders GROUP BY status`
    );

    return NextResponse.json({
      revenue: revenue?.TOTAL_REVENUE ?? 0,
      profit: profit?.TOTAL_PROFIT ?? 0,
      productionUnits: production?.TOTAL_UNITS ?? 0,
      totalOrders: orders?.TOTAL_ORDERS ?? 0,
      lowStock,
      monthlyRevenue,
      topProducts,
      prodVsDemand,
      suppliers,
      orderStatus,
    });
  } catch (err) {
    console.error('Stats API error:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
