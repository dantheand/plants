import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AuthFromFrontEnd } from "./Authenticator";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../context/Auth";

// Mocking GoogleOAuthProvider to bypass Google Login functionality
jest.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  GoogleLogin: () => <button>Login with Google</button>,
}));

describe("AuthFromFrontEnd", () => {
  it("renders the application logo and name", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthFromFrontEnd />
        </AuthProvider>
      </BrowserRouter>,
    );
    const logo = screen.getByAltText(/logo/i);
    const appName = screen.getByText(/Plantopticon/i); // Replace "Plantopticon" with your app's brand name if different

    expect(logo).toBeInTheDocument();
    expect(appName).toBeInTheDocument();
  });
});
