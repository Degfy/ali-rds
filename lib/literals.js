class Literal {
  constructor(text) {
    this.text = text
  }

  toString() {
    return this.text
  }
}


const now = new Literal('now()')

module.exports = {
  Literal,
  now,
}