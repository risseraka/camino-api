import { titresActivitesGet } from '../../../database/queries/titres-activites'

const id = process.env.GOOGLE_SPREADSHEET_ID_EXPORT_TITRES_ACTIVITES

const get = async () => titresActivitesGet()

const tables = [
  {
    id: 1,
    name: 'titresActivites',
    columns: [
      'id',
      'titreId',
      'utilisateurId',
      'date',
      'dateSaisie',
      'contenu',
      'activiteTypeId',
      'activiteStatutId',
      'frequencePeriodeId',
      'annee'
    ],
    callbacks: {
      contenu: v => JSON.stringify(v)
    }
  }
]

const spreadsheet = {
  name: 'titres-activites',
  id,
  get,
  tables
}

export default spreadsheet
