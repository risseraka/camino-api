import { ITitreActivite } from '../../types'
import { mocked } from 'ts-jest/utils'

import titresActivitesTypesUpdate from './titres-activites-update'

import activitesTypesFilter from '../utils/activites-types-filter'
import activiteTypeAnneesFind from '../utils/activite-type-annees-find'
import { titreActivitesUpsert } from '../../database/queries/titres-activites'
import titreActivitesBuild from '../rules/titre-activites-build'

import {
  titresSansActivite,
  titresToutesActivites,
  titreActivitesTypes
} from './__mocks__/titres-activites-update-titres'

jest.mock('../utils/activites-types-filter', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('../utils/activite-type-annees-find', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('../../database/queries/titres-activites', () => ({
  __esModule: true,
  titreActivitesUpsert: jest.fn().mockResolvedValue(true)
}))

jest.mock('../rules/titre-activites-build', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}))

const activitesTypesFilterMock = mocked(activitesTypesFilter, true)
const activiteTypeAnneesFindMock = mocked(activiteTypeAnneesFind, true)
const titreActivitesBuildMock = mocked(titreActivitesBuild, true)

console.info = jest.fn()

describe("activités d'un titre", () => {
  test('met à jour un titre sans activité', async () => {
    activitesTypesFilterMock.mockReturnValue(true)
    activiteTypeAnneesFindMock.mockReturnValue([2018])
    titreActivitesBuildMock.mockReturnValue([{}] as ITitreActivite[])

    const titresActivitesNew = await titresActivitesTypesUpdate(
      titresSansActivite,
      titreActivitesTypes
    )

    expect(titresActivitesNew.length).toEqual(1)

    expect(activitesTypesFilter).toHaveBeenCalledTimes(
      titresSansActivite.length
    )
    expect(titreActivitesUpsert).toHaveBeenCalled()
    expect(titreActivitesBuild).toHaveBeenCalled()
    expect(console.info).toHaveBeenCalled()
  })

  test('ne met pas à jour un titre possédant déjà des activités', async () => {
    activitesTypesFilterMock.mockReturnValue(true)
    activiteTypeAnneesFindMock.mockReturnValue([2018])
    titreActivitesBuildMock.mockReturnValue([])

    const titresActivitesNew = await titresActivitesTypesUpdate(
      titresToutesActivites,
      titreActivitesTypes
    )

    expect(titresActivitesNew.length).toEqual(0)

    expect(activitesTypesFilter).toHaveBeenCalledTimes(1)
    expect(titreActivitesBuild).toHaveBeenCalled()
    expect(titreActivitesUpsert).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
  })

  test("ne met pas à jour un titre ne correspondant à aucun type d'activité", async () => {
    activitesTypesFilterMock.mockReturnValue(false)
    activiteTypeAnneesFindMock.mockReturnValue([2018])

    const titresActivitesNew = await titresActivitesTypesUpdate(
      titresSansActivite,
      titreActivitesTypes
    )

    expect(titresActivitesNew.length).toEqual(0)

    expect(activitesTypesFilter).toHaveBeenCalledTimes(1)
    expect(titreActivitesBuild).not.toHaveBeenCalled()
    expect(titreActivitesUpsert).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
  })

  test('ne met pas à jour de titre si les activités ne sont valables sur aucune année', async () => {
    activitesTypesFilterMock.mockReturnValue(false)
    activiteTypeAnneesFindMock.mockReturnValue([])

    const titresActivitesNew = await titresActivitesTypesUpdate(
      titresSansActivite,
      titreActivitesTypes
    )

    expect(titresActivitesNew.length).toEqual(0)

    expect(activitesTypesFilter).not.toHaveBeenCalled()
    expect(titreActivitesBuild).not.toHaveBeenCalled()
    expect(titreActivitesUpsert).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
  })
})
