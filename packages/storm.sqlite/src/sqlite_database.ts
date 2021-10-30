
import * as sqlite3 from 'sqlite3';
import * as storm from 'storm';
import { SqliteSqlExpr } from './sqlite_expr';
import { SqlUtils } from './../../storm/src/sql_utils';

export class SqliteDatabase implements storm.Database {
    private readonly db: sqlite3.Database
    constructor(connStr: string) {
        this.db = new sqlite3.Database(connStr);

    }
    insert<T>(item: T): Promise<undefined>;
    insert<T>(item: T, returnId: boolean): Promise<number>;
    insert<T extends ObjectConstructor>(item: T, returnId?: boolean): Promise<number> | Promise<undefined> {
        const parmSql = returnId ? SqlUtils.insert(item, true) : SqlUtils.insert(item, true)

        const stmt: sqlite3.Statement | sqlite3.RunResult = this.db.prepare(parmSql.sql)
        return new Promise<number>((resolve, reject) => {
            stmt.run(parmSql.parms, (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    resolve((stmt as sqlite3.RunResult).lastID)
                }
            })
        });

    }



    public from<T extends object>(ctor: new () => T, alias?: string): storm.SqlExpr<T> {
        return new SqliteSqlExpr<T>(ctor, this, alias)

    }


    public queryList<T>(sql: storm.ParmSql): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            this.db.all(sql.sql, sql.parms, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            });
        });
    }

    public querySingle<T>(sql: storm.ParmSql): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.db.all(sql.sql, sql.parms, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows.length > 0 ? rows[0] : undefined)
                }
            });
        });
    }
}