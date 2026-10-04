const ORIGIN = process.env.EXPLORER_API_URL ?? "http://127.0.0.1:8010";

async function proxy(request: Request, path: string[]) {
  const incoming = new URL(request.url);
  const target = new URL(`/api/alerts${path.length ? `/${path.join("/")}` : ""}`, ORIGIN);
  target.search = incoming.search;
  const headers = new Headers();
  const type = request.headers.get("content-type");
  if (type) headers.set("content-type", type);

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      cache: "no-store",
    });
    const out = new Headers();
    const responseType = response.headers.get("content-type");
    if (responseType) out.set("content-type", responseType);
    const disposition = response.headers.get("content-disposition");
    if (disposition) out.set("content-disposition", disposition);
    return new Response(await response.arrayBuffer(), { status: response.status, headers: out });
  } catch {
    return Response.json({ detail: "Alerts service is unavailable" }, { status: 502 });
  }
}

type RouteContext = { params: Promise<{ path?: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  return proxy(request, path);
}

export async function POST(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  return proxy(request, path);
}
