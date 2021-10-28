
import { Database } from 'storm';
import { SqliteDatabase } from '../src/sqlite_database';
import { Blog } from './model';


const db: Database = new SqliteDatabase("__tests__\\data.db")


test('from', () => {

    const sql = db.From(Blog).Select(b => ({ id: b.Id }))
    sql.GetList().then(rows => {
        for (const item of rows) {
            console.info(item.id)
        }
    })

});



