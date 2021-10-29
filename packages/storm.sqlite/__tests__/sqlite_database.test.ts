
import { Database } from 'storm';
import { SqliteDatabase } from '../src/sqlite_database';
import { Blog } from './model';


const db: Database = new SqliteDatabase("__tests__\\data.db")


test('from', async () => {
    const sql = db.From(Blog).Select((b: Blog) => ({ bId: b.Id }))

    const rows = await sql.GetList()
    for (const row of rows) {
        expect(row).toHaveProperty("bId")
    }


});


