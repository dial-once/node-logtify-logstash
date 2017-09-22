const winston = require('winston');
const logtify = require('logtify');
require('winston-logstash');

const streamBuffer = logtify.streamBuffer;
const { stream } = logtify();

/**
  @class Logstash
  A Logstash logger subscriber

  Has the following configurations (either env var or settings param):
  - LOGSTASH_LOGGING {'true'|'false'} - switches on / off the use of this subscriber
  - MIN_LOG_LEVEL_LOGSTASH = {'silly'|'verbose'|'debug'|'info'|'warn'|'error'} - min log level of a message to log
  - LOGSTASH_HOST { string } - logstash endpoint host
  - LOGSTASH_PORT { number|string } - logstash tcp port
  This config has a higher priority than a global DEFAULT_LOG_LEVEl config
  @see Subscriber @class for info on the log level priorities
  If a message's level is >= than a MIN_LOG_LEVEL - it will be notified. Otherwise - skipped

  Environment variables have a higher priority over a settings object parameters
**/
class Logstash extends stream.Subscriber {
  /**
    @constructor
    Construct an instance of a Logstash @class
    @param configs {Object} - LoggerStream configuration object
  **/
  constructor(configs) {
    super();
    this.settings = configs || {};
    if (this.settings.LOGSTASH_HOST && this.settings.LOGSTASH_PORT) {
      this.winston = new winston.Logger();
    } else {
      console.warn('Logstash logging was not initialized due to missing LOGSTASH_HOST or LOGSTASH_PORT');
    }

    this.cleanup = this.cleanup.bind(this);

    process.once('exit', this.cleanup);
    process.once('SIGINT', this.cleanup);
    process.once('SIGTERM', this.cleanup);
    process.once('uncaughtException', this.cleanup);

    this.name = 'LOGSTASH';
  }


  /**
    @function isReady
    Check if a subscriber is configured properly and is ready to be used
    @return {boolean}
  **/
  isReady() {
    return this.winston !== undefined;
  }

  connect() {
    if (!this.winston.transports.logstash) {
      this.winston.add(winston.transports.Logstash, {
        port: parseInt(this.settings.LOGSTASH_PORT, 10),
        host: this.settings.LOGSTASH_HOST
      });
    }
  }
  /**
    @function isEnabled
    Check if a subscriber will be used
    Depends on configuration env variables / settings object parameters
    Checks LOGSTASH_LOGGING env / settings object param
    @return {boolean} - if this subscriber is switched on / off
  **/
  isEnabled() {
    const result = ['true', 'false'].includes(process.env.LOGSTASH_LOGGING) ?
      process.env.LOGSTASH_LOGGING === 'true' : this.settings.LOGSTASH_LOGGING;
    return [null, undefined].includes(result) ? true : result;
  }

  /**
    @function handle
    Process a message and log it if the subscriber is switched on and message's log level is >= than MIN_LOG_LEVEL
    Finally, pass the message to the next subscriber if any
    @param message {Object} - message package object
    @see LoggerStream message package object structure description

    This function is NOT ALLOWED to modify the message
    This function HAS to invoke the next() @function and pass the message further along the stream
    This function HAS to check message level priority and skip if lower than MIN_LOG_LEVEL
  **/
  handle(message) {
    if (this.isReady() && this.isEnabled() && message) {
      this.connect();
      const content = message.payload;
      const messageLevel = this.logLevels.has(content.level) ? content.level : this.logLevels.get('default');
      const minLogLevel = this.getMinLogLevel(this.settings, this.name);
      if (this.logLevels.get(messageLevel) >= this.logLevels.get(minLogLevel)) {
        const prefix = message.getPrefix(this.settings);
        let prefixText = !prefix.isEmpty ?
          `[${prefix.timestamp}${prefix.environment}${prefix.logLevel}${prefix.reqId}] ` : '';
        // if prefix contains these props, then caller module prefix was configured by settings/env
        if ({}.hasOwnProperty.call(prefix, 'module') &&
            {}.hasOwnProperty.call(prefix, 'function') &&
            {}.hasOwnProperty.call(prefix, 'project')) {
          prefixText += `[${prefix.project}${prefix.module}${prefix.function}] `;
        }
        const messageText = `${prefixText}${content.text}`;
        const jsonify = process.env.JSONIFY ? process.env.JSONIFY === 'true' : !!this.settings.JSONIFY;
        const metadata = jsonify ? message.stringifyMetadata() : content.meta;
        this.winston.log(messageLevel, messageText, metadata);
      }
    }
  }

  cleanup() {
    if (this.isReady() && this.winston.transports.logstash) {
      this.winston.transports.logstash.close();
      this.winston.remove(winston.transports.Logstash);
    }
  }
}

/**
  @param config {Object} - subscriber configuration
  @return { object } - subscriber object with a class
**/
module.exports = (config) => {
  const configs = Object.assign({
    LOGSTASH_HOST: process.env.LOGSTASH_HOST,
    LOGSTASH_PORT: process.env.LOGSTASH_PORT
  }, config);
  const streamLinkData = {
    class: Logstash,
    config: configs
  };

  streamBuffer.addSubscriber(streamLinkData);
  const mergedConfigs = Object.assign({}, configs, stream.settings);
  stream.subscribe(new Logstash(mergedConfigs));

  return streamLinkData;
};

module.exports.LogstashSubscriber = Logstash;
