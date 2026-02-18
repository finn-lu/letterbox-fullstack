import { NextRequest } from "next/server";

const backendApiUrl = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

async function proxyMoviesRequest(request: NextRequest) {
  const url = new URL(request.url);
  const targetUrl = `${backendApiUrl}/movies${url.search}`;

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

export async function GET(request: NextRequest) {
  return proxyMoviesRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyMoviesRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyMoviesRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyMoviesRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyMoviesRequest(request);
}
