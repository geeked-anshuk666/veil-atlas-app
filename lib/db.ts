import postgres from 'postgres'
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { Signer } from "@aws-sdk/rds-signer"

const pgHost = process.env.STORAGE_PGHOST || process.env.PGHOST || ''
const pgPort = parseInt(process.env.STORAGE_PGPORT || process.env.PGPORT || '5432')
const pgUser = process.env.STORAGE_PGUSER || process.env.PGUSER || 'postgres'
const pgDatabase = process.env.STORAGE_PGDATABASE || process.env.PGDATABASE || ''
const awsRoleArn = process.env.STORAGE_AWS_ROLE_ARN || process.env.AWS_ROLE_ARN || ''
const awsRegion = process.env.STORAGE_AWS_REGION || process.env.AWS_REGION || 'us-east-1'

const signer = new Signer({
  hostname: pgHost,
  port: pgPort,
  username: pgUser,
  region: awsRegion,
  credentials: awsCredentialsProvider({
    roleArn: awsRoleArn,
    clientConfig: { region: awsRegion },
  }),
})

// Aurora PostgreSQL — uses dynamic IAM auth token connection
const sql = postgres({
  host: pgHost,
  port: pgPort,
  database: pgDatabase,
  user: pgUser,
  password: async () => {
    try {
      const token = await signer.getAuthToken()
      return token
    } catch (err) {
      console.error('Error generating RDS IAM token:', err)
      return ''
    }
  },
  ssl: { rejectUnauthorized: false },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export default sql


