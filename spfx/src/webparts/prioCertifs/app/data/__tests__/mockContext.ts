import type { WebPartContext } from "@microsoft/sp-webpart-base";

/** Fabrique une reponse "fetch-like" telle que celle attendue par SPHttpClientResponse. */
export function jsonResponse(status: number, body: unknown): {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
} {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

/**
 * WebPartContext minimal, avec spHttpClient.get/post entierement simules
 * (jest.fn()), pour tester les repositories SharePoint sans reseau ni
 * tenant reel.
 */
export function createMockContext(serverRelativeUrl = "/sites/WO-AI-TrainingTeam"): {
  context: WebPartContext;
  get: jest.Mock;
  post: jest.Mock;
} {
  const get = jest.fn();
  const post = jest.fn();
  const context = {
    pageContext: { web: { serverRelativeUrl } },
    spHttpClient: { get, post },
  } as unknown as WebPartContext;
  return { context, get, post };
}
