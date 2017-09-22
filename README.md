# logtify-logstash
[![CircleCI](https://circleci.com/gh/dial-once/node-logtify-logstash.svg?style=svg)](https://circleci.com/gh/dial-once/node-logtify-logstash)

Logstash subscriber for logtify logger

## Installation
```
npm i -S logtify-logstash
```

## Usage
Used with[logtify](https://github.com/dial-once/node-logtify) module.

```js
require('logtify-logstash')({ LOGSTASH_PORT: 3000, LOGSTASH_HOST: 'app.on.thenet' });
const { stream, logger } = require('logtify')();
logger.log('error', new Error('Test error'));
logger.info('Hello world!');
```

The subscriber will make sure that a message will be sent to Logstash if:
* ``message.level >= 'MIN_LOG_LEVEL_LOGSTASH' || 'MIN_LOG_LEVEL'``
* ``process.env.LOGSTASH_LOGGING !== 'true' || settings.LOGSTASH_LOGGING !== true``


## Usage within child_process.fork()
Since within child_process we need to pipe socket's tcp channel, the best way to manage logging is to transfer them via ipc channel:

```js
const cp = require('child_process');
const { stream } = require('logtify')();

// creating a forked process
const process = cp.fork('<path>/some.js', [], {
  env: { FORKED: true }
});

process.on('message', data => {
  // passing message from child to logger
  stream.log(data.level, data.message, ...data.meta)
});

```

```js
// some.js

const { logger, stream } = require('logtify')();

// if from forked process
if (process.env.FORKED) {
  stream.log = (level, message, ...meta) => {
    // if ipc channel was not closed
    if (process.channel) {
      process.send({
        level,
        message,
        meta: meta || []
      });
    }
  };
}


logger.info('Hello world', { from: 'forked_process' });
```

**Settings**:
Module can be configured by both env variables or config object. However, env variables have a higher priority.
```js
{
  LOGSTASH_HOST: 'app.on.thenet',
  LOGSTASH_PORT: 3000,
  LOGSTASH_LOGGING: true|false, // true by default
  MIN_LOG_LEVEL_LOGSTASH: 'silly|verbose|info|warn|error',
  LOG_TIMESTAMP = 'true'
  LOG_ENVIRONMENT = 'true'
  LOG_LEVEL = 'true'
  LOG_REQID = 'true' // only included when provided with metadata
  LOG_CALLER_PREFIX = 'true' // additional prefix with info about caller module/project/function
  JSONIFY = 'true' // converts metadata to json
}
```
