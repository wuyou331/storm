
import { Database } from 'storm';
import { SqliteDatabase } from '../src/sqlite_database';
import { Blog } from './model';




test('from', () => {

    const db: Database = new SqliteDatabase("__tests__\\data.db")
    const sql = db.From(Blog)
    sql.GetList().then(rows => {
        for (const item of rows) {
            console.info(item.Id)
        }
    })

});



