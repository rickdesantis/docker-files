'use strict'

const express = require('express')
const logger = require('log4js').getLogger('api.js')
const bodyParser = require('body-parser')
const moment = require('moment')
const cpExec = require('child_process').exec
const auth = require('basic-auth')

let router = express.Router()

router.use(require('morgan')('dev'))
router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())
router.use(require('method-override')())

// development only
if (router.get('env') === 'development') {
  router.use(require('errorhandler')())
}

let username = process.env.NAME
let password = process.env.PASSWORD

function secured (req, res, next) {
  let credentials = auth(req)

  if (!credentials || credentials.name !== username || credentials.pass !== password) {
    return res.status(401).send('Access denied.')
  }

  return next()
}

function duration (from, to) {
  if (!from || !to) {
    return '-1s'
  }
  let h = to.clone().diff(from, 'hours')
  let m = to.clone().subtract(h, 'hours').diff(from, 'minutes')
  let s = to.clone().subtract(h, 'hours').subtract(m, 'minutes').diff(from, 'seconds')
  let duration = ''
  if (h > 0) {
    duration += h + 'h'
  }
  if (m > 0) {
    duration += m + 'm'
  }
  duration += s + 's'
  return duration
}

function exec (cmd, callback) {
  if (!cmd) {
    if (callback) {
      callback('Path of the executable to be run missing.', null, null, null)
    }
    return
  }

  logger.debug(`Executing ${cmd}...`)

  cpExec(cmd, function (err, stdout, stderr) {
    let code = 0
    if (err) {
      logger.error(`Error: ${err}`)
      code = err.signal
    }
    logger.trace(`STDOUT: ${stdout}`)
    logger.trace(`STDERR: ${stderr}`)
    logger.debug(`Code: ${code}`)

    if (callback) {
      callback(err, stdout, cmd, code)
    }

    return
  })
}

const analyzers = [ 'ao', 'ai', 'ss', 'a2s' ]

router.get('/data/:machine/:analyzer/:variables', secured, function (req, res) {
  let variables = []
  if (req.params.variables.startsWith('[') && req.params.variables.endsWith(']')) {
    req.params.variables.substring(1, req.params.variables.length - 1).split(',').forEach(function (variable) {
      if (analyzers.indexOf(req.params.analyzer) !== -1) {
        variables.push({ 'variable': variable, 'machine': req.params.machine, 'analyzer': req.params.analyzer })
      }
    })
  } else {
    if (analyzers.indexOf(req.params.analyzer) !== -1) {
      variables.push({ 'variable': req.params.variables, 'machine': req.params.machine, 'analyzer': req.params.analyzer })
    }
  }
  _getData(variables, req.query.from, req.query.to, req.query.values, function (err, body) {
    if (err) {
      return res.status(500).send(err)
    } else {
      return res.status(200).json(body)
    }
  })
})

router.get('/data/:machine/:variables', secured, function (req, res) {
  let variables = []
  if (req.params.variables.startsWith('[') && req.params.variables.endsWith(']')) {
    req.params.variables.substring(1, req.params.variables.length - 1).split(',').forEach(function (variable) {
      let tmp = variable.split('@')
      if (tmp.length === 2 && analyzers.indexOf(tmp[1]) !== -1) {
        variables.push({ 'variable': tmp[0], 'machine': req.params.machine, 'analyzer': tmp[1] })
      }
    })
  } else {
    let tmp = req.params.variables.split('@')
    if (tmp.length === 2 && analyzers.indexOf(tmp[1]) !== -1) {
      variables.push({ 'variable': tmp[0], 'machine': req.params.machine, 'analyzer': tmp[1] })
    }
  }
  _getData(variables, req.query.from, req.query.to, req.query.values, function (err, body) {
    if (err) {
      return res.status(500).send(err)
    } else {
      return res.status(200).json(body)
    }
  })
})

router.get('/data/:variables', secured, function (req, res) {
  let variables = []
  if (req.params.variables.startsWith('[') && req.params.variables.endsWith(']')) {
    req.params.variables.substring(1, req.params.variables.length - 1).split(',').forEach(function (variable) {
      let tmp = variable.split('@')
      if (tmp.length === 3 && analyzers.indexOf(tmp[2]) !== -1) {
        variables.push({ 'variable': tmp[0], 'machine': tmp[1], 'analyzer': tmp[2] })
      }
    })
  } else {
    let tmp = req.params.variables.split('@')
    if (tmp.length === 3 && analyzers.indexOf(tmp[2]) !== -1) {
      variables.push({ 'variable': tmp[0], 'machine': tmp[1], 'analyzer': tmp[2] })
    }
  }
  _getData(variables, req.query.from, req.query.to, req.query.values, function (err, body) {
    if (err) {
      return res.status(500).send(err)
    } else {
      return res.status(200).json(body)
    }
  })
})

router.put('/data/:machine/:analyzer', secured, function (req, res) {
  if (!req.body || req.body.length === 0) {
    return res.status(500).send('Empty body.')
  }
  _putData({machine: req.params.machine, analyzer: req.params.analyzer}, req.body, function (err) {
    if (err) {
      return res.status(500).send(err)
    } else {
      return res.status(200).send('Done!')
    }
  })
})

function _putData (variable, body, callback) {
  if (!callback) {
    logger.debug('No callback provided.')
    return
  }
  if (!variable || !variable.machine || !variable.analyzer || !body) {
    logger.debug('Data not valid.')
    callback('Data not valid.', null)
  }

  let inizio = moment()

  let cmd = `${process.env.EXEC_PATH}/rrdtool update ${process.env.DATA_PATH}/ee${variable.machine}_${variable.analyzer}.rrd ${body}`

  exec(cmd, function (err, body) {
    if (err) {
      logger.error('Error while executing the command.')
      console.warn(err)
    }
    callback(err, body)
    logger.trace(`_putData(${JSON.stringify(variable)}) took ${duration(inizio, moment())}.`)
    return
  })
}

function _getData (variables, from, to, values, callback) {
  if (!callback) {
    logger.debug('No callback provided.')
    return
  }
  if (variables.length === 0) {
    if (callback) {
      callback('No variables found.')
    } else {
      logger.error('No variables found.')
    }

    return
  }

  let inizio = moment()

  from = from || 'now-7d'
  to = to || 'now'
  values = values || 1000

  let cmd = `${process.env.EXEC_PATH}/rrdtool xport --start ${from} --end ${to} --maxrows ${values} --json`
  variables.forEach(function (variable) {
    let varName = variable.variable.split('(')[0].trim().toUpperCase().replace(/ /g, '_')
    cmd += ` DEF:${varName}=${process.env.DATA_PATH}/ee${variable.machine}_${variable.analyzer}.rrd:${varName}:AVERAGE`
  })
  variables.forEach(function (variable) {
    let varName = variable.variable.split('(')[0].trim().toUpperCase().replace(/ /g, '_')
    cmd += ` XPORT:${varName}:"${variable.variable}"`
  })

  exec(cmd, function (err, body) {
    if (!err) {
      try {
        body = JSON.parse(body)
      } catch (e) {
        err = e
      }
    }
    if (err) {
      logger.error('Error while executing the command.')
      console.warn(err)

      callback(err, null)
      logger.trace(`_getData(${JSON.stringify(variables)}, "${from}", "${to}") took ${duration(inizio, moment())}.`)
      return
    }

    let result = []
    let timestamp = body.meta.start
    let step = body.meta.step
    let legend = body.meta.legend
    body.data.forEach(function (row) {
      let atLeastOne = false
      let tmp = {
        '_id': timestamp,
        'Date/hour': moment.unix(timestamp).utc().toISOString()
      }
      for (let i = 0; i < row.length; ++i) {
        if (row[i]) {
          atLeastOne = true
        }
        tmp[legend[i]] = row[i]
      }
      if (atLeastOne) {
        result.push(tmp)
      }
      timestamp += step
    })

    callback(null, result)
    logger.trace(`_getData(${JSON.stringify(variables)}, "${from}", "${to}") took ${duration(inizio, moment())}.`)
  })
}

module.exports = router