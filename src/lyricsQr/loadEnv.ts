import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { isNonProductionEnvironment } from '../chorusSeparator/index.ts';

let loaded = false;

export const loadEnvironmentConfig = (): void => {
  if (loaded) {
    return;
  }
  loaded = true;

  const envFile = isNonProductionEnvironment() ? '.env.LOCAL' : '.env.PROD';
  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }
};
