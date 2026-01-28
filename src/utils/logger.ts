import pino from 'pino';
import { config } from '../config';

const level = config.nodeEnv === 'test' ? 'silent' : config.logLevel;

export const logger = pino({ level });
