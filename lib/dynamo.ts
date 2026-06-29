import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { awsCredentialsProvider } from '@vercel/functions/oidc'

function makeDynamoClient(roleArn: string, region: string) {
  const client = new DynamoDBClient({
    region,
    credentials: awsCredentialsProvider({
      roleArn,
      clientConfig: { region },
    }),
  })
  return DynamoDBDocumentClient.from(client)
}

// veil-now table
export const dynamoNow = makeDynamoClient(
  process.env.now_AWS_ROLE_ARN || process.env.NOW_AWS_ROLE_ARN || '',
  process.env.now_AWS_REGION || process.env.NOW_AWS_REGION || 'us-east-1'
)
export const NOW_TABLE = process.env.now_DYNAMODB_TABLE_NAME || process.env.NOW_DYNAMODB_TABLE_NAME || ''

// veil-presence table
export const dynamoPresence = makeDynamoClient(
  process.env.presence_AWS_ROLE_ARN || process.env.PRESENCE_AWS_ROLE_ARN || '',
  process.env.presence_AWS_REGION || process.env.PRESENCE_AWS_REGION || 'us-east-1'
)
export const PRESENCE_TABLE = process.env.presence_DYNAMODB_TABLE_NAME || process.env.PRESENCE_DYNAMODB_TABLE_NAME || ''

// veil-threshold table
export const dynamoThreshold = makeDynamoClient(
  process.env.threshold_AWS_ROLE_ARN || process.env.AMAZON_DYNAMODB_AWS_ROLE_ARN || '',
  process.env.threshold_AWS_REGION || process.env.AMAZON_DYNAMODB_AWS_REGION || 'us-east-1'
)
export const THRESHOLD_TABLE = process.env.threshold_DYNAMODB_TABLE_NAME || process.env.AMAZON_DYNAMODB_DYNAMODB_TABLE_NAME || ''

