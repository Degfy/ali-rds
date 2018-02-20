const { promisify } = require('util');
const Operator = require('./operator');

class AbcConnection extends Operator {
  constructor(conn) {
    super()
    this.conn = conn;
    if (!conn.__warped) {
      [
        'query',
        'beginTransaction',
        'commit',
        'rollback',
      ].forEach(key => {
        this.conn[key] = promisify(this.conn[key]);
      });
      conn.__warped = true;
    }
  }

  release() {
    this.conn.release();
  }

  _query(sql) {
    return this.conn.query(sql);
  }

  beginTransaction() {
    return this.conn.beginTransaction();
  }

  commit() {
    return this.conn.commit();
  }

  rollback() {
    return this.conn.rollback();
  }
}

module.exports = AbcConnection;