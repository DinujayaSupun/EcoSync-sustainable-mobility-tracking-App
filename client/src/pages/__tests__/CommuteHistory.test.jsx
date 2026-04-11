import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import CommuteHistory from "../CommuteHistory";
import API from "../../api/axios";

const mockNavigate = vi.fn();
const mockOnCommuteLogged = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { name: "User" }, logout: vi.fn() }),
}));

vi.mock("../../context/CommuteContext", () => ({
  useCommute: () => ({ refreshTrigger: 0, onCommuteLogged: mockOnCommuteLogged }),
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
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const sampleTrips = [
  {
    _id: "t1",
    createdAt: "2026-04-11T09:00:00.000Z",
    startLocation: "Hostel",
    destination: "Faculty",
    transportType: "Car",
    distance: 10,
    duration: 20,
    emissionEstimate: 1.92,
  },
];

describe("CommuteHistory page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    API.get.mockResolvedValue({
      data: {
        success: true,
        data: sampleTrips,
      },
    });
  });

  it("loads and displays trip history", async () => {
    render(
      <MemoryRouter>
        <CommuteHistory />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Trip History")).toBeInTheDocument();
    expect(screen.getByText(/hostel/i)).toBeInTheDocument();
    expect(screen.getByText(/faculty/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.92 kg/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith("/commute/history");
    });
  });

  it("updates transport type from edit modal", async () => {
    API.put.mockResolvedValue({
      data: {
        data: {
          ...sampleTrips[0],
          transportType: "Bus",
          emissionEstimate: 1.05,
        },
      },
    });

    render(
      <MemoryRouter>
        <CommuteHistory />
      </MemoryRouter>,
    );

    const editButton = await screen.findByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    fireEvent.click(screen.getByRole("button", { name: /bus/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith("/commute/t1", {
        transportType: "Bus",
      });
      expect(mockOnCommuteLogged).toHaveBeenCalled();
    });
  });

  it("deletes a trip from confirmation modal", async () => {
    API.delete.mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <CommuteHistory />
      </MemoryRouter>,
    );

    const deleteButton = await screen.findByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    fireEvent.click(screen.getByRole("button", { name: /yes, delete/i }));

    await waitFor(() => {
      expect(API.delete).toHaveBeenCalledWith("/commute/t1");
      expect(mockOnCommuteLogged).toHaveBeenCalledWith({ action: "deleted" });
    });
  });
});