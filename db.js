import fs from 'fs'

const filename = process.env.DB_FILE;

export default class DB {

    static exists() {
        return fs.existsSync(filename)
    }

    static reset() {
        try {
            fs.writeFileSync(filename, '[]', 'utf-8')
            return true;
        } catch (e) {
            throw e
	    //new Error('Can not write in ' + filename)
        }
    }

    static create() {
        if (DB.exists())
            return false;
        try {
            return DB.reset()
        } catch (e) {
            throw new Error('Can not create database')
        }
    }
	
    static read() {
        try {
            return JSON.parse(fs.readFileSync(filename, 'utf-8'))
        } catch (e) {
            throw e
        }
    }

    static where(field, value) {
        if (!DB.exists())
            return null;
        try {
            const records = DB.read()
            const record = records.find((item) => item[field] == value)
            return record ? record : null;
        } catch (e) {
            throw e
        }
    }

    static find(id) {
        try {
            return DB.where('id', Number(id))
        } catch (e) {
            throw e
        }
    }

    static get(title) {
        try {
            return DB.where('title', title)
        } catch (e) {
            throw e
        }
    }
   
    static delete(id) {
        try {
            id = Number(id);
            if (id <= 0 || id !== parseInt(id))
                throw new Error('invalid id.')

            let records = DB.read()
            const index = DB.search(id)

            if (index == -1)
                throw new Error("Task not found.");

            records.splice(index, 1)
            const str = JSON.stringify(records, null, '    ')
            fs.writeFileSync(filename, str, 'utf-8')
            return true

        } catch (e) {
            throw e
        }
    }

    static all() {
        if (!DB.exists())
            return [];
        try {
            return JSON.parse(fs.readFileSync(filename, 'utf-8'))
        } catch (e) {
            throw e
        }
    }

    static search(id) {
        try {
            const records = DB.read()
            for (let i = 0; i < records.length; i++)
                if (records[i].id === id)
                    return i;
            return -1

        } catch (e) {
            throw e
        }
    }

    static addOrEdit (title, completed = false, id = 0) {
        try {
            id = Number(id);
            if (id < 0 || id !== parseInt(id))
                throw new Error('invalid id!')
            else if (typeof title !== 'string' || title.length < 3)
                throw new Error('title must contain at least 3 character!')

            let record = DB.get(title)
            if (record && record.id !== id)
                throw new Error("A task exists with this title.");

            DB.create()

            if (id == 0)
                return DB.insert(title, completed)

            return DB.update(id, title, completed);

        } catch (e) {
            throw e
        }
    }

    static insert(title, completed) {
        try {
            const records = DB.read()
            let id = 1 + (records.length ? records[records.length - 1].id : 0)

            records.push({
                id,
                title,
                completed,
            });

            const str = JSON.stringify(records, null, '    ');
            fs.writeFileSync(filename, str, "utf-8");
            return id;
        } catch (e) {
            throw e
        }
    }

    static update(id, title, completed) {
        try {
            const records = DB.read()
            const index = DB.search(id)

            if (index == -1)
                throw new Error("Task not found.");

            records[index].title = title;
            records[index].completed = completed;

            const str = JSON.stringify(records, null, '    ');
            fs.writeFileSync(filename, str, "utf-8");
            return true;
        } catch (e) {
            throw e;
        }
    }

    static insertData(data) {
        try {
            if (typeof data === "string")
                data = JSON.parse(data);
            else if (data instanceof Array)
                data = JSON.stringify(data, null, "    ");
            else
                throw new Error("Invalid data.");

            fs.writeFileSync(filename, data);

        } catch (e) {
            throw e
        }
    }
}
