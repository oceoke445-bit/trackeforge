const ORIGIN = process.env.EXPLORER_API_URL ?? "http://127.0.0.1:8010";

async function proxy(request: Request, path: string[]) {
  const incoming = new URL(request.url);
  const target = new URL(`/api/tickets${path.length ? `/${path.join("/")}` : ""}`, ORIGIN);
  target.search = incoming.search;
  const headers = new Headers();
  const type = request.headers.get("content-type");
  if (type) headers.set("content-type", type);
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > 0) body = bytes;
  }
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
    const out = new Headers();
    const responseType = response.headers.get("content-type");
    if (responseType) out.set("content-type", responseType);
    if (response.status === 204 || response.status === 205) return new Response(null, { status: response.status, headers: out });
    return new Response(await response.arrayBuffer(), { status: response.status, headers: out });
  } catch {
    return Response.json({ detail: "Tickets service is unavailable" }, { status: 502 });
  }
}

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  return proxy(request, path);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
