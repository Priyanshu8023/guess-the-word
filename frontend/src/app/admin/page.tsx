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

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

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
      setError("Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  const loadDailyReport = async () => {
    try {
      const report = await getDailyReport(selectedDate);
      setDailyReport(report);
    } catch {
      /* silently fail — date might have no data */
    }
  };

  const loadUsers = async () => {
    try {
      const usersList = await getUsers();
      setUsers(usersList);
    } catch {
      /* silently fail */
    }
  };

  const loadUserReport = async (userId: number) => {
    setReportLoading(true);
    try {
      const report = await getUserReport(userId, selectedDate);
      setUserReport(report);
      setSelectedUser(userId);
    } catch {
      /* silently fail */
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="loading" style={{ flex: 1 }}>
          <div className="spinner" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />

      <div className="main main--wide">
        {/* Header + date picker on one line */}
        <div className="admin__header">
          <h1 className="admin__title">Reports</h1>
          <p className="admin__subtitle">
            Daily game statistics and per-user breakdowns.
          </p>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="admin__toolbar">
          <label htmlFor="report-date">Date</label>
          <input
            id="report-date"
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Daily stats */}
        {dailyReport && (
          <div className="section">
            <h2 className="section__title">
              Overview &mdash; {dailyReport.date}
            </h2>
            <div className="stats">
              <div className="stat">
                <div className="stat__value">{dailyReport.total_users}</div>
                <div className="stat__label">Players</div>
              </div>
              <div className="stat">
                <div className="stat__value">{dailyReport.total_games}</div>
                <div className="stat__label">Games</div>
              </div>
              <div className="stat">
                <div className="stat__value">
                  {dailyReport.total_correct_guesses}
                </div>
                <div className="stat__label">Won</div>
              </div>
              <div className="stat">
                <div className="stat__value">{dailyReport.total_incorrect}</div>
                <div className="stat__label">Lost</div>
              </div>
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="section">
          <h2 className="section__title">Users</h2>

          {users.length === 0 ? (
            <p className="empty">No users registered yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ color: "var(--text-3)" }}>{u.id}</td>
                      <td>{u.username}</td>
                      <td>
                        <span className="role-cell">{u.role}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => loadUserReport(u.id)}
                        >
                          View report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User report detail */}
        {reportLoading && (
          <div className="loading">
            <div className="spinner" />
            Loading report…
          </div>
        )}

        {userReport && !reportLoading && (
          <div className="section">
            <h2 className="section__title">
              {userReport.username} &mdash; {userReport.date}
            </h2>

            <div className="stats" style={{ marginBottom: "var(--sp-4)" }}>
              <div className="stat">
                <div className="stat__value">
                  {userReport.number_of_words_tried}
                </div>
                <div className="stat__label">Games</div>
              </div>
              <div className="stat">
                <div className="stat__value">{userReport.correct_guesses}</div>
                <div className="stat__label">Won</div>
              </div>
            </div>

            {userReport.words_tried.length === 0 ? (
              <p className="empty">No games played on this date.</p>
            ) : (
              userReport.words_tried.map((game, idx) => (
                <div key={idx} className="game-entry">
                  <div className="game-entry__header">
                    <span className="game-entry__word">{game.word}</span>
                    <span
                      className={`game-entry__status ${
                        game.status === "WON"
                          ? "game-entry__status--won"
                          : "game-entry__status--lost"
                      }`}
                    >
                      {game.status === "WON" ? "Won" : "Lost"} in{" "}
                      {game.attempts}/5
                    </span>
                  </div>

                  <div className="game-entry__grid">
                    {game.guesses.map((guess, gIdx) => (
                      <div key={gIdx} className="game-entry__row">
                        {guess.word.split("").map((letter, lIdx) => {
                          const colorMap: Record<string, string> = {
                            green: "mini-tile--correct",
                            orange: "mini-tile--present",
                            grey: "mini-tile--absent",
                          };
                          return (
                            <div
                              key={lIdx}
                              className={`mini-tile ${
                                colorMap[guess.result[lIdx]] || ""
                              }`}
                            >
                              {letter}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
