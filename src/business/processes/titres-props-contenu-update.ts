import { ITitre, ITitrePropsTitreEtapesIds } from '../../types'
import PQueue from 'p-queue'

import { titreUpdate } from '../../database/queries/titres'
import titreContenuEtapeIdFind from '../rules/titre-contenu-etape-id-find'

const titresPropsContenuUpdate = async (titres: ITitre[]) => {
  const queue = new PQueue({ concurrency: 100 })

  const titresUpdated = titres.reduce((titresUpdated: ITitre[], titre) => {
    if (!titre.type?.propsEtapesTypes) return titresUpdated

    const {
      propsTitreEtapesIds,
      hasChanged
    } = titre.type.propsEtapesTypes.reduce(
      (
        {
          propsTitreEtapesIds,
          hasChanged
        }: {
          propsTitreEtapesIds: ITitrePropsTitreEtapesIds | null
          hasChanged: boolean
        },
        { sectionId, elementId }
      ) => {
        const titreEtapeId = titreContenuEtapeIdFind(
          titre.demarches!,
          titre.statutId!,
          sectionId,
          elementId
        )

        // si une étape est trouvée
        // et qu'elle est différente de la valeur dans le titre
        // alors on la sauvegarde dans les propriétés
        if (
          titreEtapeId &&
          !(
            titre.propsTitreEtapesIds &&
            titre.propsTitreEtapesIds[sectionId] &&
            titre.propsTitreEtapesIds[sectionId][elementId] === titreEtapeId
          )
        ) {
          if (!propsTitreEtapesIds) {
            propsTitreEtapesIds = {}
          }

          if (!propsTitreEtapesIds[sectionId]) {
            propsTitreEtapesIds[sectionId] = {}
          }

          propsTitreEtapesIds[sectionId][elementId] = titreEtapeId

          hasChanged = true
        } else if (
          // sinon, si aucune étape n'est trouvée
          // et qu'une valeur existe dans les propriétés du titre
          // alors on supprime la valeur des propriétés
          !titreEtapeId &&
          titre.propsTitreEtapesIds &&
          titre.propsTitreEtapesIds[sectionId] &&
          titre.propsTitreEtapesIds[sectionId][elementId]
        ) {
          delete titre.propsTitreEtapesIds[sectionId][elementId]

          // si la section ne contient plus aucun élément
          // alors on la supprime des propriétés
          if (!Object.keys(titre.propsTitreEtapesIds[sectionId]).length) {
            delete titre.propsTitreEtapesIds[sectionId]
          }

          // si le titre ne contient plus aucune section
          // alors on supprime l'objet du titre
          if (!Object.keys(titre.propsTitreEtapesIds).length) {
            propsTitreEtapesIds = null
          }

          hasChanged = true
        }

        return { propsTitreEtapesIds, hasChanged }
      },
      {
        propsTitreEtapesIds: titre.propsTitreEtapesIds || null,
        hasChanged: false
      }
    )

    if (hasChanged) {
      queue.add(async () => {
        const titreUpdated = await titreUpdate(titre.id, {
          propsTitreEtapesIds
        })

        console.info(
          `mise à jour: titre ${titre.id} contenu: ${JSON.stringify(
            propsTitreEtapesIds
          )}`
        )

        titresUpdated.push(titreUpdated)
      })
    }

    return titresUpdated
  }, [])

  await queue.onIdle()

  return titresUpdated
}

export default titresPropsContenuUpdate
