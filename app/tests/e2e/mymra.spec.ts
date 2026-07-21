import {expect, test, type Page} from '@playwright/test'

// Граф D3 и импорт требуют отдельного браузерного прогона, поэтому этот набор помечен как тяжёлый.
test.describe('@heavy Мымра: критические сценарии', () => {

test('node search can receive focus and show contacts', async ({page}) => {
  await prepareMymra(page)

  const search = page.locator('.node-search input')
  await search.click()
  await expect(page.locator('.node-search-option')).toHaveCount(1)
  await page.locator('.node-search-option').click()
  await expect(page.locator('.node-control-panel')).toBeVisible()
})

test('node search highlights matching contacts', async ({page}) => {
  await prepareMymra(page)

  const search = page.locator('.node-search input')
  const node = page.locator('#nw-graph .nodes circle')
  const query = await page.evaluate(() => {
    const nodes = JSON.parse(localStorage.getItem('0-graph_nodes') ?? '[]') as Array<{name?: string}>
    return nodes[0]?.name?.slice(0, 2) ?? ''
  })

  await search.fill(query)
  await expect(node).toHaveClass(/is-search-highlighted/)
  await expect(node).toHaveCSS('animation-name', 'node-highlight-pulse')
  await expect(node).toHaveCSS('stroke', 'rgb(50, 115, 220)')
  await expect(node).toHaveCSS('stroke-width', /^(?:[5-9]|1[0-1])(?:\.\d+)?px$/)

  await page.locator('.node-search-option').click()
  await expect(node).not.toHaveClass(/is-search-highlighted/)
  await expect(page.locator('.node-control-panel')).toBeVisible()
})

test('selected tag highlights matching contacts', async ({page}) => {
  await prepareMymra(page, {
    nodeTags: [1],
    tags: [{id: 1, uid: 'test-tag-1', name: 'Focus'}],
  })

  const node = page.locator('#nw-graph .nodes circle')
  await page.locator('.info-actions > button').nth(5).click()
  await page.locator('.tag.is-hoverable').click()

  await expect(node).toHaveClass(/is-tag-highlighted/)
  await expect(node).toHaveCSS('animation-name', 'node-highlight-pulse')
  await expect(node).toHaveCSS('stroke', 'rgb(244, 183, 64)')
})

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

const prepareMymra = async (page: Page, options: {
  premium?: boolean;
  backupDate?: string;
  nodeTags?: number[];
  tags?: Array<Record<string, unknown>>;
} = {}): Promise<void> => {
  await page.addInitScript(({premium, backupDate, nodeTags, tags}) => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('0-graph_nodes', JSON.stringify([{
      id: 1,
      uid: 'test-contact-1',
      name: 'Тестовый контакт',
      description: '',
      facts: [],
      tags: nodeTags ?? [],
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
    localStorage.setItem('0-graph_tags', JSON.stringify(tags ?? []))

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
