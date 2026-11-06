import { BadRequestException } from '@nestjs/common';
import { parseAddress, type Address } from '@small-web/shared';

export function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

/** Addresses read back from the database were normalized on the way in; re-check rather than cast. */
export function storedAddress(value: string): Address {
  const parsed = parseAddress(value);
  if (!parsed.ok) throw new Error(`Stored address is not valid: ${value}`);
  return parsed.address;
}

export function parseLimit(raw: string | undefined, fallback: number, max: number): number {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1)
    throw new BadRequestException('limit must be a positive integer.');
  return Math.min(value, max);
}
