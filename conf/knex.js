require('dotenv').config({ path: '../.env' })
// const { knexSnakeCaseMappers } = require('objection')

const connection = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER
}

const knexConfig = {
  development: {
    client: 'pg',
    connection,
    debug: true,
    migrations: {
      directory: '../_tools/knex/migrations'
    },
    seeds: {
      directory: '../_tools/knex/seeds'
    }
  },
  production: {
    client: 'pg',
    connection,
    migrations: {
      directory: '../_tools/knex/migrations'
    },
    seeds: {
      directory: '../_tools/knex/seeds'
    }
  }
}

module.exports = knexConfig
