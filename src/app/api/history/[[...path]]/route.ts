const ORIGIN = process.env.EXPLORER_API_URL ?? "http://127.0.0.1:8010";

async function proxy(request: Request, path: string[]) {
  const incoming = new URL(request.url);
  const target = new URL(`/api/history${path.length ? `/${path.join("/")}` : ""}`, ORIGIN);
  target.search = incoming.search;
  try {
    const response = await fetch(target, { method: "GET", cache: "no-store" });
    const headers = new Headers();
    const type = response.headers.get("content-type");
    if (type) headers.set("content-type", type);
    const disposition = response.headers.get("content-disposition");
    if (disposition) headers.set("content-disposition", disposition);
    return new Response(await response.arrayBuffer(), { status: response.status, headers });
  } catch {
    return Response.json({ detail: "History service is unavailable" }, { status: 502 });
  }
}

type RouteContext = { params: Promise<{ path?: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  return proxy(request, path);
}
