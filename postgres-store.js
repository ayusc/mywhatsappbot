const { Pool } = require('pg');

class PostgresStore {
    constructor({ session = 'session' } = {}) {
        this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
        this.session = session;
    }

    async init() {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                data JSONB
            );
        `);
    }

    async save(data) {
        await this.pool.query(
            `INSERT INTO sessions (id, data) VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
            [this.session, data]
        );
    }

    async get() {
        const res = await this.pool.query(`SELECT data FROM sessions WHERE id = $1`, [this.session]);
        return res.rows.length ? res.rows[0].data : null;
    }

    async delete() {
        await this.pool.query(`DELETE FROM sessions WHERE id = $1`, [this.session]);
    }

    async sessionExists() {
        const res = await this.pool.query(`SELECT 1 FROM sessions WHERE id = $1 LIMIT 1`, [this.session]);
        return res.rowCount > 0;
    }
}

module.exports = PostgresStore;
