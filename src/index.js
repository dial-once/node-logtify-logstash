const winston = require('winston');
const logtify = require('logtify');
require('winston-logstash');

const chainBuffer = logtify.chainBuffer;
const { chain } = logtify();

/**
  @class Logstash
  A Logstash logger chain link

  Has the following configurations (either env var or settings param):
  - LOGSTASH_LOGGING {'true'|'false'} - switches on / off the use of this chain link
  - MIN_LOG_LEVEL_LOGSTASH = {'silly'|'verbose'|'debug'|'info'|'warn'|'error'} - min log level of a message to log
  - LOGSTASH_HOST { string } - logstash endpoint host
  - LOGSTASH_PORT { number|string } - logstash tcp port
  This config has a higher priority than a global DEFAULT_LOG_LEVEl config
  @see ChainLink @class for info on the log level priorities
  If a message's level is >= than a MIN_LOG_LEVEL - it will be notified. Otherwise - skipped

  Environment variables have a higher priority over a settings object parameters
**/
class Logstash extends chain.ChainLink {
  /**
    @constructor
    Construct an instance of a Logstash @class
    @param configs {Object} - LoggerChain configuration object
  **/
  constructor(configs) {
    super();
    this.settings = configs || {};
    if (this.settings.LOGSTASH_HOST && this.settings.LOGSTASH_PORT) {
      this.winston = new winston.Logger();
      this.winston.add(winston.transports.Logstash, {
        port: parseInt(this.settings.LOGSTASH_PORT, 10),
        host: this.settings.LOGSTASH_HOST
      });
    } else {
      console.warn('Logstash logging was not initialized due to missing LOGSTASH_HOST or LOGSTASH_PORT');
    }
    this.name = 'LOGSTASH';
  }


  /**
    @function isReady
    Check if a chain link is configured properly and is ready to be used
    @return {boolean}
  **/
  isReady() {
    return this.winston !== undefined;
  }

  /**
    @function isEnabled
    Check if a chain link will be used
    Depends on configuration env variables / settings object parameters
    Checks LOGSTASH_LOGGING env / settings object param
    @return {boolean} - if this chain link is switched on / off
  **/
  isEnabled() {
    const result = ['true', 'false'].includes(process.env.LOGSTASH_LOGGING) ?
      process.env.LOGSTASH_LOGGING === 'true' : this.settings.LOGSTASH_LOGGING;
    return [null, undefined].includes(result) ? true : result;
  }

  /**
    @function handle
    Process a message and log it if the chain link is switched on and message's log level is >= than MIN_LOG_LEVEL
    Finally, pass the message to the next chain link if any
    @param message {Object} - message package object
    @see LoggerChain message package object structure description

    This function is NOT ALLOWED to modify the message
    This function HAS to invoke the next() @function and pass the message further along the chain
    This function HAS to check message level priority and skip if lower than MIN_LOG_LEVEL
  **/
  handle(message) {
    if (this.isReady() && this.isEnabled() && message) {
      const content = message.payload;
      const messageLevel = this.logLevels.has(content.level) ? content.level : this.logLevels.get('default');
      const minLogLevel = this.getMinLogLevel(this.settings, this.name);
      if (this.logLevels.get(messageLevel) >= this.logLevels.get(minLogLevel)) {
        const prefix = message.getPrefix(this.settings);
        this.winston.log(messageLevel, `${prefix}${content.text}`, content.meta);
      }
    }
    this.next(message);
  }
}

/**
  @param config {Object} - chain link configuration
  @return { object } - chain link object with a class
**/
module.exports = (config) => {
  const configs = Object.assign({
    LOGSTASH_HOST: process.env.LOGSTASH_HOST,
    LOGSTASH_PORT: process.env.LOGSTASH_PORT
  }, config);
  const chainLinkData = {
    class: Logstash,
    config: configs
  };

  chainBuffer.addChainLink(chainLinkData);
  const mergedConfigs = Object.assign({}, configs, chain.settings);
  chain.push(new Logstash(mergedConfigs));

  return chainLinkData;
};

module.exports.LogstashChainLink = Logstash;
