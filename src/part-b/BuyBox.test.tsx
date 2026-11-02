import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BuyBox } from "./BuyBox";

afterEach(cleanup);

const cart = () => screen.getByRole("button", { name: /^Add to cart/ });
const finePrint = () => screen.queryByText(/Your subscription renews/);

test("subscribe is selected by default with the subscription price and fine print", () => {
  render(<BuyBox />);
  expect((screen.getByRole("radio", { name: /Subscribe/ }) as HTMLInputElement).checked).toBe(true);
  expect(cart().getAttribute("aria-label")).toBe("Add to cart, $25.46");
  expect(finePrint()?.textContent).toContain("every 30 days at $25.46");
});

test("one-time selected: one-time price, no frequency, no perks, no fine print", () => {
  const { container } = render(<BuyBox />);
  fireEvent.click(screen.getByRole("radio", { name: /One-time/ }));

  expect(cart().getAttribute("aria-label")).toBe("Add to cart, $29.95");
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.queryByText("Free shipping on every order")).toBeNull();
  expect(finePrint()).toBeNull();
  const selected = container.querySelectorAll(".bb-option.is-selected");
  expect(selected).toHaveLength(1);
  expect(selected[0].textContent).toContain("One-time purchase");
});

test("switching back to subscribe restores the subscription state", () => {
  render(<BuyBox />);
  fireEvent.click(screen.getByRole("radio", { name: /One-time/ }));
  fireEvent.click(screen.getByRole("radio", { name: /Subscribe/ }));
  expect(screen.getByRole("combobox")).toBeTruthy();
  expect(cart().getAttribute("aria-label")).toBe("Add to cart, $25.46");
});

test("dropdown lists every frequency and the choice reaches the fine print without changing the price", () => {
  render(<BuyBox />);
  const select = screen.getByRole("combobox", { name: "Delivered every" }) as HTMLSelectElement;
  expect([...select.options].map((o) => o.value)).toEqual(["30 days", "60 days", "90 days"]);

  fireEvent.change(select, { target: { value: "90 days" } });
  expect(select.value).toBe("90 days");
  expect(finePrint()?.textContent).toContain("every 90 days at $25.46");
});

test("quantity stays within 1–10 and multiplies the total", () => {
  render(<BuyBox />);
  const minus = screen.getByRole("button", { name: "Decrease quantity" }) as HTMLButtonElement;
  const plus = screen.getByRole("button", { name: "Increase quantity" }) as HTMLButtonElement;
  expect(minus.disabled).toBe(true);

  for (let i = 0; i < 12; i++) fireEvent.click(plus);
  expect(screen.getByRole("status").textContent).toBe("10");
  expect(plus.disabled).toBe(true);
  expect(cart().getAttribute("aria-label")).toBe("Add to cart, $254.60");
  expect(finePrint()?.textContent).toContain("at $254.60");

  fireEvent.click(screen.getByRole("radio", { name: /One-time/ }));
  expect(cart().getAttribute("aria-label")).toBe("Add to cart, $299.50");
});
