import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Badges from "../Badges";
import { BadgesAPI } from "../../api/badges.api";

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Badge User" },
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

vi.mock("../../components/gamification/BadgeCard", () => ({
  default: ({ badge, earned }) => (
    <div>
      <span>{badge.name}</span>
      <span>{earned ? "Earned" : "Locked"}</span>
    </div>
  ),
}));

vi.mock("../../api/badges.api", () => ({
  BadgesAPI: {
    getAllBadges: vi.fn(),
    getMyEarnedBadges: vi.fn(),
  },
}));

describe("Badges page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    BadgesAPI.getAllBadges.mockResolvedValue({
      data: [
        {
          _id: "b1",
          name: "Trip Starter",
          type: "TRIP_COUNT",
          description: "Complete first trip",
        },
        {
          _id: "b2",
          name: "Distance Hero",
          type: "TOTAL_DISTANCE",
          description: "Reach 50km",
        },
      ],
    });

    BadgesAPI.getMyEarnedBadges.mockResolvedValue({
      data: [{ badgeId: { _id: "b1" } }],
    });
  });

  it("loads and renders all badges with earned status", async () => {
    render(
      <MemoryRouter>
        <Badges />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Trip Starter")).toBeInTheDocument();
    expect(screen.getByText("Distance Hero")).toBeInTheDocument();
    expect(screen.getByText("Total Badges")).toBeInTheDocument();
    expect(screen.getByText("Completion Rate")).toBeInTheDocument();

    await waitFor(() => {
      expect(BadgesAPI.getAllBadges).toHaveBeenCalled();
      expect(BadgesAPI.getMyEarnedBadges).toHaveBeenCalled();
    });
  });

  it("filters to my badges and by type", async () => {
    render(
      <MemoryRouter>
        <Badges />
      </MemoryRouter>,
    );

    await screen.findByText("Trip Starter");

    fireEvent.click(screen.getByRole("button", { name: /my badges/i }));

    await waitFor(() => {
      expect(screen.getByText("Trip Starter")).toBeInTheDocument();
      expect(screen.queryByText("Distance Hero")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /all badges/i }));
    fireEvent.click(screen.getByRole("button", { name: /total distance/i }));

    await waitFor(() => {
      expect(screen.queryByText("Trip Starter")).not.toBeInTheDocument();
      expect(screen.getByText("Distance Hero")).toBeInTheDocument();
    });
  });

  it("shows error state and retries", async () => {
    BadgesAPI.getAllBadges
      .mockRejectedValueOnce(new Error("Load failed"))
      .mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Badges />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/couldn't load badges/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(BadgesAPI.getAllBadges).toHaveBeenCalledTimes(2);
      expect(mockShowToast).toHaveBeenCalledWith("success", "Badges refreshed.");
    });
  });
});