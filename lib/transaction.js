const Operator = require('./operator');

class AbcTransaction extends Operator {
  constructor(conn) {
    super()
    this.conn = conn;
    this.isCommit = false;
    this.isRollback = false;
  }


  async commit() {
    this._check();
    try {
      return await this.conn.commit();
    } finally {
      this.conn.release();
      this.conn = null;
    }
  }

  async rollback() {
    this._check();
    try {
      return await this.conn.rollback();
    } finally {
      this.conn.release();
      this.conn = null;
    }
  }

  async _query(sql) {
    this._check();
    return await this.conn._query(sql);
  }

  _check() {
    if (!this.conn) {
      throw new Error('transaction was commit or rollback');
    }
  };
}


module.exports = AbcTransaction