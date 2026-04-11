import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import WeatherSuggestion from "../smartCommute/WeatherSuggestion";
import { weatherAPI } from "../../api/smartCommute";

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
    user: { _id: "u1", name: "Weather User" },
    logout: vi.fn(),
  }),
}));

vi.mock("../../components/common/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("../../components/common/UserNavbar", () => ({
  default: () => <div>User Navbar</div>,
}));

vi.mock("../../components/CommuteMap", () => ({
  default: () => <div>Commute Map</div>,
}));

vi.mock("../../components/LocationAutocomplete", () => ({
  default: ({ name, value, onChange, placeholder, label }) => (
    <div>
      {label ? <label>{label}</label> : null}
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  ),
}));

vi.mock("../../api/smartCommute", () => ({
  weatherAPI: {
    createSuggestion: vi.fn(),
    getSuggestions: vi.fn(),
    getCurrentWeather: vi.fn(),
    getForecast: vi.fn(),
    deleteSuggestion: vi.fn(),
  },
}));

describe("WeatherSuggestion page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn().mockReturnValue(true);

    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success) =>
          success({ coords: { latitude: 6.9271, longitude: 79.8612 } }),
      },
    });

    weatherAPI.getSuggestions.mockResolvedValue({
      data: {
        suggestions: [
          {
            _id: "s1",
            origin: "Colombo",
            destination: "Kandy",
            weatherCondition: "Clear",
            suggestedTransport: "Bus",
            distance: 6.2,
            createdAt: "2026-04-11T10:00:00.000Z",
          },
        ],
      },
    });

    weatherAPI.getCurrentWeather.mockResolvedValue({
      data: {
        weatherCondition: "Clear",
        suggestedTransport: "Bus",
        temperature: 31,
        humidity: 70,
        description: "clear sky",
        windSpeed: 3,
      },
    });

    weatherAPI.getForecast.mockResolvedValue({
      data: {
        hourly: [{ time: "2026-04-11 10:00:00", temp: 31, precipitation: 5, windKmh: 12, timeLabel: "10:00" }],
        daily: [],
      },
    });

    weatherAPI.createSuggestion.mockResolvedValue({
      data: {
        weatherLog: {
          weatherCondition: "Rain",
          suggestedTransport: "Bus",
          temperature: 27,
          humidity: 88,
          adjustmentReason: "weather-priority",
          distanceKm: 6.1,
        },
      },
    });
  });

  it("loads page, local weather, and recent suggestions", async () => {
    render(
      <MemoryRouter>
        <WeatherSuggestion />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/Weather-Based Transport Suggestion/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/My Location Weather/i)).toBeInTheDocument();
    expect(screen.getByText(/Recent Suggestions/i)).toBeInTheDocument();
    expect(await screen.findByText("Colombo")).toBeInTheDocument();

    await waitFor(() => {
      expect(weatherAPI.getSuggestions).toHaveBeenCalledWith("u1", {
        limit: 10,
      });
      expect(weatherAPI.getCurrentWeather).toHaveBeenCalled();
      expect(weatherAPI.getForecast).toHaveBeenCalled();
    });
  });

  it("submits form and saves suggestion", async () => {
    render(
      <MemoryRouter>
        <WeatherSuggestion />
      </MemoryRouter>,
    );

    const originInput = await screen.findByPlaceholderText(
      /start typing your origin location/i,
    );
    const destinationInput = screen.getByPlaceholderText(
      /start typing your destination/i,
    );

    fireEvent.change(originInput, { target: { value: "Colombo" } });
    fireEvent.change(destinationInput, { target: { value: "Kandy" } });

    fireEvent.click(
      screen.getByRole("button", { name: /Get Suggestion & Save/i }),
    );

    await waitFor(() => {
      expect(weatherAPI.createSuggestion).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "u1",
          origin: "Colombo",
          destination: "Kandy",
        }),
      );
    });
  });

  it("runs quick weather check for origin", async () => {
    render(
      <MemoryRouter>
        <WeatherSuggestion />
      </MemoryRouter>,
    );

    const originInput = await screen.findByPlaceholderText(
      /start typing your origin location/i,
    );
    fireEvent.change(originInput, { target: { value: "Colombo" } });

    fireEvent.click(screen.getByRole("button", { name: /Quick Check/i }));

    await waitFor(() => {
      expect(weatherAPI.getCurrentWeather).toHaveBeenCalledWith(
        "Colombo",
        expect.any(Object),
      );
    });
  });
});