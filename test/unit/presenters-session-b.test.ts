import { describe, expect, it } from 'vitest'

import { projectDetailFields, projectListRows } from '../../src/core/presenter.js'
import { companiesPresenter } from '../../src/core/presenters/companies.js'
import { componentsPresenter } from '../../src/core/presenters/components.js'
import { initiativesPresenter } from '../../src/core/presenters/initiatives.js'

describe('session B presenters', () => {
  it('projects companies list/detail fields and strips html descriptions', () => {
    const company = {
      id: 'com_1',
      name: 'Acme',
      domain: 'acme.example',
      sourceOrigin: 'salesforce',
      sourceRecordId: 'sf-123',
      description: '<p>VIP &amp; strategic&nbsp;account</p>',
    }

    const listRows = projectListRows([company], companiesPresenter, false)
    expect(listRows[0]).toEqual({
      ID: 'com_1',
      NAME: 'Acme',
      DOMAIN: 'acme.example',
      SOURCE: 'salesforce',
    })

    const wideRows = projectListRows([company], companiesPresenter, true)
    expect(wideRows[0]?.SOURCE_RECORD).toBe('sf-123')

    const detailFields = projectDetailFields(company, companiesPresenter, false)
    expect(detailFields).toContainEqual({ label: 'description', value: 'VIP & strategic account' })
  })

  it('projects components list/detail fields', () => {
    const component = {
      id: 'cmp_1',
      name: 'Core UX',
      description: '<div>Main&nbsp;component</div>',
      owner: { email: 'owner@example.com' },
      parent: { product: { id: 'prd_1' } },
      links: { html: 'https://example.test/components/cmp_1' },
      createdAt: '2026-02-16T12:00:00.000Z',
      updatedAt: '2026-02-16T13:00:00.000Z',
    }

    const listRows = projectListRows([component], componentsPresenter, false)
    expect(listRows[0]).toMatchObject({
      ID: 'cmp_1',
      NAME: 'Core UX',
      OWNER: 'owner@example.com',
    })

    const wideRows = projectListRows([component], componentsPresenter, true)
    expect(wideRows[0]).toMatchObject({
      PRODUCT: 'prd_1',
      URL: 'https://example.test/components/cmp_1',
    })

    const detailFields = projectDetailFields(component, componentsPresenter, false)
    expect(detailFields).toContainEqual({ label: 'product', value: 'prd_1' })
    expect(detailFields).toContainEqual({ label: 'description', value: 'Main component' })
  })

  it('projects initiatives timeframe in wide and detail modes', () => {
    const initiative = {
      id: 'ini_1',
      name: 'Onboarding revamp',
      owner: { email: 'owner@example.com' },
      timeframe: {
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      },
      links: { html: 'https://example.test/initiatives/ini_1' },
      createdAt: '2026-02-16T12:00:00.000Z',
      updatedAt: '2026-02-16T13:00:00.000Z',
    }

    const listRows = projectListRows([initiative], initiativesPresenter, false)
    expect(listRows[0]).toMatchObject({
      ID: 'ini_1',
      NAME: 'Onboarding revamp',
      OWNER: 'owner@example.com',
    })
    expect(listRows[0]).not.toHaveProperty('TIMEFRAME')

    const wideRows = projectListRows([initiative], initiativesPresenter, true)
    expect(wideRows[0]).toMatchObject({
      TIMEFRAME: '2026-03-01 → 2026-03-31',
      URL: 'https://example.test/initiatives/ini_1',
    })

    const detailFields = projectDetailFields(initiative, initiativesPresenter, false)
    expect(detailFields).toContainEqual({ label: 'timeframe', value: '2026-03-01 → 2026-03-31' })
  })
})
