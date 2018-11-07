const Operator = require('./operator');

class AbcTransaction extends Operator {
  constructor(conn) {
    super()
    this.conn = conn;
    this.isCommit = false;
    this.isRollback = false;
  }


  async commit() {
    await this._check();
    try {
      this.isCommit = true;
      return await this.conn.commit();
    } finally {
      this.conn.release();
      this.conn = null;
    }
  }

  async rollback() {
    await this._check();
    try {
      this.isRollback = true;
      this._rollbacking  = this.conn.rollback();
      return await this._rollbacking;
    } finally {
      this.conn.release();
      this.conn = null;
    }
  }

  async _query(sql) {
    await this._check();
    return await this.conn._query(sql);
  }

  async _check() {
    if (this.isCommit || this.isRollback || !this.conn) {
      if(this.conn && this._rollbacking){
        await this._rollbacking;
      }
      throw new Error('transaction was commit or rollback');
    }
  };
}


module.exports = AbcTransaction