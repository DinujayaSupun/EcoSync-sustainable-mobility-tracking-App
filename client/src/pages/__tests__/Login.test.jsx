import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import Login from "../login";
import { AuthContext } from "../../context/AuthContext";

describe("Login page", () => {
  const renderLogin = (loginMock, initialEntry = "/login") =>
    render(
      <AuthContext.Provider value={{ login: loginMock }}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

  it("shows success message from navigation state", async () => {
    const loginMock = vi.fn();

    renderLogin(loginMock, {
      pathname: "/login",
      state: { message: "Registration successful. Please login to continue." },
    });

    expect(
      screen.getByText("Registration successful. Please login to continue."),
    ).toBeInTheDocument();
  });

  it("submits credentials and calls login", async () => {
    const loginMock = vi.fn().mockResolvedValueOnce();
    renderLogin(loginMock);

    fireEvent.change(screen.getByPlaceholderText(/sliit email/i), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("user@test.com", "password123");
    });
  });

  it("shows API error when login fails", async () => {
    const loginMock = vi.fn().mockRejectedValueOnce({
      response: { data: { message: "Invalid email or password" } },
    });
    renderLogin(loginMock);

    fireEvent.change(screen.getByPlaceholderText(/sliit email/i), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });
});