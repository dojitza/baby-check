import { expect, test } from '@playwright/test'

async function completeOnboarding(page: import('@playwright/test').Page, nickname = '') {
  await expect(page.getByRole('heading', { name: 'Upoznajte BabyCheck' })).toBeVisible()
  await page.getByRole('button', { name: /Postavi BabyCheck/ }).click()
  if (nickname) await page.getByLabel('Nadimak').fill(nickname)
  await page.getByLabel('Datum rođenja').fill('2026-04-01')
  await page.getByRole('button', { name: /Dalje/ }).click()
  await page.getByLabel('Razumijem ograničenja').check()
  await page.getByRole('button', { name: /Započni/ }).click()
}

test('onboards, records sleep and opens the fussy checklist', async ({ page }) => {
  await page.goto('./')
  await completeOnboarding(page, 'Mila')

  await expect(page.getByRole('heading', { name: 'Kako je Mila?' })).toBeVisible()
  await page.getByRole('button', { name: 'Spavanje pokreni ili unesi' }).click()
  await page.getByRole('button', { name: 'Beba sada spava' }).last().click()
  await expect(page.getByText('TRENUTAČNO SPAVA')).toBeVisible()

  await page.getByRole('button', { name: /Započni provjeru/ }).click()
  await expect(page.getByRole('heading', { name: 'Prvo provjerite znakove bolesti' })).toBeVisible()
  await expect(page.getByText('1 od')).toBeVisible()
})

test('persists the profile after reload', async ({ page }) => {
  await page.goto('./')
  await completeOnboarding(page)
  await expect(page.getByRole('button', { name: /Započni provjeru/ })).toBeVisible()
  await page.reload()
  await expect(page.getByText('BabyCheck').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Započni provjeru/ })).toBeVisible()
})

test('returns from urgent help to the same checklist progress', async ({ page }) => {
  await page.goto('./')
  await completeOnboarding(page)
  await page.getByRole('button', { name: /Započni provjeru/ }).click()
  await expect(page.getByText('1 od 11')).toBeVisible()
  await page
    .getByRole('dialog', { name: 'Beba je nemirna' })
    .getByRole('button', { name: /Otvori znakove za hitnu pomoć/ })
    .click()
  await expect(page.getByRole('heading', { name: 'Kada odmah tražiti pomoć' })).toBeVisible()
  await page.getByRole('button', { name: 'Zatvori' }).last().click()
  await expect(page.getByRole('heading', { name: 'Prvo provjerite znakove bolesti' })).toBeVisible()
  await expect(page.getByText('1 od 11')).toBeVisible()
})

test('is installable, private at runtime and reloads offline', async ({
  page,
  context,
  browserName,
}) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173')) externalRequests.push(request.url())
  })
  await page.goto('./')

  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (!link) throw new Error('Manifest link missing')
    const response = await fetch(link.href)
    return {
      contentType: response.headers.get('content-type'),
      body: await response.json(),
    }
  })
  expect(manifest.contentType).toContain('application/manifest+json')
  expect(manifest.body.scope).toBe('/baby-check/')
  expect(manifest.body.icons).toHaveLength(3)
  expect(externalRequests).toEqual([])

  await expect
    .poll(async () =>
      page.evaluate(async () =>
        (await navigator.serviceWorker.getRegistrations()).some((registration) =>
          registration.scope.endsWith('/baby-check/'),
        ),
      ),
    )
    .toBe(true)
  await completeOnboarding(page)

  if (browserName === 'chromium') {
    await page.setViewportSize({ width: 320, height: 700 })
    const size = await page.evaluate(() => ({
      width: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(size.scrollWidth).toBe(size.width)
  }

  if (browserName === 'chromium') {
    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /Započni provjeru/ })).toBeVisible()
  }
})
