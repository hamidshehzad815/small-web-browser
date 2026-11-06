import type {
  PageShown,
  PersonDto,
  PublishRequest,
  RecordVisitRequest,
  ResolveResponse,
  SearchResponse,
  SessionDto,
  VisitDto,
  VisitPage,
} from '@small-web/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Something went wrong.';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: init.body ? { 'content-type': 'application/json' } : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', 0);
  }
  if (!response.ok) {
    let message = `The server answered ${response.status}.`;
    try {
      const body: unknown = await response.json();
      if (typeof body === 'object' && body !== null && 'message' in body) {
        const raw = body.message;
        message = Array.isArray(raw) ? raw.join(' ') : String(raw);
      }
    } catch {
      // keep the generic message
    }
    throw new ApiError(message, response.status);
  }
  return (await response.json()) as T;
}

const json = (method: string, body: unknown, keepalive = false): RequestInit => ({
  method,
  body: JSON.stringify(body),
  keepalive,
});

export const getPeople = () => request<PersonDto[]>('/people');
export const resolveAddress = (address: string) =>
  request<ResolveResponse>(`/resolve?address=${encodeURIComponent(address)}`);
export const getRevision = (revisionId: string) =>
  request<PageShown>(`/revisions/${encodeURIComponent(revisionId)}`);
export const searchSites = (query: string) =>
  request<SearchResponse>(`/search?q=${encodeURIComponent(query)}`);
export const publishSite = (body: PublishRequest) =>
  request<PageShown>('/sites', json('POST', body));

export const recordVisit = (personId: string, body: RecordVisitRequest) =>
  request<VisitDto>(`/people/${encodeURIComponent(personId)}/visits`, json('POST', body));
export const getVisits = (personId: string, cursor?: string) =>
  request<VisitPage>(
    `/people/${encodeURIComponent(personId)}/visits?limit=40${
      cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
    }`,
  );

export const getSession = (personId: string) =>
  request<SessionDto>(`/people/${encodeURIComponent(personId)}/session`);
/** `keepalive` lets the last save survive the tab being closed or the person being switched. */
export const saveSession = (personId: string, session: SessionDto, keepalive = false) =>
  request<SessionDto>(
    `/people/${encodeURIComponent(personId)}/session`,
    json('PUT', session, keepalive),
  );
