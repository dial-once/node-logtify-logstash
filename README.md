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
