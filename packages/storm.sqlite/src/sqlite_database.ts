
import * as sqlite3 from 'sqlite3';
import * as storm from 'storm';
import { SqliteSqlExpr } from './sqlite_expr';

export class SqliteDatabase implements storm.Database {
    private readonly db: sqlite3.Database
    constructor(connStr: string) {
        this.db = new sqlite3.Database(connStr);

    }

    public From<T extends object>(ctor: new () => T, alias?: string): storm.SqlExpr<T> {
        return new SqliteSqlExpr<T>(ctor, this, alias)
    }


    public GetList<T>(sql: storm.ParmSql): Promise<T[]> {
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
}