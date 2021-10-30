
import * as sqlite3 from 'sqlite3';
import * as storm from 'storm';
import { SqliteSqlExpr } from './sqlite_expr';
import { SqlUtils } from './../../storm/src/sql_utils';

export class SqliteDatabase implements storm.Database {
    private readonly db: sqlite3.Database
    constructor(connStr: string) {
        this.db = new sqlite3.Database(connStr);

    }
    insert<T>(item: T): void;
    insert<T>(item: T, returnId: boolean): number;
    insert<T extends ObjectConstructor>(item: T, returnId?: boolean): number | void {
        console.info(SqlUtils.insert(item))
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
                    resolve(rows.length > 1 ? rows[0] : undefined)
                }
            });
        });
    }
}