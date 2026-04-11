import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Challenges from "../Challenges";
import { ChallengesAPI } from "../../api/challenges.api";

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
    user: { name: "Test User" },
    logout: vi.fn(),
  }),
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

vi.mock("../../api/challenges.api", () => ({
  ChallengesAPI: {
    getChallenges: vi.fn(),
    getRecommendedChallenges: vi.fn(),
    getMyChallenges: vi.fn(),
    joinChallenge: vi.fn(),
    leaveChallenge: vi.fn(),
    updateProgress: vi.fn(),
  },
}));

describe("Challenges page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    ChallengesAPI.getChallenges.mockResolvedValue({
      total: 1,
      page: 1,
      pages: 1,
      challenges: [
        {
          _id: "c1",
          title: "Bike Week",
          tagline: "Ride more, emit less",
          description: "Complete bike commutes for one week",
          rewardPoints: 100,
          transportMode: "BIKE",
          difficulty: "EASY",
          emissionTarget: 3,
          durationDays: 7,
        },
      ],
    });

    ChallengesAPI.getRecommendedChallenges.mockResolvedValue([
      { _id: "r1", title: "Green Route" },
    ]);

    ChallengesAPI.getMyChallenges.mockResolvedValue([]);
    ChallengesAPI.joinChallenge.mockResolvedValue({ success: true });
  });

  it("loads and renders available challenges", async () => {
    render(
      <MemoryRouter>
        <Challenges />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Bike Week")).toBeInTheDocument();
    expect(screen.getByText("Green Route")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join challenge/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(ChallengesAPI.getChallenges).toHaveBeenCalled();
      expect(ChallengesAPI.getRecommendedChallenges).toHaveBeenCalled();
      expect(ChallengesAPI.getMyChallenges).toHaveBeenCalled();
    });
  });

  it("joins a challenge and refreshes data", async () => {
    render(
      <MemoryRouter>
        <Challenges />
      </MemoryRouter>,
    );

    const joinButton = await screen.findByRole("button", {
      name: /join challenge/i,
    });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(ChallengesAPI.joinChallenge).toHaveBeenCalledWith("c1");
      expect(ChallengesAPI.getChallenges).toHaveBeenCalledTimes(2);
      expect(ChallengesAPI.getRecommendedChallenges).toHaveBeenCalledTimes(2);
      expect(ChallengesAPI.getMyChallenges).toHaveBeenCalledTimes(2);
    });
  });
});