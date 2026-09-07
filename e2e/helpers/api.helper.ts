import type { APIRequestContext } from "@playwright/test";

export type TestUser = {
  email: string;
  password: string;
};

type CreateUserResponse = {
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
};

function getTestApiToken(): string {
  const token = process.env.TEST_API_TOKEN;

  if (!token) {
    throw new Error(
      "TEST_API_TOKEN is required to manage Playwright test users.",
    );
  }

  return token;
}

export async function createUserViaApi(
  request: APIRequestContext,
  user: TestUser,
): Promise<string> {
  const response = await request.post("/api/users", {
    headers: {
      "x-test-api-token": getTestApiToken(),
    },
    data: user,
  });

  if (response.status() !== 201) {
    throw new Error(
      `Creating test user failed with status ${response.status()}: ${await response.text()}`,
    );
  }

  const body = (await response.json()) as CreateUserResponse;

  return body.user.id;
}

export async function deleteUserViaApi(
  request: APIRequestContext,
  userId: string,
): Promise<void> {
  const response = await request.delete(`/api/users/${userId}`, {
    headers: {
      "x-test-api-token": getTestApiToken(),
    },
  });

  if (response.status() !== 204) {
    throw new Error(
      `Deleting test user failed with status ${response.status()}: ${await response.text()}`,
    );
  }
}