import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const ALGORITHM = "scrypt";
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(
  password: string,
): Promise<string> {
  if (!password) {
    throw new Error("Password must not be empty.");
  }

  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scrypt(
    password,
    salt,
    KEY_LENGTH,
  )) as Buffer;

  return [
    ALGORITHM,
    salt,
    derivedKey.toString("hex"),
  ].join(":");
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, salt, encodedKey, ...extraParts] =
    storedHash.split(":");

  if (
    algorithm !== ALGORITHM ||
    !salt ||
    !encodedKey ||
    extraParts.length > 0
  ) {
    return false;
  }

  let storedKey: Buffer;

  try {
    storedKey = Buffer.from(encodedKey, "hex");
  } catch {
    return false;
  }

  if (storedKey.length !== KEY_LENGTH) {
    return false;
  }

  const derivedKey = (await scrypt(
    password,
    salt,
    KEY_LENGTH,
  )) as Buffer;

  return timingSafeEqual(storedKey, derivedKey);
}
