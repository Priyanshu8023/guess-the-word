const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Get the stored auth token from localStorage.
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Store the auth token in localStorage.
 */
export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

/**
 * Remove the auth token from localStorage.
 */
export function removeToken(): void {
  localStorage.removeItem("token");
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Make an authenticated API request.
 */
async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

// ─── Auth API ───────────────────────────────────────────────

export async function register(username: string, password: string) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Registration failed");
  return data;
}

export async function login(username: string, password: string) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  setToken(data.access_token);
  return data;
}

export async function getMe() {
  const res = await apiFetch("/auth/me");
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch user");
  return data;
}

// ─── Game API ───────────────────────────────────────────────

export async function startGame() {
  const res = await apiFetch("/game/start", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to start game");
  return data;
}

export async function submitGuess(word: string) {
  const res = await apiFetch("/game/guess", {
    method: "POST",
    body: JSON.stringify({ word }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to submit guess");
  return data;
}

export async function getGameStatus() {
  const res = await apiFetch("/game/status");
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to get game status");
  return data;
}

export async function getGameHistory() {
  const res = await apiFetch("/game/history");
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to get history");
  return data;
}

// ─── Admin API ──────────────────────────────────────────────

export async function getDailyReport(date?: string) {
  const query = date ? `?date=${date}` : "";
  const res = await apiFetch(`/admin/reports/daily${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to get daily report");
  return data;
}

export async function getUserReport(userId: number, date?: string) {
  const query = date ? `?date=${date}` : "";
  const res = await apiFetch(`/admin/reports/user/${userId}${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to get user report");
  return data;
}

export async function getUsers() {
  const res = await apiFetch("/admin/users");
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to get users");
  return data;
}
