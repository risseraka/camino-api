import { titreGet } from './titres'
import TitresDemarches from '../models/titres-demarches'
import options from './_options'
import { titreDemarcheFormat } from './_format'

const titresDemarchesGet = async ({ demarchesIds, titresIds } = {}) =>
  TitresDemarches.query()
    .skipUndefined()
    .eager(options.demarches.eager)
    .orderBy('ordre')
    .whereIn('titresDemarches.typeId', demarchesIds)
    .whereIn('titresDemarches.titreId', titresIds)

const titreDemarcheGet = async demarcheId => {
  const q = TitresDemarches.query()
    .eager(options.demarches.eager)
    .findById(demarcheId)

  const titreDemarche = await q

  const titre = await titreGet(titreDemarche.titreId)

  return titreDemarcheFormat(titreDemarche, titre.typeId)
}

const titreDemarcheStatutIdUpdate = async ({ id, statutId }) =>
  TitresDemarches.query()
    .skipUndefined()
    .findById(id)
    .patch({ statutId })

const titreDemarcheOrdreUpdate = async ({ id, ordre }) =>
  TitresDemarches.query()
    .skipUndefined()
    .findById(id)
    .patch({ ordre })

export {
  titreDemarcheGet,
  titresDemarchesGet,
  titreDemarcheStatutIdUpdate,
  titreDemarcheOrdreUpdate
}
