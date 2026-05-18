import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const orders = await query<Record<string, unknown>>(
      `SELECT o.order_id, c.customer_name, c.company, c.region,
              o.order_date, o.delivery_date, o.status,
              o.total_amount, o.payment_status
       FROM orders o JOIN customers c ON o.customer_id = c.customer_id
       ORDER BY o.order_date DESC`
    );

    const monthlyRevenue = await query<{ MONTH: string; REVENUE: number; ORDER_COUNT: number }>(
      `SELECT TO_CHAR(order_date, 'Mon YYYY') AS MONTH,
              SUM(total_amount) AS REVENUE,
              COUNT(*) AS ORDER_COUNT
       FROM orders
       WHERE order_date >= ADD_MONTHS(SYSDATE, -12)
       GROUP BY TO_CHAR(order_date, 'Mon YYYY'), TRUNC(order_date, 'MM')
       ORDER BY TRUNC(order_date, 'MM')`
    );

    const topCustomers = await query<{ CUSTOMER_NAME: string; COMPANY: string; TOTAL_SPENT: number; ORDER_COUNT: number }>(
      `SELECT c.customer_name, c.company,
              SUM(o.total_amount) AS TOTAL_SPENT,
              COUNT(o.order_id) AS ORDER_COUNT
       FROM customers c JOIN orders o ON c.customer_id = o.customer_id
       GROUP BY c.customer_name, c.company
       ORDER BY TOTAL_SPENT DESC
       FETCH FIRST 5 ROWS ONLY`
    );

    const regionSales = await query<{ REGION: string; TOTAL_REVENUE: number; ORDER_COUNT: number }>(
      `SELECT c.region,
              SUM(o.total_amount) AS TOTAL_REVENUE,
              COUNT(o.order_id) AS ORDER_COUNT
       FROM orders o JOIN customers c ON o.customer_id = c.customer_id
       GROUP BY c.region`
    );

    const profitPerOrder = await query<{ ORDER_ID: number; CUSTOMER_NAME: string; REVENUE: number; PROFIT: number }>(
      `SELECT o.order_id, c.customer_name,
              o.total_amount AS REVENUE,
              SUM(oi.quantity * (oi.unit_price - p.cost_price)) AS PROFIT
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN products p ON oi.product_id = p.product_id
       GROUP BY o.order_id, c.customer_name, o.total_amount
       ORDER BY PROFIT DESC
       FETCH FIRST 10 ROWS ONLY`
    );

    const orderStatus = await query<{ STATUS: string; COUNT: number; TOTAL_AMOUNT: number }>(
      `SELECT status, COUNT(*) AS COUNT, SUM(total_amount) AS TOTAL_AMOUNT
       FROM orders GROUP BY status`
    );

    return NextResponse.json({ orders, monthlyRevenue, topCustomers, regionSales, profitPerOrder, orderStatus });
  } catch (err) {
    console.error('Sales API error:', err);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
