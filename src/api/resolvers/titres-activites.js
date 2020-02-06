import { debug } from '../../config/index'
import * as dateFormat from 'dateformat'
import { titreActiviteEmailsSend } from './_titre-activite'
import { permissionsCheck } from './permissions/permissions-check'
import {
  titrePermissionCheck,
  titreActivitePermissionCheck
} from './permissions/titre'
import { titreActiviteFormat } from './format/titres-activites'
import graphFieldsBuild from './graph/fields-build'
import graphBuild from './graph/build'
import graphFormat from './graph/format'

import {
  titreActiviteGet,
  titresActivitesGet,
  titreActiviteUpdate as titreActiviteUpdateQuery
} from '../../database/queries/titres-activites'
import {
  utilisateurGet,
  utilisateursGet
} from '../../database/queries/utilisateurs'
import { titreGet } from '../../database/queries/titres'

import { titreActivitesRowUpdate } from '../../tools/export/titre-activites'

import titreActiviteUpdationValidate from '../../business/titre-activite-updation-validate'

const activite = async ({ id }, context, info) => {
  try {
    const user = context.user && (await utilisateurGet(context.user.id))

    const fields = graphFieldsBuild(info)

    const graph = graphBuild(fields, 'activite', graphFormat)

    const titreActivite = await titreActiviteGet(id, { graph })

    if (
      !titreActivitePermissionCheck(
        user,
        titreActivite,
        titreActivite.titre.amodiataires,
        titreActivite.titre.titulaires
      )
    ) {
      throw new Error("droits insuffisants pour effectuer l'opération")
    }

    return titreActivite && titreActiviteFormat(titreActivite, user)
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const activites = async ({ typeId, annee }, context, info) => {
  try {
    const user = context.user && (await utilisateurGet(context.user.id))

    const fields = graphFieldsBuild(info)

    const graph = graphBuild(fields, 'activites', graphFormat)

    const titresActivites = await titresActivitesGet(
      { typeId, annee },
      { graph }
    )

    return (
      titresActivites &&
      titresActivites.length &&
      titresActivites.reduce((res, titreActivite) => {
        if (
          titreActivitePermissionCheck(
            user,
            titreActivite,
            titreActivite.titre.amodiataires,
            titreActivite.titre.titulaires
          )
        ) {
          res.push(titreActiviteFormat(titreActivite, user))
        }

        return res
      }, [])
    )
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const activiteModifier = async ({ activite }, context, info) => {
  try {
    const user = await utilisateurGet(context.user.id)
    const activiteOld = await titreActiviteGet(activite.id)
    const titre = await titreGet(activiteOld.titreId)

    if (!titrePermissionCheck(titre, user, ['super', 'admin'], true)) {
      throw new Error("droits insuffisants pour effectuer l'opération")
    }

    if (
      !activiteOld.type.titresTypes.find(
        type => type.domaineId === titre.domaineId && type.id === titre.typeId
      )
    ) {
      throw new Error("ce titre ne peut pas recevoir d'activité")
    }

    if (
      !permissionsCheck(context.user, ['super', 'admin']) &&
      activiteOld &&
      activiteOld.statut.id === 'dep'
    ) {
      throw new Error(
        'cette activité a été validée et ne peux plus être modifiée'
      )
    }

    const validationErrors = titreActiviteUpdationValidate(
      activite.contenu,
      activiteOld.type.sections
    )

    if (validationErrors.length) {
      throw new Error(validationErrors.join(', '))
    }

    activite.utilisateurId = context.user.id
    activite.dateSaisie = dateFormat(new Date(), 'yyyy-mm-dd')

    const fields = graphFieldsBuild(info)

    const graph = graphBuild(fields, 'activites', graphFormat)

    const activiteRes = await titreActiviteUpdateQuery(activite.id, activite, {
      graph
    })

    titreActivitesRowUpdate([activiteRes])

    const activiteFormated = titreActiviteFormat(activiteRes, user)

    if (activiteRes.statutId === 'dep') {
      const utilisateurs = await titreActiviteUtilisateursGet(titre, user)

      await titreActiviteEmailsSend(
        activiteFormated,
        titre.nom,
        user,
        utilisateurs
      )
    }

    return activiteFormated
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

const titreActiviteUtilisateursGet = (titre, user) => {
  try {
    const isAmodiataire = titre.amodiataires.some(
      t => t.id === user.entrepriseId
    )
    const entrepriseIds = isAmodiataire
      ? titre.amodiataires.map(t => t.id)
      : titre.titulaires.map(t => t.id)

    return utilisateursGet({
      entrepriseIds,
      noms: null,
      administrationIds: null,
      permissionIds: null
    })
  } catch (e) {
    if (debug) {
      console.error(e)
    }

    throw e
  }
}

export { activite, activites, activiteModifier }
