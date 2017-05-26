function ChainLinkUtility() {
  const levels = [
    ['silly', 0],
    ['verbose', 1],
    ['debug', 2],
    ['info', 3],
    ['warn', 4],
    ['error', 5],
    ['default', 'info']
  ];
  this.logLevels = Object.freeze(new Map(levels));
}

ChainLinkUtility.prototype.getMinLogLevel = (config, chain = '') => {
  const settings = config || {};
  const minLogLevel = process.env[`MIN_LOG_LEVEL_${chain}`] || settings[`MIN_LOG_LEVEL_${chain}`] ||
    process.env.MIN_LOG_LEVEL || settings.MIN_LOG_LEVEL;
  return minLogLevel || 'info';
};

module.exports = ChainLinkUtility;
