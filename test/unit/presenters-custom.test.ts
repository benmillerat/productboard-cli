import { describe, expect, it } from 'vitest'

import { projectDetailFields, projectListRows } from '../../src/core/presenter.js'
import { objectivesPresenter } from '../../src/core/presenters/objectives.js'
import { productsPresenter } from '../../src/core/presenters/products.js'
import { releaseGroupsPresenter } from '../../src/core/presenters/release-groups.js'
import { releasesPresenter } from '../../src/core/presenters/releases.js'

function toFieldMap(fields: Array<{ label: string; value: string }>): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field.label, field.value]))
}

describe('session B follow-up presenters', () => {
  it('projects releases without nested JSON blobs', () => {
    const release = {
      id: 'rel_1',
      name: 'Now (Sample Release)',
      state: 'in-progress',
      description: '<p>Ship&nbsp;faster</p>',
      archived: false,
      timeframe: {
        startDate: 'none',
        endDate: 'none',
        granularity: 'none',
      },
      releaseGroup: {
        id: 'rgr_1',
        links: {
          self: 'https://api.example.test/release-groups/rgr_1',
        },
      },
      links: {
        self: 'https://api.example.test/releases/rel_1',
      },
    }

    const rows = projectListRows([release], releasesPresenter, false)
    expect(rows[0]).toEqual({
      ID: 'rel_1',
      NAME: 'Now (Sample Release)',
      STATE: 'in-progress',
      TIMEFRAME: '-',
      ARCHIVED: 'false',
    })

    const wideRows = projectListRows([release], releasesPresenter, true)
    expect(wideRows[0]).toMatchObject({
      RELEASE_GROUP: 'rgr_1',
      DESCRIPTION: 'Ship faster',
      URL: 'https://api.example.test/releases/rel_1',
    })

    const detailMap = toFieldMap(projectDetailFields(release, releasesPresenter, false))
    expect(detailMap.release_group).toBe('rgr_1')
    expect(detailMap.release_group_url).toBe('https://api.example.test/release-groups/rgr_1')
    expect(detailMap.timeframe_granularity).toBe('none')
    expect(detailMap.url).toBe('https://api.example.test/releases/rel_1')
  })

  it('projects objectives with formatted list columns and flattened detail fields', () => {
    const objective = {
      id: 'obj_1',
      name: 'Drive ongoing user engagement',
      description: '<strong>Engagement</strong> objective',
      level: { name: 'Company' },
      parent: { id: 'obj_parent_1' },
      owner: { email: 'tech@example.com' },
      timeframe: {
        startDate: '2025-04-01',
        endDate: '2025-06-30',
        granularity: 'quarter',
      },
      state: null,
      status: { id: 'sta_1', name: 'Upcoming' },
      archived: false,
      createdAt: '2025-03-01T10:00:00.000Z',
      updatedAt: '2025-03-15T14:30:00.000Z',
      links: { self: 'https://api.example.test/objectives/obj_1' },
    }

    const rows = projectListRows([objective], objectivesPresenter, false)
    expect(rows[0]).toMatchObject({
      ID: 'obj_1',
      NAME: 'Drive ongoing user engagement',
      STATUS: 'Upcoming',
      OWNER: 'tech@example.com',
    })
    expect(rows[0]?.UPDATED).toMatch(/^2025-03-15 \d{2}:\d{2}$/)
    expect(rows[0]).not.toHaveProperty('TIMEFRAME')

    const wideRows = projectListRows([objective], objectivesPresenter, true)
    expect(wideRows[0]).toMatchObject({
      TIMEFRAME: '2025-04-01 → 2025-06-30',
      ARCHIVED: 'false',
      LEVEL: 'Company',
      URL: 'https://api.example.test/objectives/obj_1',
    })

    const detailMap = toFieldMap(projectDetailFields(objective, objectivesPresenter, false))
    expect(detailMap.level).toBe('Company')
    expect(detailMap.parent).toBe('obj_parent_1')
    expect(detailMap.status).toBe('Upcoming')
    expect(detailMap.status_id).toBe('sta_1')
    expect(detailMap.timeframe_granularity).toBe('quarter')
    expect(detailMap.description).toBe('Engagement objective')
  })

  it('projects release groups without JSON blobs', () => {
    const releaseGroup = {
      id: 'rgr_1',
      name: 'Kanban Release Group',
      description: '<p>Core&nbsp;shipments</p>',
      archived: false,
      links: { self: 'https://api.example.test/release-groups/rgr_1' },
    }

    const rows = projectListRows([releaseGroup], releaseGroupsPresenter, false)
    expect(rows[0]).toEqual({
      ID: 'rgr_1',
      NAME: 'Kanban Release Group',
      ARCHIVED: 'false',
    })

    const wideRows = projectListRows([releaseGroup], releaseGroupsPresenter, true)
    expect(wideRows[0]).toMatchObject({
      DESCRIPTION: 'Core shipments',
      URL: 'https://api.example.test/release-groups/rgr_1',
    })

    const detailMap = toFieldMap(projectDetailFields(releaseGroup, releaseGroupsPresenter, false))
    expect(detailMap.description).toBe('Core shipments')
    expect(detailMap.url).toBe('https://api.example.test/release-groups/rgr_1')
  })

  it('projects products with owner email and formatted update date', () => {
    const product = {
      id: 'prd_1',
      name: 'Sample Product 1',
      description: '<div>Main&nbsp;product line</div>',
      owner: { email: 'tech@example.com' },
      createdAt: '2025-01-01T08:00:00.000Z',
      updatedAt: '2025-02-01T09:15:00.000Z',
      links: { self: 'https://api.example.test/products/prd_1' },
    }

    const rows = projectListRows([product], productsPresenter, false)
    expect(rows[0]).toMatchObject({
      ID: 'prd_1',
      NAME: 'Sample Product 1',
      OWNER: 'tech@example.com',
    })
    expect(rows[0]?.UPDATED).toMatch(/^2025-02-01 \d{2}:\d{2}$/)

    const wideRows = projectListRows([product], productsPresenter, true)
    expect(wideRows[0]).toMatchObject({
      DESCRIPTION: 'Main product line',
      URL: 'https://api.example.test/products/prd_1',
    })

    const detailMap = toFieldMap(projectDetailFields(product, productsPresenter, false))
    expect(detailMap.owner).toBe('tech@example.com')
    expect(detailMap.description).toBe('Main product line')
    expect(detailMap.url).toBe('https://api.example.test/products/prd_1')
  })
})
