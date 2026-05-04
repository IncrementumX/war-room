const ALLOWED_ORIGINS = [
  "https://incrementumx.github.io",
  "http://localhost",
  "http://127.0.0.1"
];

const failedPins = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return corsResponse(request, null, 204);

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        return corsJson(request, { ok: true });
      }

      const pinResult = validatePin(request, env);
      if (pinResult) return corsJson(request, pinResult.body, pinResult.status);

      const route = matchRoute(url.pathname);
      if (!route) return corsJson(request, { error: "Not found" }, 404);

      if (route.collection && request.method === "GET") {
        return corsJson(request, await listTasks(env));
      }

      if (route.collection && request.method === "POST") {
        const body = await readJson(request);
        return corsJson(request, await upsertTask(env, body), 201);
      }

      if (route.clientId && request.method === "PATCH") {
        const body = await readJson(request);
        return corsJson(request, await updateTask(env, route.clientId, body));
      }

      if (route.clientId && route.action === "archive" && request.method === "POST") {
        return corsJson(request, await archiveTask(env, route.clientId));
      }

      if (route.clientId && route.action === "restore" && request.method === "POST") {
        return corsJson(request, await restoreTask(env, route.clientId));
      }

      if (route.clientId && request.method === "DELETE") {
        await deleteTask(env, route.clientId);
        return corsJson(request, { ok: true });
      }

      if (route.bulkImport && request.method === "POST") {
        const body = await readJson(request);
        return corsJson(request, await bulkImport(env, Array.isArray(body.tasks) ? body.tasks : []));
      }

      return corsJson(request, { error: "Method not allowed" }, 405);
    } catch (error) {
      return corsJson(request, { error: error.message || "Unexpected error" }, 500);
    }
  }
};

function matchRoute(pathname) {
  if (pathname === "/tasks") return { collection: true };
  if (pathname === "/tasks/bulk-import") return { bulkImport: true };
  const match = pathname.match(/^\/tasks\/([^/]+)(?:\/(archive|restore))?$/);
  if (!match) return null;
  return { clientId: decodeURIComponent(match[1]), action: match[2] || null };
}

function validatePin(request, env) {
  const expected = env.WAR_ROOM_PIN;
  if (!expected) return { status: 500, body: { error: "WAR_ROOM_PIN is not configured" } };

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const failed = failedPins.get(ip);
  if (failed && failed.count >= 8 && Date.now() - failed.last < 60_000) {
    return { status: 429, body: { error: "Too many attempts" } };
  }

  const provided = request.headers.get("X-War-Room-Pin") || "";
  if (!safeEqual(provided, expected)) {
    failedPins.set(ip, { count: (failed ? failed.count : 0) + 1, last: Date.now() });
    return { status: 401, body: { error: "Invalid PIN" } };
  }

  failedPins.delete(ip);
  return null;
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function taskRow(input, index) {
  const now = new Date().toISOString();
  const priority = ["P1", "P2", "P3"].includes(input.priority) ? input.priority : "P2";
  return {
    client_id: String(input.client_id || input.id || crypto.randomUUID()),
    title: String(input.title || "Untitled").trim() || "Untitled",
    comment: input.comment ? String(input.comment) : null,
    theme: String(input.theme || input.topic || "General").trim() || "General",
    subtopic: String(input.subtopic || "General").trim() || "General",
    priority,
    in_order: !!(input.in_order || input.inOrderOfDay || input.inOrder),
    status: input.status === "archived" ? "archived" : "active",
    order_index: typeof input.order_index === "number" ? input.order_index : index,
    created_at: input.created_at || input.createdAt || now,
    updated_at: input.updated_at || input.updatedAt || now,
    completed_at: input.completed_at || input.completedAt || null,
    archived_at: input.archived_at || input.archivedAt || null,
    raw: input.raw || {
      note: input.note || input.comment || "",
      topic: input.topic || input.theme || "General",
      inOrderOfDay: !!(input.inOrderOfDay || input.in_order),
      inOrder: !!(input.inOrder || input.in_order)
    }
  };
}

async function listTasks(env) {
  return supabase(env, "/rest/v1/" + table(env) + "?select=*&order=order_index.asc.nullslast,created_at.asc");
}

async function upsertTask(env, input) {
  const rows = await supabase(env, "/rest/v1/" + table(env) + "?on_conflict=client_id", {
    method: "POST",
    body: JSON.stringify(taskRow(input, input.order_index || 0)),
    prefer: "resolution=merge-duplicates,return=representation"
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function updateTask(env, clientId, input) {
  const patch = taskRow({ ...input, client_id: clientId }, input.order_index || 0);
  delete patch.client_id;
  delete patch.created_at;
  const rows = await supabase(env, "/rest/v1/" + table(env) + "?client_id=eq." + encodeURIComponent(clientId), {
    method: "PATCH",
    body: JSON.stringify(patch),
    prefer: "return=representation"
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function archiveTask(env, clientId) {
  const now = new Date().toISOString();
  const rows = await supabase(env, "/rest/v1/" + table(env) + "?client_id=eq." + encodeURIComponent(clientId), {
    method: "PATCH",
    body: JSON.stringify({
      status: "archived",
      in_order: false,
      completed_at: now,
      archived_at: now,
      updated_at: now
    }),
    prefer: "return=representation"
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function restoreTask(env, clientId) {
  const now = new Date().toISOString();
  const rows = await supabase(env, "/rest/v1/" + table(env) + "?client_id=eq." + encodeURIComponent(clientId), {
    method: "PATCH",
    body: JSON.stringify({
      status: "active",
      in_order: false,
      completed_at: null,
      archived_at: null,
      updated_at: now
    }),
    prefer: "return=representation"
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function deleteTask(env, clientId) {
  await supabase(env, "/rest/v1/" + table(env) + "?client_id=eq." + encodeURIComponent(clientId), {
    method: "DELETE",
    prefer: "return=minimal"
  });
}

async function bulkImport(env, tasks) {
  if (!tasks.length) return [];
  const rows = tasks.map(taskRow);
  return supabase(env, "/rest/v1/" + table(env) + "?on_conflict=client_id", {
    method: "POST",
    body: JSON.stringify(rows),
    prefer: "resolution=merge-duplicates,return=representation"
  });
}

async function supabase(env, path, options = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase Worker secrets are not configured");
  }
  const response = await fetch(env.SUPABASE_URL.replace(/\/$/, "") + path, {
    method: options.method || "GET",
    headers: {
      "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation"
    },
    body: options.body
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Supabase request failed");
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function table(env) {
  return env.SUPABASE_TABLE || "war_room_tasks";
}

function corsJson(request, data, status = 200) {
  return corsResponse(request, JSON.stringify(data), status, { "Content-Type": "application/json" });
}

function corsResponse(request, body, status = 200, headers = {}) {
  const origin = request.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.some(item => origin === item || origin.startsWith(item + ":"));
  return new Response(body, {
    status,
    headers: {
      ...headers,
      "Access-Control-Allow-Origin": allowed ? origin : "https://incrementumx.github.io",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,X-War-Room-Pin",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    }
  });
}
