import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Landing from "../pages/Landing";
import NotFound from "../pages/NotFound";
import { AuthProvider } from "../state/AuthContext";

// A fake login token that AuthContext reads like a real one (signed in as a normal user).
function makeToken() {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payload = { user_id: 1, role: "user", exp: Math.floor(Date.now() / 1000) + 3600 };
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.fake-signature`;
}

// Forget the fake login after each test, so the other tests start signed out.
afterEach(() => {
  localStorage.clear();
});

test("landing page renders at the home route", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText("fit4you")).toBeInTheDocument();
  expect(screen.getByText("Create an account")).toBeInTheDocument();
  expect(screen.getByText("Log in")).toBeInTheDocument();
});

test("an unknown URL shows the not-found page", () => {
  render(
    <MemoryRouter initialEntries={["/this-page-does-not-exist"]}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText("Page not found")).toBeInTheDocument();
  expect(screen.getByText("Back to home")).toBeInTheDocument();
});

test("a signed-in user sees no sign-up or login links on the home page", () => {
  localStorage.setItem("token", makeToken());
  render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
  expect(screen.getByText("Welcome back!")).toBeInTheDocument();
  expect(screen.queryByText("Create an account")).toBeNull();
  expect(screen.queryByText("Log in")).toBeNull();
  expect(screen.queryByText("Register Here")).toBeNull();
});