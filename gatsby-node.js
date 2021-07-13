const { oneLine } = require(`common-tags`)
const moment = require(`moment`)

/**
 * @typedef {import('gatsby').CreateSchemaCustomizationArgs} CreateSchemaCustomizationArgs
 * @typedef {import('gatsby').Actions} Actions
 * @typedef {import('gatsby').Reporter} Reporter
 */

/**
 * @param {CreateSchemaCustomizationArgs} args
 * @param {Actions} args.actions
 * @param {Reporter} args.reporter
 */
exports.createSchemaCustomization = ({ actions, reporter }) => {
  const ISO_8601_FORMAT = [
    `YYYY`,
    `YYYY-MM`,
    `YYYY-MM-DD`,
    `YYYYMMDD`, // Local Time
    `YYYY-MM-DDTHH`,
    `YYYY-MM-DDTHH:mm`,
    `YYYY-MM-DDTHHmm`,
    `YYYY-MM-DDTHH:mm:ss`,
    `YYYY-MM-DDTHHmmss`,
    `YYYY-MM-DDTHH:mm:ss.SSS`,
    `YYYY-MM-DDTHHmmss.SSS`,
    `YYYY-MM-DDTHH:mm:ss.SSSSSS`,
    `YYYY-MM-DDTHHmmss.SSSSSS`, // `YYYY-MM-DDTHH:mm:ss.SSSSSSSSS`,
    // `YYYY-MM-DDTHHmmss.SSSSSSSSS`,
    // Local Time (Omit T)
    `YYYY-MM-DD HH`,
    `YYYY-MM-DD HH:mm`,
    `YYYY-MM-DD HHmm`,
    `YYYY-MM-DD HH:mm:ss`,
    `YYYY-MM-DD HHmmss`,
    `YYYY-MM-DD HH:mm:ss.SSS`,
    `YYYY-MM-DD HHmmss.SSS`,
    `YYYY-MM-DD HH:mm:ss.SSSSSS`,
    `YYYY-MM-DD HHmmss.SSSSSS`, // `YYYY-MM-DD HH:mm:ss.SSSSSSSSS`,
    // `YYYY-MM-DD HHmmss.SSSSSSSSS`,
    // Coordinated Universal Time (UTC)
    `YYYY-MM-DDTHHZ`,
    `YYYY-MM-DDTHH:mmZ`,
    `YYYY-MM-DDTHHmmZ`,
    `YYYY-MM-DDTHH:mm:ssZ`,
    `YYYY-MM-DDTHHmmssZ`,
    `YYYY-MM-DDTHH:mm:ss.SSSZ`,
    `YYYY-MM-DDTHHmmss.SSSZ`,
    `YYYY-MM-DDTHH:mm:ss.SSSSSSZ`,
    `YYYY-MM-DDTHHmmss.SSSSSSZ`, // `YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ`,
    // `YYYY-MM-DDTHHmmss.SSSSSSSSSZ`,
    // Coordinated Universal Time (UTC) (Omit T)
    `YYYY-MM-DD HHZ`,
    `YYYY-MM-DD HH:mmZ`,
    `YYYY-MM-DD HHmmZ`,
    `YYYY-MM-DD HH:mm:ssZ`,
    `YYYY-MM-DD HHmmssZ`,
    `YYYY-MM-DD HH:mm:ss.SSSZ`,
    `YYYY-MM-DD HHmmss.SSSZ`,
    `YYYY-MM-DD HH:mm:ss.SSSSSSZ`,
    `YYYY-MM-DD HHmmss.SSSSSSZ`, // `YYYY-MM-DD HH:mm:ss.SSSSSSSSSZ`,
    // `YYYY-MM-DD HHmmss.SSSSSSSSSZ`,
    // Coordinated Universal Time (UTC) (Omit T, Extra Space before Z)
    `YYYY-MM-DD HH Z`,
    `YYYY-MM-DD HH:mm Z`,
    `YYYY-MM-DD HHmm Z`,
    `YYYY-MM-DD HH:mm:ss Z`,
    `YYYY-MM-DD HHmmss Z`,
    `YYYY-MM-DD HH:mm:ss.SSS Z`,
    `YYYY-MM-DD HHmmss.SSS Z`,
    `YYYY-MM-DD HH:mm:ss.SSSSSS Z`,
    `YYYY-MM-DD HHmmss.SSSSSS Z`,
    `YYYY-[W]WW`,
    `YYYY[W]WW`,
    `YYYY-[W]WW-E`,
    `YYYY[W]WWE`,
    `YYYY-DDDD`,
    `YYYYDDDD`,
  ]

  const formatDate = ({ date, fromNow, difference, formatString, locale = `en`, offset }) => {
    const normalizedDate = JSON.parse(JSON.stringify(date))
    const dateMoment = moment(normalizedDate, ISO_8601_FORMAT, locale, true).utcOffset(offset)

    if (formatString) return dateMoment.format(formatString)
    if (fromNow) return dateMoment.fromNow()
    if (difference) return moment().diff(dateMoment, difference)

    return normalizedDate
  }

  actions.createFieldExtension({
    name: `extendedDateformat`,
    description: `Add date formatting options.`,
    args: {
      offset: `Int`,
    },
    extend(options, prevFieldConfig) {
      const error = new Error(`extendedDateformat must be declared after dateformat extension`)

      const { dateformat } = prevFieldConfig.extensions
      if (!dateformat) {
        reporter.panic(error)
      }

      const keys = Object.keys(prevFieldConfig.extensions)
      if (keys.indexOf(`dateformat`) > keys.indexOf(`extendedDateformat`)) {
        reporter.panic(error)
      }

      return {
        args: {
          ...prevFieldConfig.args,
          offset: {
            type: `Int`,
            description: oneLine`
            Setting the UTC offset by supplying minutes. The offset is set on the
            moment object that utcOffset() is called on.
            `,
            defaultValue: options.offset,
          },
        },
        async resolve(source, args, context, info) {
          if (!args.offset) return prevFieldConfig.resolve(source, args, context, info)

          const date = await context.defaultFieldResolver(source, args, context, {
            ...info,
            from: options.from || info.from,
            fromNode: options.from ? options.fromNode : info.fromNode,
          })
          if (date == null) return null

          return Array.isArray(date)
            ? date.map(d => formatDate({ date: d, ...args }))
            : formatDate({ date, ...args })
        },
      }
    },
  })
}
