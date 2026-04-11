import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Reports from "../Reports";
import API from "../../api/axios";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../utils/adminSettings", () => ({
  getDefaultReportDateRange: () => ({
    startDate: "2026-04-01",
    endDate: "2026-04-30",
  }),
}));

vi.mock("../../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
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

vi.mock("lucide-react", () => {
  const Icon = () => <span aria-hidden="true">icon</span>;
  return {
    FileText: Icon,
    Download: Icon,
    Calendar: Icon,
    TrendingUp: Icon,
    Users: Icon,
    MapPin: Icon,
    ArrowLeft: Icon,
    Filter: Icon,
    BarChart3: Icon,
    Award: Icon,
    Leaf: Icon,
    Mail: Icon,
    Sparkles: Icon,
  };
});

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const mockReportData = {
  summary: {
    totalTrips: 20,
    totalCO2Saved: 45.5,
    totalDistance: 230,
    uniqueUsers: 8,
  },
  transportBreakdown: [
    { mode: "Bus", count: 8, co2Saved: 16.2, distance: 90 },
  ],
  dailyTrends: [{ date: "2026-04-10", co2Saved: 2.3 }],
  facultyStats: [
    { faculty: "Engineering", users: 4, trips: 10, co2Saved: 20.1, distance: 120 },
  ],
  topUsers: [
    {
      name: "Alice",
      email: "alice@test.com",
      faculty: "Engineering",
      co2Saved: 10.1,
      trips: 5,
      distance: 40,
    },
  ],
};

describe("Reports page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();

    API.get.mockResolvedValue({
      data: {
        success: true,
        reportData: mockReportData,
      },
    });

    API.post.mockResolvedValue({
      data: {
        success: true,
        insights: "1. Key Trends\n- Transport shifted to bus.",
        dataSummary: {
          totalTrips: 20,
          totalCO2Saved: 45.5,
          uniqueUsers: 8,
          avgCO2PerTrip: 2.27,
        },
      },
    });
  });

  it("loads report data on first render", async () => {
    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Sustainability Reports")).toBeInTheDocument();
    expect(screen.getByText("45.5 kg")).toBeInTheDocument();
    expect(screen.getByText("Faculty Performance")).toBeInTheDocument();

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith(
        "/admin/report?startDate=2026-04-01&endDate=2026-04-30",
      );
    });
  });

  it("applies filters and requests filtered report", async () => {
    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>,
    );

    await screen.findByText("Sustainability Reports");

    fireEvent.change(screen.getByPlaceholderText(/e.g., computing/i), {
      target: { value: "Engineering" },
    });

    fireEvent.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      expect(API.get).toHaveBeenLastCalledWith(
        "/admin/report?startDate=2026-04-01&endDate=2026-04-30&faculty=Engineering",
      );
    });
  });

  it("opens AI insights modal after successful generation", async () => {
    render(
      <MemoryRouter>
        <Reports />
      </MemoryRouter>,
    );

    await screen.findByText("Sustainability Reports");

    fireEvent.click(screen.getByRole("button", { name: /ai insights/i }));

    expect(await screen.findByText(/AI-Powered Insights/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith(
        "/admin/ai-insights?startDate=2026-04-01&endDate=2026-04-30",
      );
      expect(screen.getByText("Key Trends")).toBeInTheDocument();
    });
  });
});