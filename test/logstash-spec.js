const assert = require('assert');
const sinon = require('sinon');
const Logstash = require('../src/index');
const { chain } = require('logtify')();

const { Message } = chain;

describe('Logstash chain link ', () => {
  before(() => {
    delete process.env.LOGSTASH_HOST;
    delete process.env.LOGSTASH_PORT;
    delete process.env.LOGSTASH_LOGGING;
    delete process.env.MIN_LOG_LEVEL;
    delete process.env.LOG_TIMESTAMP;
    delete process.env.LOG_ENVIRONMENT;
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_REQID;
  });

  beforeEach(() => {
    const logstashPackage = Logstash();
    this.LogstashLink = logstashPackage.class;
  });

  afterEach(() => {
    delete process.env.LOGSTASH_HOST;
    delete process.env.LOGSTASH_PORT;
    delete process.env.LOGSTASH_LOGGING;
    delete process.env.MIN_LOG_LEVEL;
    delete process.env.MIN_LOG_LEVEL_LOGSTASH;
  });

  it('should return configs and a constructor', () => {
    const logstashPackage = Logstash();
    assert.equal(typeof logstashPackage, 'object');
    assert.deepEqual(logstashPackage.config, { LOGSTASH_HOST: undefined, LOGSTASH_PORT: undefined });
    assert.equal(typeof logstashPackage.class, 'function');
  });

  it('should return given configs and a constructor', () => {
    const logstashPackage = Logstash({ SOME_THING: '123' });
    assert.equal(typeof logstashPackage, 'object');
    assert.deepEqual(logstashPackage.config, { SOME_THING: '123', LOGSTASH_HOST: undefined, LOGSTASH_PORT: undefined });
    assert.equal(typeof logstashPackage.class, 'function');
  });

  it('should not throw if no settings are given', () => {
    const logstash = new this.LogstashLink({});
    assert.equal(logstash.winston, undefined);
  });

  it('should expose its main functions', () => {
    const logstash = new this.LogstashLink({});
    assert.equal(typeof logstash, 'object');
    assert.equal(typeof logstash.next, 'function');
    assert.equal(typeof logstash.isReady, 'function');
    assert.equal(typeof logstash.link, 'function');
    assert.equal(typeof logstash.isReady, 'function');
    assert.equal(typeof logstash.isEnabled, 'function');
    assert.equal(typeof logstash.handle, 'function');
  });

  it('should print out a warning if no token provided', () => {
    const spy = sinon.spy(console, 'warn');
    const logstash = new this.LogstashLink({});
    assert(spy.calledWith('Logstash logging was not initialized due to missing LOGSTASH_HOST or LOGSTASH_PORT'));
    assert.equal(logstash.winston, undefined);
  });

  it('should not be ready if no host provided', () => {
    const logstash = new this.LogstashLink({ LOGSTASH_PORT: 3000 });
    assert(!logstash.isReady());
    assert.equal(logstash.winston, undefined);
  });

  it('should not be ready if no port provided', () => {
    const logstash = new this.LogstashLink({ LOGSTASH_HOST: 'hello.world' });
    assert(!logstash.isReady());
    assert.equal(logstash.winston, undefined);
  });

  it('should be ready if all configs provided', () => {
    const logstash = new this.LogstashLink({
      LOGSTASH_HOST: 'hello.world',
      LOGSTASH_PORT: 3000
    });
    assert(logstash.isReady());
    assert.notEqual(logstash.winston, undefined);
  });

  it('should be ready if all configs provided [env]', () => {
    process.env.LOGSTASH_HOST = 'hello.world';
    process.env.LOGSTASH_PORT = '3000';
    const chainLink = Logstash({});
    const logstash = new this.LogstashLink(chainLink.config);
    assert.equal(logstash.isReady(), true);
    assert.notEqual(logstash.winston, undefined);
  });

  it('should indicate if it is switched on/off [settings]', () => {
    let logstash = new this.LogstashLink({ LOGSTASH_LOGGING: true });
    assert.equal(logstash.isEnabled(), true);
    logstash = new this.LogstashLink({ LOGSTASH_LOGGING: false });
    assert.equal(logstash.isEnabled(), false);
    logstash = new this.LogstashLink(null);
    assert.equal(logstash.isEnabled(), true);
  });

  it('should indicate if it is switched on/off [envs]', () => {
    const logstash = new this.LogstashLink(null);
    assert.equal(logstash.isEnabled(), true);
    process.env.LOGSTASH_LOGGING = true;
    assert.equal(logstash.isEnabled(), true);
    process.env.LOGSTASH_LOGGING = false;
    assert.equal(logstash.isEnabled(), false);
  });

  it('should indicate if it is switched on/off [envs should have more privilege]', () => {
    const logstash = new this.LogstashLink({ LOGSTASH_LOGGING: true });
    assert.equal(logstash.isEnabled(), true);
    process.env.LOGSTASH_LOGGING = false;
    assert.equal(logstash.isEnabled(), false);
    process.env.LOGSTASH_LOGGING = undefined;
    assert.equal(logstash.isEnabled(), true);
  });

  it('should not break down if null is notified', () => {
    const logstash = new this.LogstashLink({
      LOGSTASH_HOST: 'hello.world',
      LOGSTASH_PORT: 3000,
      LOGSTASH_LOGGING: true
    });
    logstash.handle(null);
  });

  it('should log message if LOGSTASH_LOGGING = true', () => {
    const logstash = new this.LogstashLink({
      LOGSTASH_HOST: 'hello.world',
      LOGSTASH_PORT: 3000,
      LOGSTASH_LOGGING: true
    });
    const spy = sinon.spy(logstash.winston.log);
    logstash.winston.log = spy;
    const message = new Message();
    logstash.handle(message);
    assert(spy.called);
  });

  it('should not log message if LOGSTASH_LOGGING = false', () => {
    const logstash = new this.LogstashLink({
      LOGSTASH_HOST: 'hello.world',
      LOGSTASH_PORT: 3000,
      LOGSTASH_LOGGING: false
    });
    const spy = sinon.spy(logstash.winston, 'log');
    const message = new Message();
    logstash.handle(message);
    assert(!spy.called);
  });

  it('should not log if message level < MIN_LOG_LEVEL [settings]', () => {
    const logstash = new this.LogstashLink({
      LOGSTASH_HOST: 'hello.world',
      LOGSTASH_PORT: 3000,
      LOGSTASH_LOGGING: true,
      MIN_LOG_LEVEL: 'error'
    });
    const spy = sinon.spy(logstash.winston.log);
    logstash.winston.log = spy;
    const message = new Message();
    logstash.handle(message);
    assert(!spy.called);
  });

  it('should not log if message level < MIN_LOG_LEVEL [envs]', () => {
    const logstash = new this.LogstashLink({
      LOGSTASH_HOST: 'hello.world',
      LOGSTASH_PORT: 3000,
      LOGSTASH_LOGGING: true
    });
    const spy = sinon.spy(logstash.winston.log);
    logstash.winston.log = spy;
    const message = new Message();
    process.env.MIN_LOG_LEVEL = 'error';
    logstash.handle(message);
    assert(!spy.called);
  });

  it('should not log if message level >= MIN_LOG_LEVEL_LOGSTASH but < MIN_LOG_LEVEL [envs]', () => {
    const logstash = new this.LogstashLink({
      LOGSTASH_HOST: 'hello.world',
      LOGSTASH_PORT: 3000,
      LOGSTASH_LOGGING: true
    });
    const spy = sinon.spy(logstash.winston.log);
    logstash.winston.log = spy;
    const message = new Message('warn');
    process.env.MIN_LOG_LEVEL = 'error';
    process.env.MIN_LOG_LEVEL_LOGSTASH = 'warn';
    logstash.handle(message);
    assert(spy.called);
  });

  it('should log if message level = MIN_LOG_LEVEL [envs]', () => {
    const logstash = new this.LogstashLink({
      LOGSTASH_HOST: 'hello.world',
      LOGSTASH_PORT: 3000,
      LOGSTASH_LOGGING: true
    });
    const spy = sinon.spy(logstash.winston.log);
    logstash.winston.log = spy;
    const message = new Message('error');
    process.env.MIN_LOG_LEVEL = 'error';
    logstash.handle(message);
    assert(spy.called);
  });

  it('should log if message level > MIN_LOG_LEVEL [envs]', () => {
    const logstash = new this.LogstashLink({
      LOGSTASH_HOST: 'hello.world',
      LOGSTASH_PORT: 3000,
      LOGSTASH_LOGGING: true
    });
    const spy = sinon.spy(logstash.winston.log);
    logstash.winston.log = spy;
    const message = new Message('error');
    process.env.MIN_LOG_LEVEL = 'warn';
    logstash.handle(message);
    assert(spy.called);
  });

  it('should not throw if next link does not exist', () => {
    const chainLink = new this.LogstashLink();
    chainLink.next();
  });

  it('should link a new chainLink', () => {
    const chainLink = new this.LogstashLink();
    const spy = sinon.spy(sinon.stub());
    const mock = {
      handle: spy
    };
    assert.equal(chainLink.nextLink, null);
    chainLink.link(mock);
    assert.equal(typeof chainLink.nextLink, 'object');
    chainLink.next();
    assert(spy.called);
  });
});
