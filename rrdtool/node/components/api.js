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
// router.use(bodyParser.text())
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

  cpExec(cmd, { maxBuffer: 50 * 1024 * 1024 }, function (err, stdout, stderr) {
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

router.get('/ping', function (req, res) {
  return res.status(200).send('OK')
})

const analyzers = [ 'ao', 'ai', 'ss', 'a2s' ]

router.get('/data/:machine/:analyzer', secured, function (req, res) {
  if (analyzers.indexOf(req.params.analyzer) === -1) {
    return res.status(500).send(new Error('Analyzer not handled.'))
  }
  let fields
  if (req.query.fields) {
    try {
      fields = JSON.parse(req.query.fields)
    } catch (e) {}
  }
  _getData(req.params.machine, req.params.analyzer, req.query.from, req.query.to, req.query.values, fields, function (err, body) {
    if (err) {
      return res.status(500).send(err)
    } else {
      return res.status(200).json(body)
    }
  })
})

router.post('/create/:machine/:analyzer', secured, function (req, res) {
  if (analyzers.indexOf(req.params.analyzer) === -1) {
    return res.status(500).send(new Error('Analyzer not handled.'))
  }
  _createFile(req.params.machine, req.params.analyzer, function (err) {
    if (err) {
      return res.status(500).send(err)
    } else {
      return res.status(200).send('Done!')
    }
  })
})

const _columnNames = {
  'V L1-N (V)': 'V_L1_N',
  'V L2-N (V)': 'V_L2_N',
  'V L3-N (V)': 'V_L3_N',
  'W tot (W)': 'W_TOT',
  'VAR tot (VAR)': 'VAR_TOT',
  'Energy (kWh)': 'KWh',
  'Module temperature (°C)': 'TEMP',
  'V L1-L2 (V)': 'V_L1_L2',
  'V L2-L3 (V)': 'V_L2_L3',
  'V L3-L1 (V)': 'V_L3_L1',
  'V tot (V)': 'V_TOT',
  'A-L1 (A)': 'A_L1',
  'A-L2 (A)': 'A_L2',
  'A-L3 (A)': 'A_L3',
  'A max (A)': 'A_MAX',
  'A n (A)': 'A_N',
  'P-L1 (W)': 'W_L1',
  'P-L2 (W)': 'W_L2',
  'P-L3 (W)': 'W_L3',
  'VA L1 (VA)': 'VA_L1',
  'VA L2 (VA)': 'VA_L2',
  'VA L3 (VA)': 'VA_L3',
  'VA tot (VA)': 'VA_TOT',
  'VAR L1 (VAR)': 'VAR_L1',
  'VAR L2 (VAR)': 'VAR_L2',
  'VAR L3 (VAR)': 'VAR_L3',
  'Reactive Energy (KVARh)': 'KVARh',
  'Frequency (Hz)': 'HZ',
  analyzer_a2s: {
    'V L1-N (V)': 'V_L1_N',
    'V L2-N (V)': 'V_L2_N',
    'V L3-N (V)': 'V_L3_N'
  },
  analyzer_ai: {
    'Simple voltage:V1 (V)': 'V_L1_N',
    'Simple voltage:V2 (V)': 'V_L2_N',
    'Simple voltage:V3 (V)': 'V_L3_N'
  }
}

function _invColumnNames (key, analyzer) {
  if (!key) {
    return undefined
  }
  if (analyzer && analyzer.length > 0 && _columnNames['analyzer_' + analyzer]) {
    for (let i = 0; i < Object.keys(_columnNames['analyzer_' + analyzer]).length; ++i) {
      let tmp = Object.keys(_columnNames['analyzer_' + analyzer])[i]
      if (_columnNames['analyzer_' + analyzer][tmp] === key.trim()) {
        return tmp
      }
    }
  }
  for (let i = 0; i < Object.keys(_columnNames).length; ++i) {
    let tmp = Object.keys(_columnNames)[i]
    if (!tmp.startsWith('analyzer_')) {
      if (_columnNames[tmp] === key.trim()) {
        return tmp
      }
    }
  }
  return undefined
}

router.put('/data/:machine/:analyzer', secured, function (req, res) {
  if (!req.body || req.body.length === 0) {
    return res.status(500).send('Empty body.')
  }
  if (analyzers.indexOf(req.params.analyzer) === -1) {
    return res.status(500).send(new Error('Analyzer not handled.'))
  }
  _putData(req.params.machine, req.params.analyzer, req.body, function (err) {
    if (err) {
      return res.status(500).send(err)
    } else {
      return res.status(200).send('Done!')
    }
  })
})

let __infoCache = {}

function _getInfo (machine, analyzer, callback) {
  if (!callback) {
    logger.debug('No callback provided.')
    return
  }
  if (!machine || !analyzer) {
    logger.debug('Data not valid.')
    callback(new Error('Data not valid.'), null)
    return
  }
  if (__infoCache[machine + '@' + analyzer]) {
    callback(null, __infoCache[machine + '@' + analyzer])
    return
  }

  let inizio = moment()

  let cmd = `${process.env.RRD_PATH}/bin/rrdtool info ${process.env.DATA_PATH}/ee${machine}_${analyzer}.rrd | grep type`
  exec(cmd, function (err, body) {
    let result = []
    if (err) {
      logger.error('Error while executing the command.')
      console.warn(err)
    } else {
      body.split('\n').forEach(function (row) {
        if (row && row.length > 0 && row.indexOf('[') > -1) {
          let tmp = {
            name: row.split('[')[1].split(']')[0],
            type: row.split('[')[1].split(']')[1].split('"')[1]
          }
          result.push(tmp)
        }
      })
    }
    if (!err) {
      __infoCache[machine + '@' + analyzer] = result
    }
    callback(err, result)
    logger.trace(`_getInfo('${machine}', '${analyzer}') took ${duration(inizio, moment())}.`)
    return
  })
}

function _putData (machine, analyzer, body, callback) {
  if (!callback) {
    logger.debug('No callback provided.')
    return
  }
  if (!machine || !analyzer || !body || (Array.isArray(body) && body.length === 0)) {
    logger.debug('Data not valid.')
    callback(new Error('Data not valid.'))
    return
  }

  let inizio = moment()

  _getInfo(machine, analyzer, function (err, data) {
    if (err) {
      callback(err)
      return
    } else {
      let cmd = `${process.env.RRD_PATH}/bin/rrdtool update --skip-past-updates ${process.env.DATA_PATH}/ee${machine}_${analyzer}.rrd`
      let atLeastOne = false
      if (!Array.isArray(body)) {
        body = [ body ]
      }
      body.forEach(function (body) {
        if (body['Date/hour']) {
          atLeastOne = true
          let input = []
          input.push(moment.utc(body['Date/hour']).format('X'))
          for (let j = 0; j < data.length; ++j) {
            let bodyKey = _invColumnNames(data[j].name, analyzer)
            if (bodyKey) {
              let tmp = body[bodyKey] || body[bodyKey + ' ']
              if (!tmp) {
                tmp = 0
              }
              if (data[j].type === 'COUNTER') {
                tmp = Math.round(tmp)
              }
              input.push(tmp)
            }
          }
          cmd += ` ${input.join(':')}`
        }
      })
      if (atLeastOne) {
        exec(cmd, function (err, body) {
          if (err) {
            logger.error('Error while executing the command.')
            console.warn(err)
          }
          callback(err)
          logger.trace(`_putData('${machine}', '${analyzer}') took ${duration(inizio, moment())}.`)
          return
        })
      } else {
        callback(new Error('No date/hour found.'))
        logger.trace(`_putData('${machine}', '${analyzer}') took ${duration(inizio, moment())}.`)
        return
      }
    }
  })
}

function _getData (machine, analyzer, from, to, values, fields, callback) {
  if (!callback) {
    logger.debug('No callback provided.')
    return
  }
  if (!machine || !analyzer) {
    logger.debug('Data not valid.')
    callback(new Error('Data not valid.'), null)
    return
  }

  let inizio = moment()

  from = from || 'now-7d'
  to = to || 'now'
  values = values || 1000

  _getInfo(machine, analyzer, function (err, data) {
    if (err) {
      callback(err, [])
      return
    }
    let cmd = `${process.env.RRD_PATH}/bin/rrdtool xport --start ${from} --end ${to} --maxrows ${values} --json`
    data.forEach(function (variable) {
      if (fields && Array.isArray(fields) && fields.length > 0 && fields.indexOf(_invColumnNames(variable.name, analyzer) || variable.name) > -1) {
        cmd += ` DEF:${variable.name}=${process.env.DATA_PATH}/ee${machine}_${analyzer}.rrd:${variable.name}:${(variable.type === 'COUNTER') ? 'LAST' : 'AVERAGE'}`
      }
    })
    data.forEach(function (variable) {
      if (fields && Array.isArray(fields) && fields.length > 0 && fields.indexOf(_invColumnNames(variable.name, analyzer) || variable.name) > -1) {
        cmd += ` XPORT:${variable.name}:"${(_invColumnNames(variable.name, analyzer) || variable.name)}"`
      }
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
        logger.trace(`_getData('${machine}', '${analyzer}', '${from}', '${to}') took ${duration(inizio, moment())}.`)
        return
      }

      let result = []
      let timestamp = body.meta.start
      let step = body.meta.step
      let legend = body.meta.legend
      body.data.forEach(function (row) {
        let atLeastOne = false
        let tmp = {
          '_id': (parseInt(timestamp) * 1000).toString(),
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
      logger.trace(`_getData('${machine}', '${analyzer}', '${from}', '${to}') took ${duration(inizio, moment())}.`)
    })
  })
}

function _createFile (machine, analyzer, callback) {
  if (!callback) {
    logger.debug('No callback provided.')
    return
  }
  if (!machine || !analyzer || ['ao', 'a2s', 'ai'].indexOf(analyzer) === -1) {
    logger.debug('Data not valid.')
    callback(new Error('Data not valid.'), null)
    return
  }

  let inizio = moment()

  let cmd = `${process.env.RRD_PATH}/bin/rrdtool create ${process.env.DATA_PATH}/ee${machine}_${analyzer}.rrd `
  if (analyzer === 'ao') {
    cmd +=
    '--step 60 \
    --start 1451606400 \
    DS:V_L1_N:GAUGE:240:U:U \
    DS:V_L2_N:GAUGE:240:U:U \
    DS:V_L3_N:GAUGE:240:U:U \
    DS:V_L1_L2:GAUGE:240:U:U \
    DS:V_L2_L3:GAUGE:240:U:U \
    DS:V_L3_L1:GAUGE:240:U:U \
    DS:V_TOT:GAUGE:240:U:U \
    DS:A_L1:GAUGE:240:U:U \
    DS:A_L2:GAUGE:240:U:U \
    DS:A_L3:GAUGE:240:U:U \
    DS:A_MAX:GAUGE:240:U:U \
    DS:A_N:GAUGE:240:U:U \
    DS:W_L1:GAUGE:240:U:U \
    DS:W_L2:GAUGE:240:U:U \
    DS:W_L3:GAUGE:240:U:U \
    DS:W_TOT:GAUGE:240:U:U \
    DS:VA_L1:GAUGE:240:U:U \
    DS:VA_L2:GAUGE:240:U:U \
    DS:VA_L3:GAUGE:240:U:U \
    DS:VA_TOT:GAUGE:240:U:U \
    DS:VAR_L1:GAUGE:240:U:U \
    DS:VAR_L2:GAUGE:240:U:U \
    DS:VAR_L3:GAUGE:240:U:U \
    DS:VAR_TOT:GAUGE:240:U:U \
    DS:KWh:COUNTER:240:U:U \
    DS:KVARh:COUNTER:240:U:U \
    DS:HZ:GAUGE:240:U:U \
    RRA:AVERAGE:0.5:1:1600000'
  } else if (analyzer === 'ai') {
    cmd +=
    '--step 60 \
    --start 1451606400 \
    DS:V_L1_N:GAUGE:240:U:U \
    DS:V_L2_N:GAUGE:240:U:U \
    DS:V_L3_N:GAUGE:240:U:U \
    DS:TEMP:GAUGE:240:U:U \
    RRA:AVERAGE:0.5:1:1600000'
  } else if (analyzer === 'a2s') {
    cmd +=
    '--step 2 \
    --start 1451606400 \
    DS:V_L1_N:GAUGE:8:U:U \
    DS:V_L2_N:GAUGE:8:U:U \
    DS:V_L3_N:GAUGE:8:U:U \
    DS:W_TOT:GAUGE:8:U:U \
    DS:VAR_TOT:GAUGE:8:U:U \
    DS:KWh:COUNTER:8:U:U \
    RRA:AVERAGE:0.5:1:48000000'
  }
  exec(cmd, function (err, body) {
    if (err) {
      logger.error('Error while executing the command.')
      console.warn(err)
    }
    callback(err)
    logger.trace(`_createFile('${machine}', '${analyzer}') took ${duration(inizio, moment())}.`)
    return
  })
}

module.exports = router
