import { expect, test } from '@playwright/test'

async function onboard(page: import('@playwright/test').Page, nickname = 'Mila') {
  await page.goto('./')
  await page.getByRole('button', { name: /Postavi BabyCheck/ }).click()
  if (nickname) await page.getByLabel(/Nadimak/).fill(nickname)
  await page.getByLabel('Datum rođenja').fill('2026-04-01')
  await page.getByRole('button', { name: /Dalje/ }).click()
  await page.getByLabel(/Razumijem ograničenja/).check()
  await page.getByRole('button', { name: /Započni/ }).click()
}

test('tracks sleep and a meal in the streamlined dashboard', async ({ page }) => {
  await onboard(page)
  await expect(page.getByRole('heading', { name: 'Mila danas' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Osobni ritam' })).toBeVisible()
  await page.getByRole('button', { name: /Spavanje jedan dodir/ }).click()
  await page.getByRole('button', { name: 'Beba sada spava' }).last().click()
  await expect(page.getByText('TRENUTAČNO SPAVA')).toBeVisible()
  await page.getByRole('button', { name: /Obrok dojenje/ }).click()
  await page.getByRole('button', { name: 'Bočica', exact: true }).click()
  await page.getByLabel(/Količina/).fill('120')
  await page.getByRole('button', { name: 'Spremi obrok' }).click()
  await expect(page.getByText('Bočica').last()).toBeVisible()
})

test('persists profile and records after reload', async ({ page }) => {
  await onboard(page)
  await page.getByRole('button', { name: /Obrok dojenje/ }).click()
  await page.getByRole('button', { name: 'Spremi obrok' }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mila danas' })).toBeVisible()
  await expect(page.getByText(/prije/).last()).toBeVisible()
})

test('is installable, private at runtime and reloads offline', async ({
  page,
  context,
  browserName,
}) => {
  const external: string[] = []
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173')) external.push(request.url())
  })
  await page.goto('./')
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!
    const response = await fetch(link.href)
    return { type: response.headers.get('content-type'), body: await response.json() }
  })
  expect(manifest.type).toContain('application/manifest+json')
  expect(manifest.body.description).toContain('sna i obroka')
  expect(external).toEqual([])
  await onboard(page)
  if (browserName === 'chromium') {
    await page.setViewportSize({ width: 320, height: 700 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Mila danas' })).toBeVisible()
  }
})
