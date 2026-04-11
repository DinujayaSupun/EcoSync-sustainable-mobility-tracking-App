import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Leaderboard from "../Leaderboard";
import { LeaderboardAPI } from "../../api/leaderboard.api";

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../api/leaderboard.api", () => ({
  LeaderboardAPI: {
    getLeaderboard: vi.fn(),
  },
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Leaderboard User" },
    logout: vi.fn(),
  }),
}));

vi.mock("../../context/CommuteContext", () => ({
  useCommute: () => ({ refreshTrigger: 0 }),
}));

vi.mock("../../hooks/useGamificationToast", () => ({
  useGamificationToast: () => ({
    toast: null,
    showToast: mockShowToast,
  }),
}));

vi.mock("../../components/common/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("../../components/common/UserNavbar", () => ({
  default: () => <div>User Navbar</div>,
}));

vi.mock("../../components/common/GamificationToast", () => ({
  default: () => null,
}));

vi.mock("html2pdf.js", () => ({
  default: () => ({
    set: () => ({
      from: () => ({
        save: vi.fn(),
      }),
    }),
  }),
}));

describe("Leaderboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays leaderboard entries", async () => {
    LeaderboardAPI.getLeaderboard.mockResolvedValueOnce({
      success: true,
      data: [
        {
          rank: 1,
          userId: "u1",
          name: "Alice",
          tripCount: 5,
          totalDistanceKm: 25,
          totalCo2Saved: 5.2,
          hybridScore: 92.4,
          activeDays: 4,
          co2PerKm: 0.208,
          title: "Weekly Hybrid Champion",
        },
      ],
      meta: {
        me: { rank: 1 },
        eligibility: {
          hybrid: { minDistanceKm: 3, minActiveDays: 1 },
          efficiency: { minDistanceKm: 5, minActiveDays: 1 },
        },
      },
    });

    render(
      <MemoryRouter>
        <Leaderboard />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText(/your rank in this board: #1/i)).toBeInTheDocument();
    expect(screen.getByText(/weekly hybrid champion/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(LeaderboardAPI.getLeaderboard).toHaveBeenCalledWith(
        "weekly",
        "hybrid",
      );
    });
  });

  it("switches period and board and reloads leaderboard", async () => {
    LeaderboardAPI.getLeaderboard.mockResolvedValue({
      success: true,
      data: [],
      meta: {
        eligibility: {
          hybrid: { minDistanceKm: 3, minActiveDays: 1 },
          efficiency: { minDistanceKm: 5, minActiveDays: 1 },
        },
      },
    });

    render(
      <MemoryRouter>
        <Leaderboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(LeaderboardAPI.getLeaderboard).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Daily" }));
    fireEvent.click(screen.getByRole("button", { name: "Impact" }));

    await waitFor(() => {
      expect(LeaderboardAPI.getLeaderboard).toHaveBeenLastCalledWith(
        "daily",
        "impact",
      );
    });
  });

  it("shows error state and retries successfully", async () => {
    LeaderboardAPI.getLeaderboard
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        success: true,
        data: [],
        meta: {
          eligibility: {
            hybrid: { minDistanceKm: 3, minActiveDays: 1 },
            efficiency: { minDistanceKm: 5, minActiveDays: 1 },
          },
        },
      });

    render(
      <MemoryRouter>
        <Leaderboard />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/couldn't load leaderboard/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(LeaderboardAPI.getLeaderboard).toHaveBeenCalledTimes(2);
      expect(mockShowToast).toHaveBeenCalledWith("success", "Leaderboard refreshed.");
    });
  });
});