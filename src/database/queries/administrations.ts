import { IAdministration, IFields, IUtilisateur } from '../../types'
import Administrations from '../models/administrations'
import options from './_options'
import { administrationsPermissionQueryBuild } from './permissions/administrations'

import { userGet } from './utilisateurs'

import graphBuild from './graph/build'
import graphFormat from './graph/format'

const administrationsQueryBuild = (
  { fields }: { fields?: IFields },
  user?: IUtilisateur
) => {
  const graph = fields
    ? graphBuild(fields, 'administration', graphFormat)
    : options.administrations.graph

  const q = Administrations.query().withGraphFetched(graph)

  administrationsPermissionQueryBuild(q, fields, user)

  return q
}

const administrationGet = async (
  id: string,
  { fields }: { fields?: IFields },
  userId?: string
) => {
  const user = userId ? await userGet(userId) : undefined

  const q = administrationsQueryBuild({ fields }, user)

  return (await q.findById(id)) as IAdministration
}

const administrationsGet = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { noms }: { noms?: string[] },
  { fields }: { fields?: IFields },
  userId?: string
) => {
  const user = userId ? await userGet(userId) : undefined

  const q = administrationsQueryBuild({ fields }, user)

  q.orderBy('nom')

  return q.skipUndefined()
}

const administrationsUpsert = async (administrations: IAdministration[]) =>
  Administrations.query()
    .withGraphFetched(options.administrations.graph)
    .upsertGraph(administrations, options.administrations.update)

export { administrationGet, administrationsGet, administrationsUpsert }
