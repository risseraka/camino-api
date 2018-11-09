const {
  permissionsCheck,
  restrictedDomaineIds,
  restrictedStatutIds
} = require('./_permissions')

const {
  titreGet,
  titresGet,
  titreAdd,
  titreRemove,
  titreUpdate
} = require('../../postgres/queries/titres')

const { domainesGet, statutsGet } = require('../../postgres/queries/metas')

const { titreEtapeUpsert } = require('../../postgres/queries/titres-etapes')

const titreEtapeUpdateTasks = require('../../tasks/etape-update/index')

const { titreFormat } = require('./_utils')

const resolvers = {
  async titre({ id }, context, info) {
    let titre = await titreGet(id)

    if (
      !context.user ||
      permissionsCheck(context.user, ['defaut', 'entreprise'])
    ) {
      if (
        restrictedDomaineIds.includes(titre.domaineId) ||
        restrictedStatutIds.includes(titre.statutId)
      ) {
        titre = null
      }
    }

    return titre && titreFormat(titre)
  },

  async titres(
    { typeIds, domaineIds, statutIds, substances, noms },
    context,
    info
  ) {
    if (
      !context.user ||
      permissionsCheck(context.user, ['defaut', 'entreprise'])
    ) {
      if (!domaineIds) {
        let domaines = await domainesGet()
        domaineIds = domaines.map(domaine => domaine.id)
      }
      domaineIds = domaineIds.filter(id => !restrictedDomaineIds.includes(id))

      if (!statutIds) {
        let statuts = await statutsGet()
        statutIds = statuts.map(statut => statut.id)
      }

      statutIds = statutIds.filter(id => !restrictedStatutIds.includes(id))
    }

    const titres = await titresGet({
      typeIds,
      domaineIds,
      statutIds,
      substances,
      noms
    })

    return titres.map(titre => titre && titreFormat(titre))
  },

  async titreAjouter({ titre }, context, info) {
    const errors = []

    if (!permissionsCheck(context.user, ['super', 'admin'])) {
      errors.push('opération impossible')
    }

    if (!errors.length) {
      return titreAdd(titre)
    } else {
      throw new Error(errors.join(', '))
    }
  },

  async titreSupprimer({ id }, context, info) {
    const errors = []

    if (!permissionsCheck(context.user, ['super', 'admin'])) {
      errors.push('opération impossible')
    }

    if (!errors.length) {
      return titreRemove(id)
    } else {
      throw new Error(errors.join(', '))
    }
  },

  async titreModifier({ titre }, context, info) {
    const errors = []

    if (!permissionsCheck(context.user, ['super', 'admin'])) {
      errors.push('opération impossible')
    }

    if (!errors.length) {
      return titreUpdate(titre)
    } else {
      throw new Error(errors.join(', '))
    }
  },

  async titreEtapeModifier({ etape }, context, info) {
    const errors = []

    if (!permissionsCheck(context.user, ['super', 'admin'])) {
      errors.push('opération impossible')
    }

    if (!errors.length) {
      const res = await titreEtapeUpsert(etape)
      await titreEtapeUpdateTasks(etape)

      return res
    } else {
      throw new Error(errors.join(', '))
    }
  }
}

module.exports = resolvers
