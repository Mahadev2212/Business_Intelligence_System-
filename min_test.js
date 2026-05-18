const oracledb = require('oracledb');

async function test() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'bi_admin',
      password: 'DashboardPass123',
      connectString: 'localhost:1521/XEPDB1'
    });
    console.log("Connected.");
    
    const tables = [
      "CREATE TABLE employees (employee_id NUMBER PRIMARY KEY, name VARCHAR2(100), department VARCHAR2(50), role VARCHAR2(50), shift VARCHAR2(20), status VARCHAR2(20))",
      "CREATE TABLE products (product_id NUMBER PRIMARY KEY, product_name VARCHAR2(100), category VARCHAR2(50), unit_price NUMBER(10,2), cost_price NUMBER(10,2))"
    ];

    for (let t of tables) {
      await conn.execute(t);
      console.log("Created table");
    }
    await conn.commit();
  } catch (err) {
    console.error(err.message);
  } finally {
    if (conn) await conn.close();
  }
}
test();
