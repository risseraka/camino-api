import { GraphQLResolveInfo } from 'graphql'
import { IToken, IEtapeType, IDocumentRepertoire } from '../../../types'
import { debug } from '../../../config/index'

import { autorisations } from '../../../database/cache/autorisations'

import {
  demarchesTypesGet,
  travauxTypesGet,
  demarchesStatutsGet,
  documentsTypesGet,
  domainesGet,
  devisesGet,
  etapesTypesGet,
  etapesStatutsGet,
  geoSystemesGet,
  permissionsGet,
  permissionGet,
  referencesTypesGet,
  titresStatutsGet,
  titresTypesTypesGet,
  unitesGet,
  activitesTypesGet,
  activitesStatutsGet,
  definitionsGet
} from '../../../database/queries/metas'
import { userGet } from '../../../database/queries/utilisateurs'

import { permissionCheck } from '../../../tools/permission'
import fieldsBuild from './_fields-build'
import { etapeTypeFormat } from '../../_format/etapes-types'
import { titreDemarcheGet } from '../../../database/queries/titres-demarches'
import { titreEtapeGet } from '../../../database/queries/titres-etapes'

const npmPackage = require('../../../../package.json')

const devises = async () => devisesGet()
const geoSystemes = async () => geoSystemesGet()
const unites = async () => unitesGet()

const documentsTypes = async ({
  repertoire,
  typeId
}: {
  repertoire: IDocumentRepertoire
  typeId?: string
}) => {
  try {
    return await documentsTypesGet({ repertoire, typeId })
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const documentsVisibilites = async (_: never, context: IToken) => {
  const user = await userGet(context.user?.id)
  if (!user) return []

  if (permissionCheck(user.permissionId, ['super', 'admin', 'editeur'])) {
    return [
      {
        id: 'admin',
        nom: 'Administrations uniquement'
      },
      {
        id: 'entreprise',
        nom: 'Administrations et entreprises titulaires'
      },
      {
        id: 'public',
        nom: 'Public'
      }
    ]
  }

  if (permissionCheck(user.permissionId, ['entreprise'])) {
    return [
      {
        id: 'entreprise',
        nom: 'Administrations et entreprises titulaires'
      }
    ]
  }

  return []
}

const referencesTypes = async () => referencesTypesGet()
const permission = async ({ id }: { id: string }) => permissionGet(id)

const permissions = async (_: never, context: IToken) => {
  try {
    return permissionsGet(null as never, null as never, context.user?.id)
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const domaines = async (
  _: never,
  context: IToken,
  info: GraphQLResolveInfo
) => {
  try {
    const fields = fieldsBuild(info)

    const domaines = await domainesGet(
      null as never,
      { fields },
      context.user?.id
    )

    return domaines
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const types = async () => {
  try {
    const types = await titresTypesTypesGet()

    return types
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const statuts = async (_: never, context: IToken) => {
  try {
    let statuts = await titresStatutsGet()

    if (!context.user) {
      statuts = statuts.filter(statut =>
        autorisations.statutsIds.includes(statut.id)
      )
    }

    return statuts
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const demarchesTypes = async (
  { titreId, titreDemarcheId }: { titreId?: string; titreDemarcheId?: string },
  context: IToken,
  info: GraphQLResolveInfo
) => {
  try {
    const fields = fieldsBuild(info)

    const demarchesTypes = await demarchesTypesGet(
      { titreId, titreDemarcheId },
      { fields },
      context.user?.id
    )

    return demarchesTypes
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const travauxTypes = async (
  { titreId, titreTravauxId }: { titreId?: string; titreTravauxId?: string },
  context: IToken,
  info: GraphQLResolveInfo
) => {
  try {
    const fields = fieldsBuild(info)

    const travauxTypes = await travauxTypesGet(
      { titreId, titreTravauxId },
      { fields },
      context.user?.id
    )

    return travauxTypes
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const demarchesStatuts = async () => {
  try {
    const demarchesStatuts = await demarchesStatutsGet()

    return demarchesStatuts
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const demarcheEtapesTypesGet = async (
  etapesTypes: IEtapeType[],
  titreDemarcheId: string,
  titreEtapeId?: string,
  userId?: string
) => {
  const user = await userGet(userId)

  const titreDemarche = await titreDemarcheGet(
    titreDemarcheId,
    {
      fields: {
        type: { etapesTypes: { etapesStatuts: { id: {} } } },
        titre: {
          type: { demarchesTypes: { id: {} } },
          demarches: { etapes: { id: {} } }
        },
        etapes: { type: { id: {} } }
      }
    },
    user?.id
  )
  if (!titreDemarche) throw new Error("la démarche n'existe pas")

  const titre = titreDemarche.titre!

  const demarcheType = titre.type!.demarchesTypes!.find(
    demarcheType => demarcheType.id === titreDemarche.typeId
  )

  if (!demarcheType) {
    throw new Error(
      `Démarche « ${titreDemarche.type!.nom} » inexistante pour un titre ${
        titre.typeId
      }.`
    )
  }

  const titreEtape = titreEtapeId
    ? await titreEtapeGet(titreEtapeId, {}, user?.id)
    : null

  if (titreEtapeId && !titreEtape) throw new Error("l'étape n'existe pas")

  if (titreEtape) {
    const etapeType = titreDemarche.type!.etapesTypes.find(
      et => et.id === titreEtape.type!.id
    )
    if (!etapeType) {
      throw new Error(
        `Etape « ${titreEtape.type!.nom} » inexistante pour une démarche « ${
          titreDemarche.type!.nom
        } » pour un titre « ${titre.typeId} ».`
      )
    }
  }

  const etapesTypesFormatted = etapesTypes.reduce(
    (etapesTypes: IEtapeType[], etapeType) => {
      const etapeTypeFormatted = etapeTypeFormat(
        etapeType,
        titre,
        titreDemarche.type!,
        titreDemarche.etapes!,
        titreEtape?.typeId,
        titreEtape?.statutId
      )

      if (etapeTypeFormatted) {
        etapesTypes.push(etapeTypeFormatted)
      }

      return etapesTypes
    },
    []
  )

  return etapesTypesFormatted
}

const etapesTypes = async (
  {
    titreDemarcheId,
    titreEtapeId,
    titreTravauxId,
    titreTravauxEtapeId
  }: {
    titreDemarcheId?: string
    titreEtapeId?: string
    titreTravauxId?: string
    titreTravauxEtapeId?: string
  },
  context: IToken,
  info: GraphQLResolveInfo
) => {
  try {
    const fields = fieldsBuild(info)

    const etapesTypes = await etapesTypesGet(
      {
        titreDemarcheId,
        titreEtapeId,
        titreTravauxId,
        titreTravauxEtapeId
      },
      { fields },
      context.user?.id
    )

    if (titreDemarcheId && context.user?.id) {
      return await demarcheEtapesTypesGet(
        etapesTypes,
        titreDemarcheId,
        titreEtapeId,
        context.user.id
      )
    }

    return etapesTypes
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const etapesStatuts = async () => {
  try {
    const etapesStatuts = await etapesStatutsGet()

    return etapesStatuts
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const version = () => {
  return npmPackage.version
}

const activitesTypes = async (
  _: never,
  context: IToken,
  info: GraphQLResolveInfo
) => {
  try {
    const fields = fieldsBuild(info)

    const activitesTypes = await activitesTypesGet({ fields }, context.user?.id)

    // TODO: ne retourner que les types d'activités auxquels l'utilisateur a accès

    return activitesTypes
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const activitesStatuts = async () => {
  try {
    const activitesStatuts = await activitesStatutsGet()

    return activitesStatuts
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

/**
 * Retourne les définitions
 *
 * @returns un tableau de définitions
 */
const definitions = async () => {
  try {
    const definitions = await definitionsGet()

    return definitions
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

export {
  devises,
  demarchesTypes,
  demarchesStatuts,
  travauxTypes,
  documentsTypes,
  documentsVisibilites,
  domaines,
  etapesTypes,
  etapesStatuts,
  geoSystemes,
  permission,
  permissions,
  referencesTypes,
  statuts,
  types,
  unites,
  version,
  activitesTypes,
  activitesStatuts,
  definitions
}
