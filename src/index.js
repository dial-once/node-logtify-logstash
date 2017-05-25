const winston = require('winston');
require('winston-logstash');

class Logstash {
  constructor(configs, utility) {
    this.settings = configs || {};
    this.utility = utility;
    this.winston = new winston.Logger();
    this.winston.add(winston.transports.Logstash, {
      port: 5000,
      host: 'logstash.dialonce.net'
    });
    this.name = 'LOGSTASH';
  }

  next(message) {
    if (this.nextLink) {
      this.nextLink.handle(message);
    }
  }

  link(nextLink) {
    this.nextLink = nextLink;
  }

  isReady() {
    return !!this.winston;
  }

  isEnabled() {
    return ['true', 'false'].includes(process.env.LOGSTASH_LOGGING) ?
      process.env.LOGSTASH_LOGGING === 'true' : !!this.settings.LOGSTASH_LOGGING;
  }

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

module.exports = (config) => {
  const configs = Object.assign({}, config);
  return {
    class: Logstash,
    config: configs
  };
};

module.exports.LogstashChainLink = Logstash;
