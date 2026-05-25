import express from 'express';
import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

createApp(app)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

export default app;
