import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import * as express from 'express'
import * as knexDbManager from 'knex-db-manager'
import * as request from 'supertest'
import * as Knex from 'knex'
import * as jwt from 'jsonwebtoken'
import { Model } from 'objection'

import middlewareGraphql from '../src/server/middleware-graphql'
import middlewareJwt from '../src/server/middleware-jwt'

import * as knexConfig from '../knex/config'
import * as userAdd from '../knex/user-add'

process.env.JWT_SECRET = 'secret-tests'

const knex = Knex(knexConfig)

Model.knex(knex)

const app = express()

app.use(middlewareJwt)
app.use('/', middlewareGraphql)

// https://github.com/graphql/express-graphql/issues/122

let dbManager: knexDbManager.KnexDbManager

beforeAll(async () => {
  dbManager = knexDbManager.databaseManagerFactory({
    knex: knexConfig,
    dbManager: {
      superUser: knexConfig.connection.user,
      superPassword: knexConfig.connection.password
    }
  })

  try {
    await dbManager.createDb()
  } catch (e) {
    console.info('database already exists')
  }

  await dbManager.createDbOwnerIfNotExist()
})

beforeEach(async () => {
  await dbManager.truncateDb()

  try {
    await knex.schema.dropTable('utilisateurs')
  } catch (e) {}

  await knex.schema.createTable('utilisateurs', table => {
    table.string('id').primary()
    table.string('email')
    table.string('motDePasse').notNullable()
    table.string('nom')
    table.string('prenom')
    table.string('telephoneFixe')
    table.string('telephoneMobile')
    table.string('permissionId', 12).notNullable()
    table.json('preferences')
  })
})

const utilisateursModifierQuery = fs.readFileSync(
  path.join(__dirname, './queries/utilisateur-modifier.graphql')
)

describe('utilisateursModifier', () => {
  beforeEach(async () => {
    console.log('beforeEach utilisateursModifier')

    await knex('utilisateurs').truncate()

    await userAdd({
      id: 'test',
      prenom: 'toto',
      nom: 'test',
      email: 'test@camino.local',
      motDePasse: 'mot-de-passe',
      permissionId: 'defaut'
    })
  })

  test("en tant qu'utilisateur anonyme, un utilisateur n'est pas modifié", async () => {
    const res = await request(app).post(
      `/?query=${utilisateursModifierQuery}&variables=${JSON.stringify({
        utilisateur: {
          id: 'test',
          prenom: 'toto-updated',
          nom: 'test-updated',
          email: 'test-updated@example.com',
          permissionId: 'defaut'
        }
      })}`
    )

    expect(res.body.errors[0].message).toMatch(/droits insuffisants/)
  })

  test("en tant que l'utilisateur, un utilisateur est modifié", async () => {
    const token = jwt.sign({ id: 'test' }, process.env.JWT_SECRET as string)

    const res = await request(app)
      .post(
        `/?query=${utilisateursModifierQuery}&variables=${JSON.stringify({
          utilisateur: {
            id: 'test',
            prenom: 'toto-updated',
            nom: 'test-updated',
            email: 'test-updated@example.com',
            permissionId: 'defaut'
          }
        })}`
      )
      .set('Authorization', `Bearer ${token}`)

    expect(res.body).toMatchObject({
      id: 'test'
    })
  })
})
