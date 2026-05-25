import serverless from 'serverless-http';
import express from 'express';
import dotenv from 'dotenv';
import { createApp } from './infrastructure/http/app';

dotenv.config();

const expressApp = express();
let serverlessHandler: ReturnType<typeof serverless> | null = null;

async function init(): Promise<void> {
  if (serverlessHandler) return;
  await createApp(expressApp);
  serverlessHandler = serverless(expressApp);
}

export const handler = async (event: unknown, context: unknown): Promise<unknown> => {
  await init();
  return serverlessHandler!(event as any, context as any);
};
