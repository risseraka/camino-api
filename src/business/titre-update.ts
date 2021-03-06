import { administrationsGet } from '../database/queries/administrations'
import { titreGet } from '../database/queries/titres'

import titresActivitesUpdate from './processes/titres-activites-update'
import titresAdministrationsGestionnairesUpdate from './processes/titres-administrations-gestionnaires-update'
import titresPublicUpdate from './processes/titres-public-update'
import { titreIdsUpdate } from './processes/titres-ids-update'
import { activitesTypesGet } from '../database/queries/metas'

const titreUpdate = async (titreId: string) => {
  try {
    let titre

    console.info()
    console.info('publicité des titres…')
    titre = await titreGet(
      titreId,
      {
        fields: {
          type: { autorisationsTitresStatuts: { id: {} } },
          demarches: { phase: { id: {} }, etapes: { points: { id: {} } } }
        }
      },
      'super'
    )
    const titresPublicUpdated = await titresPublicUpdate([titre])

    titre = await titreGet(
      titreId,
      {
        fields: { administrationsGestionnaires: { id: {} } }
      },
      'super'
    )

    if (!titre) {
      throw new Error(`warning: le titre ${titreId} n'existe plus`)
    }

    console.info()
    console.info('administrations gestionnaires associées aux titres…')

    const administrations = await administrationsGet({}, {}, 'super')
    const {
      titresAdministrationsGestionnairesCreated = [],
      titresAdministrationsGestionnairesDeleted = []
    } = await titresAdministrationsGestionnairesUpdate([titre], administrations)

    console.info()
    console.info('activités des titres…')
    titre = await titreGet(
      titreId,
      {
        fields: {
          demarches: { phase: { id: {} } },
          communes: { departement: { region: { pays: { id: {} } } } },
          activites: { id: {} }
        }
      },
      'super'
    )
    const activitesTypes = await activitesTypesGet({}, 'super')
    const titresActivitesCreated = await titresActivitesUpdate(
      [titre],
      activitesTypes
    )

    console.info()
    console.info('ids de titres, démarches, étapes et sous-éléments…')
    // si l'id du titre change il est effacé puis re-créé entièrement
    // on doit donc récupérer toutes ses relations
    titre = await titreGet(
      titreId,
      {
        fields: {
          type: { type: { id: {} } },
          references: { id: {} },
          administrationsGestionnaires: { id: {} },
          demarches: {
            etapes: {
              points: { references: { id: {} } },
              documents: { id: {} },
              administrations: { id: {} },
              titulaires: { id: {} },
              amodiataires: { id: {} },
              substances: { id: {} },
              communes: { id: {} },
              justificatifs: { id: {} },
              incertitudes: { id: {} }
            },
            phase: { id: {} }
          },
          travaux: { etapes: { id: {} } },
          activites: { id: {} }
        }
      },
      'super'
    )

    // met à jour l'id dans le titre par effet de bord
    const titreUpdatedIndex = await titreIdsUpdate(titre)
    titreId = titreUpdatedIndex ? Object.keys(titreUpdatedIndex)[0] : titreId

    console.info()
    console.info('tâches métiers exécutées:')
    if (titresPublicUpdated.length) {
      console.info(
        `mise à jour: ${titresPublicUpdated.length} titre(s) (publicité)`
      )
    }

    if (titresAdministrationsGestionnairesCreated.length) {
      console.info(
        `mise à jour: ${titresAdministrationsGestionnairesCreated.length} administration(s) gestionnaire(s) ajoutée(s) dans des titres`
      )
    }

    if (titresAdministrationsGestionnairesDeleted.length) {
      console.info(
        `mise à jour: ${titresAdministrationsGestionnairesDeleted.length} administration(s) gestionnaire(s) supprimée(s) dans des titres`
      )
    }

    if (titresActivitesCreated.length) {
      console.info(`mise à jour: ${titresActivitesCreated.length} activités`)
    }

    if (titreUpdatedIndex) {
      console.info(`mise à jour: 1 titre (id)`)
    }

    return titreId
  } catch (e) {
    console.error(`erreur: titreUpdate ${titreId}`)
    console.error(e)
    throw e
  }
}

export default titreUpdate
