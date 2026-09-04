import { timingSafeEqual } from "node:crypto";

export const TEST_API_TOKEN_HEADER = "x-test-api-token";

export function isTestApiRequestAuthorized(
  request: Request,
): boolean {
  const expectedToken = process.env.TEST_API_TOKEN?.trim();
  const receivedToken = request.headers.get(
    TEST_API_TOKEN_HEADER,
  );

  if (!expectedToken || !receivedToken) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedToken, "utf8");
  const receivedBuffer = Buffer.from(receivedToken, "utf8");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
