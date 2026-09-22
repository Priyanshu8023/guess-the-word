"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  isAuthenticated,
  getMe,
  getDailyReport,
  getUsers,
  getUserReport,
} from "@/lib/api";

interface DailyReportData {
  date: string;
  total_users: number;
  total_games: number;
  total_correct_guesses: number;
  total_incorrect: number;
}

interface UserData {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

interface UserReportData {
  date: string;
  user_id: number;
  username: string;
  number_of_words_tried: number;
  correct_guesses: number;
  words_tried: {
    word: string;
    status: string;
    attempts: number;
    guesses: { attempt: number; word: string; result: string[] }[];
  }[];
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Date selection
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Data
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userReport, setUserReport] = useState<UserReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Check if user is admin
    getMe().then((user) => {
      if (user.role !== "ADMIN") {
        router.push("/game");
        return;
      }
      loadData();
    });
  }, [router]);

  useEffect(() => {
    if (!loading) {
      loadDailyReport();
      if (selectedUser !== null) {
        loadUserReport(selectedUser);
      }
    }
  }, [selectedDate]);

  const loadData = async () => {
    try {
      await Promise.all([loadDailyReport(), loadUsers()]);
    } catch {
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  const loadDailyReport = async () => {
    try {
      const report = await getDailyReport(selectedDate);
      setDailyReport(report);
    } catch {
      console.error("Failed to load daily report");
    }
  };

  const loadUsers = async () => {
    try {
      const usersList = await getUsers();
      setUsers(usersList);
    } catch {
      console.error("Failed to load users");
    }
  };

  const loadUserReport = async (userId: number) => {
    setReportLoading(true);
    try {
      const report = await getUserReport(userId, selectedDate);
      setUserReport(report);
      setSelectedUser(userId);
    } catch {
      console.error("Failed to load user report");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading" style={{ flex: 1 }}>
          <div className="spinner"></div>
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />

      <div className="main-content" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            📊 Admin Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
            View game reports and user statistics
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Date Picker */}
        <div style={{ marginBottom: 24 }}>
          <label className="form-label">Select Date</label>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Daily Report Stats */}
        {dailyReport && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2>Daily Report — {dailyReport.date}</h2>
            </div>
            <div className="stat-cards">
              <div className="stat-card">
                <div className="stat-value">{dailyReport.total_users}</div>
                <div className="stat-label">Users Played</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dailyReport.total_games}</div>
                <div className="stat-label">Total Games</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {dailyReport.total_correct_guesses}
                </div>
                <div className="stat-label">Correct Guesses</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dailyReport.total_incorrect}</div>
                <div className="stat-label">Incorrect</div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2>Users</h2>
            <p>Click on a user to view their report</p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>
                      <span
                        className="navbar-role"
                        style={{ marginLeft: 0 }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => loadUserReport(u.id)}
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Report */}
        {reportLoading && (
          <div className="loading">
            <div className="spinner"></div>
            Loading user report...
          </div>
        )}

        {userReport && !reportLoading && (
          <div className="card">
            <div className="card-header">
              <h2>
                User Report — {userReport.username} ({userReport.date})
              </h2>
            </div>

            <div className="stat-cards" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-value">
                  {userReport.number_of_words_tried}
                </div>
                <div className="stat-label">Words Tried</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userReport.correct_guesses}</div>
                <div className="stat-label">Correct Guesses</div>
              </div>
            </div>

            {/* Games detail */}
            {userReport.words_tried.map((game, idx) => (
              <div
                key={idx}
                style={{
                  padding: "16px",
                  background: "var(--bg-primary)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    alignItems: "center",
                  }}
                >
                  <strong>Word: {game.word}</strong>
                  <span
                    className="game-badge"
                    style={{
                      background:
                        game.status === "WON"
                          ? "var(--accent-green-glow)"
                          : game.status === "LOST"
                          ? "rgba(248,113,113,0.15)"
                          : "var(--accent-purple-glow)",
                      color:
                        game.status === "WON"
                          ? "var(--accent-green)"
                          : game.status === "LOST"
                          ? "var(--accent-red)"
                          : "var(--accent-purple)",
                      borderColor:
                        game.status === "WON"
                          ? "rgba(74,222,128,0.3)"
                          : game.status === "LOST"
                          ? "rgba(248,113,113,0.3)"
                          : "rgba(167,139,250,0.3)",
                    }}
                  >
                    {game.status} ({game.attempts}/5 attempts)
                  </span>
                </div>

                {/* Show guesses as mini tiles */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {game.guesses.map((guess, gIdx) => (
                    <div key={gIdx} style={{ display: "flex", gap: 4 }}>
                      {guess.word.split("").map((letter, lIdx) => (
                        <div
                          key={lIdx}
                          className={`tile ${guess.result[lIdx]}`}
                          style={{
                            width: 36,
                            height: 36,
                            fontSize: "0.9rem",
                          }}
                        >
                          {letter}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {userReport.words_tried.length === 0 && (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>
                No games played on this date.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
