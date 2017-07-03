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

## Configuration
**Environment variables**:
* ``process.env.LOGSTASH_HOST`` - logstash endpoint host
* ``process.env.LOGSTASH_PORT`` - logstash endpoint port
* ``process.env.LOGSTASH_LOGGING = 'true|false'`` - Switching on / off the subscriber. On by default
* ``process.env.MIN_LOG_LEVEL_LOGSTASH = 'silly|verbose|info|warn|error'``

**Settings**:
```js
{
  LOGSTASH_HOST: 'app.on.thenet',
  LOGSTASH_PORT: 3000,
  LOGSTASH_LOGGING: true|false, // true by default
  MIN_LOG_LEVEL_LOGSTASH: 'silly|verbose|info|warn|error'
}
```
