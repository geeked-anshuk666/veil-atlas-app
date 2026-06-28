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
  process.env.NOW_AWS_ROLE_ARN!,
  process.env.NOW_AWS_REGION ?? 'us-east-1'
)
export const NOW_TABLE = process.env.NOW_DYNAMODB_TABLE_NAME!

// veil-presence table
export const dynamoPresence = makeDynamoClient(
  process.env.PRESENCE_AWS_ROLE_ARN!,
  process.env.PRESENCE_AWS_REGION ?? 'us-east-1'
)
export const PRESENCE_TABLE = process.env.PRESENCE_DYNAMODB_TABLE_NAME!

// veil-threshold table
export const dynamoThreshold = makeDynamoClient(
  process.env.AMAZON_DYNAMODB_AWS_ROLE_ARN!,
  process.env.AMAZON_DYNAMODB_AWS_REGION ?? 'us-east-1'
)
export const THRESHOLD_TABLE = process.env.AMAZON_DYNAMODB_DYNAMODB_TABLE_NAME!
