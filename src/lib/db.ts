import Database from 'better-sqlite3'
import { join } from 'path'
import { randomUUID } from 'crypto'

const dbPath = join(process.cwd(), 'db', 'custom.db')

const globalForDb = globalThis as unknown as {
  database: Database.Database | undefined
}

function createDatabase() {
  const database = new Database(dbPath)
  database.pragma('journal_mode = WAL')
  database.pragma('foreign_keys = ON')

  // Create tables if they don't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS AcquittalReport (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      totalAmount REAL,
      confidence REAL NOT NULL DEFAULT 0.0,
      summary TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS AcquittalDocument (
      id TEXT PRIMARY KEY,
      reportId TEXT NOT NULL,
      fileName TEXT NOT NULL,
      fileType TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      filePath TEXT NOT NULL,
      extractedData TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (reportId) REFERENCES AcquittalReport(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_doc_reportId ON AcquittalDocument(reportId);

    CREATE TABLE IF NOT EXISTS Issue (
      id TEXT PRIMARY KEY,
      reportId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 0.0,
      severity REAL NOT NULL DEFAULT 0.0,
      resolved INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (reportId) REFERENCES AcquittalReport(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_issue_reportId ON Issue(reportId);
  `)

  return database
}

function getDb() {
  if (!globalForDb.database) {
    globalForDb.database = createDatabase()
  }
  return globalForDb.database
}

function cuid() {
  return randomUUID().replace(/-/g, '').substring(0, 25)
}

// Prisma-compatible wrapper
export const db = {
  acquittalReport: {
    create({ data }: { data: any }) {
      const database = getDb()
      const id = cuid()
      const now = new Date().toISOString()
      const stmt = database.prepare(`
        INSERT INTO AcquittalReport (id, name, status, totalAmount, confidence, summary, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run(id, data.name, data.status || 'PENDING', data.totalAmount ?? null, data.confidence ?? 0.0, data.summary ?? null, now, now)
      return { id, ...data, createdAt: now, updatedAt: now }
    },

    update({ where, data }: { where: { id: string }, data: any }) {
      const database = getDb()
      const now = new Date().toISOString()
      const sets: string[] = []
      const values: any[] = []

      if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name) }
      if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status) }
      if (data.totalAmount !== undefined) { sets.push('totalAmount = ?'); values.push(data.totalAmount) }
      if (data.confidence !== undefined) { sets.push('confidence = ?'); values.push(data.confidence) }
      if (data.summary !== undefined) { sets.push('summary = ?'); values.push(data.summary) }
      sets.push('updatedAt = ?'); values.push(now)
      values.push(where.id)

      const stmt = database.prepare(`UPDATE AcquittalReport SET ${sets.join(', ')} WHERE id = ?`)
      stmt.run(...values)
      return { id: where.id, ...data }
    },

    findMany({ include, orderBy }: { include?: any, orderBy?: any } = {}) {
      const database = getDb()
      const reports = database.prepare('SELECT * FROM AcquittalReport ORDER BY createdAt DESC').all() as any[]

      if (include) {
        return reports.map((report: any) => {
          if (include.documents) {
            report.documents = database.prepare('SELECT * FROM AcquittalDocument WHERE reportId = ?').all(report.id) as any[]
          }
          if (include.issues) {
            report.issues = database.prepare('SELECT * FROM Issue WHERE reportId = ? ORDER BY createdAt DESC').all(report.id) as any[]
            report.issues = report.issues.map((i: any) => ({ ...i, resolved: Boolean(i.resolved) }))
          }
          report.createdAt = new Date(report.createdAt)
          report.updatedAt = new Date(report.updatedAt)
          return report
        })
      }

      return reports.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) }))
    },

    findUnique({ where, include }: { where: { id: string }, include?: any }) {
      const database = getDb()
      const report = database.prepare('SELECT * FROM AcquittalReport WHERE id = ?').get(where.id) as any

      if (!report) return null

      if (include) {
        if (include.documents) {
          report.documents = database.prepare('SELECT * FROM AcquittalDocument WHERE reportId = ?').all(report.id) as any[]
        }
        if (include.issues) {
          report.issues = database.prepare('SELECT * FROM Issue WHERE reportId = ? ORDER BY createdAt DESC').all(report.id) as any[]
          report.issues = report.issues.map((i: any) => ({ ...i, resolved: Boolean(i.resolved) }))
        }
      }

      report.createdAt = new Date(report.createdAt)
      report.updatedAt = new Date(report.updatedAt)
      return report
    },

    delete({ where }: { where: { id: string } }) {
      const database = getDb()
      database.prepare('DELETE FROM AcquittalReport WHERE id = ?').run(where.id)
    },

    deleteMany() {
      const database = getDb()
      database.prepare('DELETE FROM Issue').run()
      database.prepare('DELETE FROM AcquittalDocument').run()
      database.prepare('DELETE FROM AcquittalReport').run()
    }
  },

  acquittalDocument: {
    create({ data }: { data: any }) {
      const database = getDb()
      const id = cuid()
      const now = new Date().toISOString()
      const stmt = database.prepare(`
        INSERT INTO AcquittalDocument (id, reportId, fileName, fileType, fileSize, filePath, extractedData, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run(id, data.reportId, data.fileName, data.fileType, data.fileSize, data.filePath, data.extractedData ?? null, now)
      return { id, ...data, createdAt: now }
    },

    findMany() {
      const database = getDb()
      return database.prepare('SELECT * FROM AcquittalDocument').all() as any[]
    },

    findUnique({ where }: { where: { id: string } }) {
      const database = getDb()
      return database.prepare('SELECT * FROM AcquittalDocument WHERE id = ?').get(where.id) as any
    }
  },

  issue: {
    create({ data }: { data: any }) {
      const database = getDb()
      const id = cuid()
      const now = new Date().toISOString()
      const stmt = database.prepare(`
        INSERT INTO Issue (id, reportId, type, title, description, recommendation, confidence, severity, resolved, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run(id, data.reportId, data.type, data.title, data.description, data.recommendation, data.confidence ?? 0.0, data.severity ?? 0.0, data.resolved ? 1 : 0, now)
      return { id, ...data, createdAt: now }
    }
  }
}
