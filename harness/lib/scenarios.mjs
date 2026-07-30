import path from "node:path";

/**
 * Flipbook flows for screenshots / video.
 * Prefer data-harness and aria labels — no coordinate clicks.
 */

async function settle(page, ms = 400) {
  await page.waitForFunction(() => true, { timeout: 1 }).catch(() => {});
  await new Promise((r) => setTimeout(r, ms));
}

async function shot(page, outDir, name) {
  const filePath = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return { name, path: filePath };
}

async function gotoReady(page, url, marker) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(marker).first().waitFor({ state: "visible", timeout: 20_000 });
  await settle(page, 600);
}

async function enableSoundFromColophon(page) {
  // Storage flag + one gesture unlock. Don't fight the checkbox — Playwright's
  // checkbox actions are flaky when zustand hydrates async from localStorage.
  await page.evaluate(() => {
    try {
      localStorage.setItem("flipbook:sound", "1");
    } catch {
      /* ignore */
    }
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-harness="flipbook"]').first().waitFor({ state: "visible" });
  await settle(page, 600);
  // Trusted gesture — mouse.click avoids header hit-testing on the scroller box
  const box = await page.locator('[data-harness="flipbook"]').boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.65);
  } else {
    await page.mouse.click(195, 500);
  }
  await settle(page, 300);
  // Ensure store flag is on after hydrate
  await page.evaluate(() => {
    try {
      localStorage.setItem("flipbook:sound", "1");
    } catch {
      /* ignore */
    }
  });
}

async function flipThrough(page, count = 4) {
  const scroller = page.locator('[data-harness="scroller"]');
  await scroller.focus();
  for (let i = 0; i < count; i++) {
    await page.keyboard.press("ArrowDown");
    await settle(page, 350);
  }
}

/** Scroll to mid-hinge (~50% through a card) so rim/thickness is visible. */
async function scrollToMidFlip(page, cardIndex = 2) {
  await page.locator('[data-harness="scroller"]').evaluate((el, i) => {
    const h = el.clientHeight;
    // Mandatory snap would yank us to a settled page — kill it for the freeze.
    el.style.scrollSnapType = "none";
    el.scrollTop = i * h + h * 0.5;
  }, cardIndex);
  // rAF so Motion/CSS timeline paints the mid-hinge before we shoot
  await page.evaluate(
    () =>
      new Promise((r) => {
        requestAnimationFrame(() => requestAnimationFrame(r));
      }),
  );
  await settle(page, 120);
}

async function restoreSnap(page) {
  await page.locator('[data-harness="scroller"]').evaluate((el) => {
    el.style.scrollSnapType = "";
    const h = el.clientHeight || 1;
    el.scrollTop = Math.round(el.scrollTop / h) * h;
  });
  await settle(page, 400);
}

async function openSheet(page) {
  const grabber = page.getByRole("button", { name: /open contact sheet/i });
  await grabber.click();
  await page.locator('[data-harness="contact-sheet"]').waitFor({ state: "visible", timeout: 10_000 });
  await settle(page, 500);
}

/**
 * @returns {Promise<Array<{name: string, path: string}>>}
 */
export async function runScenarios(page, opts) {
  const { baseUrl, album, mode, viewportName, outDir, enableSound } = opts;
  const shots = [];
  const prefix = `${viewportName}`;

  // 1. Sleeve listing
  await gotoReady(page, `${baseUrl}/`, '[data-harness="sleeve-drawer"]');
  if (mode === "screenshots") {
    shots.push(await shot(page, outDir, `${prefix}-01-listing`));
  }

  // 2. Album flip — intro card
  await gotoReady(
    page,
    `${baseUrl}/album/${album}`,
    '[data-harness="flipbook"]',
  );
  await settle(page, 800);

  if (enableSound) {
    try {
      await enableSoundFromColophon(page);
    } catch (err) {
      console.warn("[harness] sound enable failed (continuing video):", err);
    }
  }

  if (mode === "screenshots") {
    shots.push(await shot(page, outDir, `${prefix}-02-intro`));
  }

  // 3. Flip a few cards to settled midroll
  await flipThrough(page, mode === "video" ? 6 : 3);
  if (mode === "screenshots") {
    shots.push(await shot(page, outDir, `${prefix}-03-midroll`));
  }

  // 3b. Mid-hinge freeze — rim / thickness must be reviewable
  if (mode === "screenshots") {
    await scrollToMidFlip(page, 2);
    shots.push(await shot(page, outDir, `${prefix}-03b-midflip`));
    await restoreSnap(page);
  }

  // Video: pause briefly mid-flip so recordings show the hinge
  if (mode === "video") {
    await scrollToMidFlip(page, 3);
    await settle(page, 700);
    await restoreSnap(page);
  }

  // 4. Contact sheet
  await openSheet(page);
  if (mode === "screenshots") {
    shots.push(await shot(page, outDir, `${prefix}-04-sheet`));
  }

  // Select a middle frame
  const frame = page.locator("[data-photo-index='3']");
  if (await frame.count()) {
    await frame.click();
    await settle(page, 700);
  } else {
    await page.keyboard.press("Escape");
    await settle(page, 400);
  }

  if (mode === "screenshots") {
    shots.push(await shot(page, outDir, `${prefix}-05-after-select`));
  }

  // 5. Studio placeholder
  if (mode === "screenshots") {
    await page.goto(`${baseUrl}/studio`, { waitUntil: "networkidle" });
    await settle(page, 400);
    shots.push(await shot(page, outDir, `${prefix}-06-studio`));
  }

  // Video: a little more flipping for length + sound events
  if (mode === "video") {
    await flipThrough(page, 4);
    await openSheet(page);
    await settle(page, 600);
    await page.keyboard.press("Escape");
    await settle(page, 500);
    await flipThrough(page, 2);
  }

  return shots;
}
