const ORIGIN = process.env.EXPLORER_API_URL ?? "http://127.0.0.1:8010";

export async function GET(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const incoming = new URL(request.url);
  const target = new URL(`/api/explorer${path.length ? `/${path.join("/")}` : ""}`, ORIGIN);
  target.search = incoming.search;

  try {
    const response = await fetch(target, { cache: "no-store" });
    const headers = new Headers();
    const type = response.headers.get("content-type");
    if (type) headers.set("content-type", type);
    const disposition = response.headers.get("content-disposition");
    if (disposition) headers.set("content-disposition", disposition);
    return new Response(await response.arrayBuffer(), { status: response.status, headers });
  } catch {
    return Response.json({ detail: "Explorer service is unavailable" }, { status: 502 });
  }
}
