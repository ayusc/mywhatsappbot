// postgres-store.js
const { Store } = require("whatsapp-web.js");
const { Pool } = require("pg");

class PostgresStore extends Store {
  constructor({ pool, tableName = "session" }) {
    super();
    this.pool = pool;
    this.tableName = tableName;
    this.ready = this.init();
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        data JSONB
      );
    `);
  }

  async save(id, data) {
    await this.ready;
    await this.pool.query(
      `INSERT INTO ${this.tableName}(id, data)
       VALUES($1, $2)
       ON CONFLICT (id)
       DO UPDATE SET data = EXCLUDED.data`,
      [id, data]
    );
  }

  async get(id) {
    await this.ready;
    const res = await this.pool.query(
      `SELECT data FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return res.rows[0]?.data ?? null;
  }

  async delete(id) {
    await this.ready;
    await this.pool.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }

  async list() {
    await this.ready;
    const res = await this.pool.query(`SELECT id FROM ${this.tableName}`);
    return res.rows.map((row) => row.id);
  }
}

module.exports = PostgresStore;
