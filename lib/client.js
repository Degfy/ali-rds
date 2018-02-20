const { promisify } = require('util');
const mysql = require('mysql');
// const wrap = require('co-wrap-all');
const Operator = require('./operator');
const AbcConnection = require('./connection');
const AbcTransaction = require('./transaction');

class AbcClient extends Operator {
  constructor(options) {
    super(options)
    this.pool = mysql.createPool(options);
    [
      'query',
      'getConnection',
    ].forEach(method => {
      this.pool[method] = promisify(this.pool[method]);
    });
  }

  _query(sql) {
    return this.pool.query(sql);
  }

  async getConnection() {
    const conn = await this.pool.getConnection();
    return new AbcConnection(conn);
  }

  /**
   * Begin a transaction
   *
   * @return {Transaction} transaction instance
   */
  async beginTransaction() {
    const conn = await this.getConnection();
    try {
      await conn.beginTransaction();
    } catch (err) {
      conn.release();
      throw err;
    }

    return new AbcTransaction(conn);
  }

  /**
   * Auto commit or rollback on a transaction scope
   *
   * @param {Function} scope - scope with code
   * @param {Object} [ctx] - transaction env context, like koa's ctx.
   *   To make sure only one active transaction on this ctx.
   * @return {Object} - scope return result
   */
  async beginTransactionScope(scope, ctx) {
    ctx = ctx || {};
    if (!ctx._transactionConnection) {
      ctx._transactionConnection = await this.beginTransaction();
      ctx._transactionScopeCount = 1;
    } else {
      ctx._transactionScopeCount++;
    }


    const tran = ctx._transactionConnection;
    try {
      const result = await scope(tran);
      ctx._transactionScopeCount--;
      if (ctx._transactionScopeCount === 0) {
        ctx._transactionConnection = null;
        await tran.commit();
      }
      return result;
    } catch (err) {
      if (ctx._transactionConnection) {
        ctx._transactionConnection = null;
        await tran.rollback();
      }
      throw err;
    }
  }

  end(callback) {
    // callback style
    if (callback) {
      return this.pool.end(callback);
    }

    // promise style
    const that = this;
    return new Promise(function(resolve, reject) {
      that.pool.end(function(err) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
}

module.exports = AbcClient;