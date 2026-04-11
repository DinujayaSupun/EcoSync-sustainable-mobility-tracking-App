import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import TripAchievements from "../TripAchievements";
import API from "../../api/axios";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Achievement User" },
    logout: vi.fn(),
  }),
}));

vi.mock("../../components/common/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("../../components/common/UserNavbar", () => ({
  default: () => <div>User Navbar</div>,
}));

vi.mock("../../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("TripAchievements page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads paginated achievement history", async () => {
    API.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              _id: "e1",
              title: "Badge Earned: Starter",
              message: "First achievement",
              icon: "workspace_premium",
              type: "BADGE_EARNED",
              createdAt: "2026-04-11T10:00:00.000Z",
            },
          ],
          hasMore: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              _id: "e2",
              title: "Challenge Completed",
              message: "Challenge done",
              icon: "emoji_events",
              type: "CHALLENGE_COMPLETED",
              createdAt: "2026-04-11T11:00:00.000Z",
            },
          ],
          hasMore: false,
        },
      });

    render(
      <MemoryRouter>
        <TripAchievements />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Stored Achievement History/i)).toBeInTheDocument();
    expect(screen.getByText("Badge Earned: Starter")).toBeInTheDocument();
    expect(screen.getByText("Challenge Completed")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    await waitFor(() => {
      expect(API.get).toHaveBeenNthCalledWith(1, "/achievements/my?limit=100&page=1");
      expect(API.get).toHaveBeenNthCalledWith(2, "/achievements/my?limit=100&page=2");
    });
  });

  it("shows error when achievement fetch fails", async () => {
    API.get.mockRejectedValueOnce({
      response: { data: { message: "Failed to load achievement history." } },
    });

    render(
      <MemoryRouter>
        <TripAchievements />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Failed to load achievement history."),
    ).toBeInTheDocument();
  });
});