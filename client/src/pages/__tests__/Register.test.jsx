import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import Register from "../Register";

const mockNavigate = vi.fn();
const mockRegister = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

describe("Register page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillValidForm = () => {
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "test.user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });
  };

  it("disables submit when passwords do not match", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "test.user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "different123" },
    });

    const submitButton = screen.getByRole("button", { name: /create account/i });
    expect(submitButton).toBeDisabled();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("submits valid registration and navigates to login", async () => {
    mockRegister.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Test User",
        email: "test.user@example.com",
        password: "password123",
        faculty: undefined,
      });
      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        replace: true,
        state: { message: "Registration successful. Please login to continue." },
      });
    });
  });

  it("shows API error when registration fails", async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { message: "Email already exists" } },
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Email already exists")).toBeInTheDocument();
  });
});