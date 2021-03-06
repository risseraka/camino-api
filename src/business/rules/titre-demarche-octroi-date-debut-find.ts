import { ITitreDemarche } from '../../types'

import titreDemarchesAscSort from '../utils/titre-elements-asc-sort'
import titreEtapesDescSort from '../utils/titre-etapes-desc-sort'

const titreDemarcheOctroiDateDebutFind = (
  titreDemarches: ITitreDemarche[] | null | undefined
) => {
  if (!titreDemarches || !titreDemarches.length) return '0000'

  // récupère la démarche d'octroi (naturelle ou virtuelle)
  const demarcheOctroi = titreDemarchesAscSort(
    titreDemarches
  ).find(({ typeId }) => ['oct', 'vut'].includes(typeId))

  if (
    !demarcheOctroi ||
    !demarcheOctroi.etapes ||
    !demarcheOctroi.etapes.length
  ) {
    return '0000'
  }

  // trie les étapes dans l'ordre décroissant
  const etapes = titreEtapesDescSort(demarcheOctroi.etapes)

  // récupère l'étape la plus importante de l'octroi en premier
  const etapeOctroi =
    etapes.find(
      ({ typeId }) =>
        ([
          'dpu',
          'dup',
          'rpu',
          'dex',
          'dux',
          'dim',
          'def',
          'sco',
          'aco'
        ].includes(typeId) &&
          demarcheOctroi.statutId === 'acc') ||
        typeId === 'mfr'
    ) ||
    // sinon utilise la première étape (chronologique) de l'octroi
    etapes[etapes.length - 1]

  return etapeOctroi.dateDebut || etapeOctroi.date
}

export default titreDemarcheOctroiDateDebutFind
