const winston = require('winston');
require('winston-logstash');

/**
  @class Logstash
  A Logstash logger chain link

  Has the following configurations (either env var or settings param):
  - LOGSTASH_LOGGING {'true'|'false'} - switches on / off the use of this chain link
  - MIN_LOG_LEVEL_LOGSTASH = {'silly'|'verbose'|'debug'|'info'|'warn'|'error'} - min log level of a message to log
  This config has a higher priority than a global DEFAULT_LOG_LEVEl config
  @see ChainLink @class for info on the log level priorities
  If a message's level is >= than a MIN_LOG_LEVEL - it will be notified. Otherwise - skipped

  Environment variables have a higher priority over a settings object parameters
**/
class Logstash {
  /**
    @constructor
    Construct an instance of a Logstash @class
    @param configs {Object} - LoggerChain configuration object
    @param utility {Object} - Logtify common rules object
  **/
  constructor(configs, utility) {
    this.settings = configs || {};
    this.utility = utility;
    if (this.settings.LOGSTASH_HOST && this.settings.LOGSTASH_PORT) {
      this.winston = new winston.Logger();
      this.winston.add(winston.transports.Logstash, {
        port: parseInt(this.settings.LOGSTASH_PORT, 10),
        host: this.settings.LOGSTASH_HOST
      });
    } else {
      console.warn('Logstash logging was not initialized due to a missing token');
    }
    this.name = 'LOGSTASH';
  }

  /**
    @function next
    @param message {Object} - a message package object
    Envoke the handle @function of the next chain link if provided
  **/
  next(message) {
    if (this.nextLink) {
      this.nextLink.handle(message);
    }
  }

  /**
    @function link
    Links current chain link to a next chain link
    @param nextLink {Object} - an optional next link for current chain link
  **/
  link(nextLink) {
    this.nextLink = nextLink;
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
    return ['true', 'false'].includes(process.env.LOGSTASH_LOGGING) ?
      process.env.LOGSTASH_LOGGING === 'true' : !!this.settings.LOGSTASH_LOGGING;
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
      const logLevels = this.utility.logLevels;
      const messageLevel = logLevels.has(content.level) ? content.level : logLevels.get('default');
      const minLogLevel = this.utility.getMinLogLevel(this.settings, this.name);
      if (logLevels.get(messageLevel) >= logLevels.get(minLogLevel)) {
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
  return {
    class: Logstash,
    config: configs
  };
};

module.exports.LogstashChainLink = Logstash;
