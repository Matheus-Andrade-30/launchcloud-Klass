import { SNSClient, PublishCommand, SubscribeCommand } from '@aws-sdk/client-sns';

// Publica alertas no topico SNS (env SNS_TOPIC_ARN). Sem a env, vira no-op.
export class SNSService {
  private client: SNSClient;
  private topicArn: string | undefined;

  constructor() {
    this.client = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.topicArn = process.env.SNS_TOPIC_ARN;
  }

  get enabled(): boolean {
    return !!this.topicArn;
  }

  // Publica um alerta no topico (best-effort).
  async publish(
    subject: string,
    message: string,
    attributes: Record<string, string> = {},
  ): Promise<void> {
    if (!this.topicArn) return;
    try {
      const messageAttributes = Object.fromEntries(
        Object.entries(attributes).map(([k, v]) => [k, { DataType: 'String', StringValue: v }]),
      );
      await this.client.send(
        new PublishCommand({
          TopicArn: this.topicArn,
          Subject: subject.slice(0, 100),
          Message: message,
          MessageAttributes: messageAttributes,
        }),
      );
    } catch (err) {
      console.error('[SNSService] falha ao publicar alerta (ignorado):', err);
    }
  }

  // Inscreve um e-mail no topico (best-effort; exige confirmacao do destinatario).
  async subscribeEmail(email: string): Promise<void> {
    if (!this.topicArn || !email) return;
    try {
      await this.client.send(
        new SubscribeCommand({
          TopicArn: this.topicArn,
          Protocol: 'email',
          Endpoint: email,
        }),
      );
    } catch (err) {
      console.error('[SNSService] falha ao inscrever e-mail (ignorado):', err);
    }
  }
}
