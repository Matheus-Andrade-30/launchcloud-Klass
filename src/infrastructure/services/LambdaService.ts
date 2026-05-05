import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export class LambdaService {
  private client: LambdaClient;

  constructor() {
    this.client = new LambdaClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  async invoke(functionName: string, payload: object): Promise<unknown> {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify(payload)),
    });
    const response = await this.client.send(command);
    if (response.FunctionError) {
      throw new Error(`Lambda error: ${response.FunctionError}`);
    }
    if (response.Payload) {
      return JSON.parse(Buffer.from(response.Payload).toString());
    }
    return null;
  }
}
