import { NextRequest } from "next/server";

const backendApiUrl = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

function buildTargetUrl(pathSegments: string[], searchParams: URLSearchParams): string {
  const normalizedPath = pathSegments.join("/");
  const base = `${backendApiUrl}/auth/${normalizedPath}`;
  const query = searchParams.toString();
  return query ? `${base}?${query}` : base;
}

async function proxyAuthRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(path ?? [], request.nextUrl.searchParams);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.arrayBuffer(),
    redirect: "manual",
  };

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, init);
  } catch (error) {
    return Response.json(
      {
        detail: `Proxy could not reach backend at ${backendApiUrl}. ${String(error)}`,
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");

  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyAuthRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyAuthRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyAuthRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyAuthRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyAuthRequest(request, context);
}
