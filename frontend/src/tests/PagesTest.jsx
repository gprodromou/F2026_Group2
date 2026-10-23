import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Landing from "../pages/Landing";
import NotFound from "../pages/NotFound";

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