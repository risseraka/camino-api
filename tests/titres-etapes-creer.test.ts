import 'dotenv/config'

import { dbManager } from './init'
import { graphQLCall, queryImport } from './_utils'
import { autorisationsInit } from '../src/database/cache/autorisations'
import { titreDemarcheCreate } from '../src/database/queries/titres-demarches'
import { titreCreate } from '../src/database/queries/titres'
import { IPermissionId } from '../src/types'
const each = require('jest-each').default

console.info = jest.fn()
console.error = jest.fn()

beforeEach(async () => {
  await dbManager.populateDb()
  await autorisationsInit()
})

afterEach(async () => {
  await dbManager.truncateDb()
})

afterAll(async () => {
  dbManager.closeKnex()
})

async function demarcheCreate() {
  const titreId = 'titre-arm-id'
  await titreCreate(
    {
      id: 'titre-arm-id',
      nom: 'mon titre',
      domaineId: 'm',
      typeId: 'arm'
    },
    {},
    'super'
  )
  await titreDemarcheCreate(
    {
      id: 'demarche-test-id',
      titreId,
      typeId: 'oct'
    },
    {}
  )

  return 'demarche-test-id'
}

describe('etapeCreer', () => {
  const etapeCreerQuery = queryImport('titres-etapes-creer')

  each([undefined, 'editeur']).it(
    'ne peut pas créer une étape (utilisateur %s)',
    async (permissionId: IPermissionId) => {
      const res = await graphQLCall(
        etapeCreerQuery,
        {
          etape: {
            typeId: '',
            statutId: '',
            titreDemarcheId: '',
            date: ''
          }
        },
        permissionId
      )

      expect(res.body.errors[0].message).toBe('droits insuffisants')
    }
  )

  test('ne peut pas créer une étape sur une démarche inexistante (utilisateur super)', async () => {
    const res = await graphQLCall(
      etapeCreerQuery,
      {
        etape: {
          typeId: '',
          statutId: '',
          titreDemarcheId: '',
          date: ''
        }
      },
      'admin'
    )

    expect(res.body.errors[0].message).toBe("la démarche n'existe pas")
  })

  test('peut créer une étape mfr avec un statut fai(utilisateur super)', async () => {
    const titreDemarcheId = await demarcheCreate()
    const res = await graphQLCall(
      etapeCreerQuery,
      {
        etape: {
          typeId: 'mfr',
          statutId: 'fai',
          titreDemarcheId,
          date: ''
        }
      },
      'super'
    )

    expect(res.body.errors).toBeUndefined()
  })

  test('ne peut pas créer une étape acg avec un statut fai (utilisateur super)', async () => {
    const titreDemarcheId = await demarcheCreate()

    const res = await graphQLCall(
      etapeCreerQuery,
      {
        etape: {
          typeId: 'acg',
          statutId: 'fai',
          titreDemarcheId,
          date: ''
        }
      },
      'super'
    )

    expect(res.body.errors[0].message).toBe(
      'statut de l\'étape "fai" invalide pour une type d\'étape acg pour une démarche de type octroi'
    )
  })

  test('peut créer une étape MEN sur un titre ARM en tant que PTMG (utilisateur admin)', async () => {
    const titreDemarcheId = await demarcheCreate()
    const res = await graphQLCall(
      etapeCreerQuery,
      {
        etape: {
          typeId: 'men',
          statutId: 'fai',
          titreDemarcheId,
          date: ''
        }
      },
      'admin',
      'ope-ptmg-973-01'
    )

    expect(res.body.errors).toBeUndefined()
  })

  test('ne peut pas créer une étape EDE sur un titre ARM en tant que PTMG (utilisateur admin)', async () => {
    const titreDemarcheId = await demarcheCreate()

    const res = await graphQLCall(
      etapeCreerQuery,
      {
        etape: {
          typeId: 'ede',
          statutId: 'fai',
          titreDemarcheId,
          date: ''
        }
      },
      'admin',
      'ope-ptmg-973-01'
    )

    expect(res.body.errors[0].message).toBe(
      'droits insuffisants pour créer cette étape'
    )
  })
})
