const logtify = require('logtify');
const sinon = require('sinon');
const assert = require('assert');
const Logstash = require('../src/index');

describe('Logstash inside chain', () => {
  it('should be able to insert into a chain without a conflict [manual push] [switched off]', () => {
    const { chain, logger } = logtify({});
    const LogstashLinkClass = Logstash().class;
    const logstashChainLink = new LogstashLinkClass({}, new chain.Utility());
    assert.notEqual(logstashChainLink.winston, undefined);
    const spy = sinon.spy(logstashChainLink, 'handle');
    const index = chain.push(logstashChainLink);
    assert.equal(index, chain.chainLinks.length - 1);
    chain.link();
    logger.info('Hello world');
    assert(spy.called);
  });

  it('should be able to insert into a chain without a conflict [manual push] [switched on]', () => {
    const { chain } = logtify({});
    const logstashPackage = Logstash({
      LOGSTASH_LOGGING: true
    });
    const logstashLinkConfig = logstashPackage.config;
    const LogstashLinkClass = logstashPackage.class;
    const logstashChainLink = new LogstashLinkClass(logstashLinkConfig, new chain.Utility());
    assert.notEqual(logstashChainLink.winston, undefined);
    const spy = sinon.spy(logstashChainLink, 'handle');
    const index = chain.push(logstashChainLink);
    assert.equal(index, chain.chainLinks.length - 1);
    chain.link();
    chain.log(null, 'Hello world');
    assert(spy.called);
  });

  it('should be able to insert into a chain without a conflict [auto push v2] [switched on]', () => {
    const { chain } = logtify({
      chainLinks: [
        Logstash({
          LOGSTASH_LOGGING: true
        })
      ]
    });
    assert.equal(chain.chainLinks.length, 2);
    const logstashChainLink = chain.chainEnd;
    assert.notEqual(logstashChainLink.winston, undefined);
    const spy = sinon.spy(logstashChainLink, 'handle');
    chain.log(null, 'Hello world');
    assert(spy.called);
  });

  it('should be able to insert into a chain without a conflict [auto push v1] [switched on]', () => {
    const { chain } = logtify({
      LOGSTASH_LOGGING: true,
      chainLinks: [Logstash().class]
    });
    assert.equal(chain.chainLinks.length, 2);
    const logstashChainLink = chain.chainEnd;
    assert.notEqual(logstashChainLink.winston, undefined);
    const spy = sinon.spy(logstashChainLink, 'handle');
    chain.log(null, 'Hello world');
    assert(spy.called);
  });

  it('should be able to insert into a chain without a conflict [auto push v1] [switched on]', () => {
    const { chain } = logtify({
      LOGSTASH_LOGGING: true,
      chainLinks: [Logstash.LogstashChainLink]
    });
    assert.equal(chain.chainLinks.length, 2);
    const logstashChainLink = chain.chainEnd;
    assert.notEqual(logstashChainLink.winston, undefined);
    const spy = sinon.spy(logstashChainLink, 'handle');
    chain.log(null, 'Hello world');
    assert(spy.called);
  });
});
