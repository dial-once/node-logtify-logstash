# logtify-logstash
Logstash chain link for logtify logger

## Installation
```
npm i -S @dialonce/logtify-logstash
```

## Usage
When requiring a [logtify](https://github.com/dial-once/node-logtify) module, include it's chainLink into the chain

**Variant 1** (Settings passed as global logger settings:): 
```js
const { LogstashChainLink } = require('@dialonce/logtify-logstash');
const { chain, logger } = require('@dialonce/logtify')({
  chainLinks: [ LogentriesChainLink ]
});
```

**Variant 2** (Settings passed into a chain link wrapper):
```js
const Logstash = require('@dialonce/logtify-logstash');
const { chain, logger } = require('@dialonce/logtify')({
  chainLinks: [ Logstash({ /* CONFIG */ })]
});

logger.log('error', new Error('Test error'));
logger.info('Hello world!');
```
The chainLink will make sure that a message will be sent to Logstash if:
* ``message.level >= 'MIN_LOG_LEVEL_LOGSTASH' || 'MIN_LOG_LEVEL'``
* ``process.env.LOGSTASH_LOGGING === 'true' || settings.LOGSTASH_LOGGING === true``

## Configuration
**Environment variables**:
* ``process.env.LOGSTASH_LOGGING = 'true|false'`` - Switching on / off the chain link
* ``process.env.MIN_LOG_LEVEL_LOGSTASH = 'silly|verbose|info|warn|error'``

**Settings**:
```js
{
  LOGSTASH_LOGGING: true|false,
  MIN_LOG_LEVEL_LOGSTASH: 'silly|verbose|info|warn|error'
}
```
