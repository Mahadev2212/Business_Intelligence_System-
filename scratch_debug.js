const oracledb = require('oracledb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTSTRING
    });
    console.log("Successfully connected to Oracle!");
    const result = await connection.execute("SELECT user FROM dual");
    console.log("Current User:", result.rows[0][0]);
  } catch (err) {
    console.error("Connection Error:", err.message);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

run();
