import pino from 'pino';
import { baseConfig } from '../config/base';

const level = baseConfig.nodeEnv === 'test' ? 'silent' : baseConfig.logLevel;

export const logger = pino({ level });
