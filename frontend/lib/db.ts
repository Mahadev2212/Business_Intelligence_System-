import oracledb from 'oracledb';

let pool: oracledb.Pool | null = null;

async function initPool() {
  if (pool) return pool;

  // Enable Thick mode if Oracle Instant Client is installed
  // Uncomment and set path if needed:
  // oracledb.initOracleClient({ libDir: process.env.ORACLE_INSTANT_CLIENT_PATH });

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTSTRING,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1,
  });

  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  binds: oracledb.BindParameters = []
): Promise<T[]> {
  await initPool();
  const conn = await pool!.getConnection();
  try {
    const result = await conn.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return (result.rows as T[]) ?? [];
  } finally {
    await conn.close();
  }
}

export default { query };
