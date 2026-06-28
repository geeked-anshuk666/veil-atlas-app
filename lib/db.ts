import postgres from 'postgres'

// Aurora PostgreSQL — uses unprefixed vars (default prefix kept for Aurora)
const sql = postgres({
  host: process.env.PGHOST!,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE!,
  user: process.env.PGUSER!,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export default sql
