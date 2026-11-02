import { expect, test, type Page } from "@playwright/test";

const GREEN = "rgb(23, 64, 47)";

async function open(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto("/?part=b");
  await page.locator(".bb-media img").waitFor();
}

async function layout(page: Page) {
  return page.evaluate(() => {
    const media = document.querySelector(".bb-media")!.getBoundingClientRect();
    const column = document.querySelector(".bb-media + div")!.getBoundingClientRect();
    const root = document.documentElement;
    return {
      scrollbar: window.innerWidth - root.clientWidth,
      sideBySide: column.left >= media.right && column.top < media.bottom,
      horizontalOverflow: root.scrollWidth > root.clientWidth,
    };
  });
}

test.describe("breakpoint", () => {
  test("1200px window with a visible scrollbar keeps the two-column layout", async ({ page, browserName }) => {
    // Playwright's Firefox only draws overlay scrollbars (0px wide), so it cannot reproduce this case.
    test.skip(browserName === "firefox", "no classic scrollbar in Playwright Firefox");
    await open(page, 1200, 700); // short enough that the page scrolls
    const result = await layout(page);
    expect(result.scrollbar).toBeGreaterThan(0);
    expect(result.sideBySide).toBe(true);
    expect(result.horizontalOverflow).toBe(false);
  });

  test("1200px window without a scrollbar keeps the two-column layout", async ({ page }) => {
    await open(page, 1200, 1400);
    const result = await layout(page);
    expect(result.scrollbar).toBe(0);
    expect(result.sideBySide).toBe(true);
  });

  for (const width of [1199, 768, 375, 320]) {
    test(`${width}px stacks with no horizontal scroll, even at quantity 10`, async ({ page }) => {
      await open(page, width, 800);
      const plus = page.getByRole("button", { name: "Increase quantity" });
      for (let i = 0; i < 9; i++) await plus.click();
      const result = await layout(page);
      expect(result.sideBySide).toBe(false);
      expect(result.horizontalOverflow).toBe(false);
    });
  }
});

test.describe("states with no reference", () => {
  test.beforeEach(({ page }) => open(page, 1280, 1000));

  test("one-time selected moves the selected style and hides subscription details", async ({ page }) => {
    await page.getByRole("radio", { name: /One-time/ }).check();
    const oneTime = page.locator(".bb-option").first();
    await expect(oneTime).toHaveClass(/is-selected/);
    await expect(oneTime).toHaveCSS("border-top-color", GREEN);
    await expect(page.locator(".bb-option").nth(1)).not.toHaveClass(/is-selected/);
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(page.locator(".bb-fine-print")).toHaveCount(0);
    await expect(page.locator(".bb-cart")).toHaveText(/\$29\.95/);
  });

  test("hover darkens the cart button", async ({ page }) => {
    const cart = page.locator(".bb-cart");
    await expect(cart).toHaveCSS("background-color", GREEN);
    await cart.hover();
    await expect(cart).toHaveCSS("background-color", "rgb(17, 51, 31)");
  });

  test("keyboard focus shows a ring on every control", async ({ page }) => {
    const ring = (selector: string, pseudo?: string) =>
      page.evaluate(
        ([s, p]) => {
          const style = getComputedStyle(document.querySelector(s!)!, p);
          return `${style.outlineStyle} ${style.outlineWidth}`;
        },
        [selector, pseudo] as const,
      );

    await page.getByRole("link", { name: "2,316 reviews" }).focus();
    await page.keyboard.press("Tab"); // into the radio group (checked = Subscribe)
    expect(await ring(".bb-option:nth-of-type(2)")).toBe("solid 2px");

    await page.keyboard.press("Tab");
    await expect(page.getByRole("combobox")).toBeFocused();
    expect(await ring(".bb-select", "::before")).toBe("solid 2px");

    await page.keyboard.press("Tab"); // decrease is disabled, so focus skips to increase
    await expect(page.getByRole("button", { name: "Increase quantity" })).toBeFocused();
    expect(await ring(".bb-quantity button:last-child")).toBe("solid 2px");

    await page.keyboard.press("Tab");
    await expect(page.locator(".bb-cart")).toBeFocused();
    expect(await ring(".bb-cart")).toBe("solid 2px");
  });

  test("arrow keys move between purchase options", async ({ page }) => {
    await page.getByRole("radio", { name: /Subscribe/ }).focus();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("radio", { name: /One-time/ })).toBeChecked();
  });

  test("dropdown: every frequency can be chosen and the 44px select stays clickable", async ({ page }) => {
    const select = page.getByRole("combobox", { name: "Delivered every" });
    expect((await select.boundingBox())!.height).toBe(44);
    for (const value of ["60 days", "90 days", "30 days"]) {
      await select.selectOption(value);
      await expect(page.locator(".bb-fine-print")).toContainText(`every ${value} at $25.46`);
      await expect(page.locator(".bb-cart")).toHaveText(/\$25\.46/);
    }
  });
});
