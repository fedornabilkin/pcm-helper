import {expect, test, type Page} from '@playwright/test'

// Граф D3 и импорт требуют отдельного браузерного прогона, поэтому этот набор помечен как тяжёлый.
test.describe('@heavy Мымра: критические сценарии', () => {

const seededNode = {
  id: 1,
  uid: 'test-contact-1',
  name: 'Тестовый контакт',
  description: '',
  facts: [],
  tags: [],
  x: 340,
  y: 260,
  fixed: true,
  fx: 340,
  fy: 260,
  r: 24,
  fill: '#479df8',
  stroke: '#479df8',
  strokeWidth: 2,
}

const importedNetworkFile = {
  meta: {
    schemaVersion: 2,
    version: '1.0.0',
    exportedAt: '2026-07-20T09:00:00.000Z',
    networkName: 'Импортируемая сеть',
  },
  payload: {
    nodes: [{...seededNode, id: 2, uid: 'imported-contact-2', name: 'Импортированный контакт'}],
    links: [],
    circles: [],
    tags: [],
  },
}

const prepareMymra = async (page: Page, options: {premium?: boolean; backupDate?: string} = {}): Promise<void> => {
  await page.addInitScript(({premium, backupDate}) => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('0-graph_nodes', JSON.stringify([{
      id: 1,
      uid: 'test-contact-1',
      name: 'Тестовый контакт',
      description: '',
      facts: [],
      tags: [],
      x: 340,
      y: 260,
      fixed: true,
      fx: 340,
      fy: 260,
      r: 24,
      fill: '#479df8',
      stroke: '#479df8',
      strokeWidth: 2,
    }]))
    localStorage.setItem('0-graph_links', '[]')
    localStorage.setItem('0-graph_funcCircles', '[]')
    localStorage.setItem('0-graph_tags', '[]')

    if (premium) {
      sessionStorage.setItem('pcm-premium-access', 'active')
    }
    if (backupDate) {
      localStorage.setItem('pcm-helper-network-0-last-exported-at', backupDate)
    }
  }, options)

  await page.goto('/mymra-creation')
}

const openTransfer = async (page: Page): Promise<void> => {
  await page.locator('button[title="Импорт и экспорт сети"]').click()
  await expect(page.getByText('Импорт и экспорт сети')).toBeVisible()
}

test('показывает и скрывает tooltip контакта', async ({page}) => {
  await prepareMymra(page)

  const node = page.locator('#nw-graph .nodes circle')
  const tooltip = page.locator('#nw-graph .tooltip')
  await expect(node).toBeVisible()
  await node.hover({force: true})
  await expect(tooltip).toContainText('Тестовый контакт')
  await expect(tooltip).toBeVisible()

  await page.mouse.move(4, 4)
  await expect(tooltip).toBeHidden()
})

test('экспорт обновляет отметку резервной копии', async ({page}) => {
  await prepareMymra(page)
  await expect(page.getByText('Сделайте первую резервную копию сети.')).toBeVisible()

  await openTransfer(page)
  await expect(page.getByText('Копию сети ещё не скачивали.')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', {name: 'Экспорт'}).click()
  await (await download).cancel()

  await openTransfer(page)
  await expect(page.getByText(/Последняя копия:/)).toBeVisible()
})

test('напоминает о копии спустя три дня', async ({page}) => {
  await prepareMymra(page, {backupDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()})
  await expect(page.getByText(/Пора скачать свежую/)).toBeVisible()
})

test('не напоминает о свежей копии', async ({page}) => {
  await prepareMymra(page, {backupDate: new Date().toISOString()})
  await expect(page.getByText(/Пора скачать свежую/)).toBeHidden()
})

test('импорт с заменой показывает предпросмотр', async ({page}) => {
  await prepareMymra(page)
  await openTransfer(page)
  await expect(page.getByText('Полностью заменит данные текущей сети.')).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles({
    name: 'network.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importedNetworkFile)),
  })
  await expect(page.getByText('Текущая сеть будет заменена.')).toBeVisible()
  await expect(page.getByRole('button', {name: 'Заменить данные'})).toBeEnabled()
})

test('Premium открывает сценарий объединения', async ({page}) => {
  await prepareMymra(page, {premium: true})
  await openTransfer(page)
  await page.getByLabel('Объединить').check()

  await page.locator('input[type="file"]').setInputFiles({
    name: 'network.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importedNetworkFile)),
  })
  await expect(page.getByText(/Нажмите вариант слева или справа/)).toBeVisible()
  await expect(page.getByRole('button', {name: 'Объединить данные'})).toBeEnabled()
})
})
