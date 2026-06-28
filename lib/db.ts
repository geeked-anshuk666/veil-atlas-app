import postgres from 'postgres'
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { Signer } from "@aws-sdk/rds-signer"

const signer = new Signer({
  hostname: process.env.PGHOST!,
  port: parseInt(process.env.PGPORT || '5432'),
  username: process.env.PGUSER!,
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN!,
    clientConfig: { region: process.env.AWS_REGION || 'us-east-1' },
  }),
})

// Aurora PostgreSQL — uses dynamic IAM auth token connection
const sql = postgres({
  host: process.env.PGHOST!,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE!,
  user: process.env.PGUSER!,
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

