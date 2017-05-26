const sinon = require('sinon');

function Message(logLevel, message, ...metas) {
  // if plain text
  this.payload = {
    level: logLevel || 'info',
    text: message || '',
    meta: {
      instanceId: process.env.HOSTNAME,
      notify: true
    }
  };

  // if error
  if (message instanceof Error) {
    this.payload.text = message.message || 'Error: ';
    this.payload.meta.stack = message.stack;
    this.payload.error = message;
  }
  // all metas are included as message meta
  if (metas.length > 0) {
    const metaData = metas.reduce((sum, next) => Object.assign({}, sum, next));
    Object.assign(this.payload.meta, metaData);
  }
  // originally deep-freeze is used
  this.payload = Object.freeze(this.payload);
}

Message.prototype.getPrefix = sinon.stub().returns('');

module.exports = Message;
