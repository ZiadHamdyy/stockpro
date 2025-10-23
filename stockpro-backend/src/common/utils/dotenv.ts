import { config } from 'dotenv';
import * as path from 'path';

// Initializing dotenv
const envPath: string = path.resolve(
  process.cwd() + (process.env.NODE_ENV === 'test' ? '/.env.test' : '/.env'),
);

config({ path: envPath });
