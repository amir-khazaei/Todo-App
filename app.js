import util from 'util'

import chalk from 'chalk'

import DB from './db.js'

export default class App {

    #id = 0;
    #title;
    #completed;

    constructor (title, completed) {
        this.title = title
        this.completed = completed
    }

    get id() {
        return this.#id
    }

    get title() {
        return this.#title;
    }

    get completed() {
        return this.#completed
    }

    set title(value) {
        try {
            if (typeof value !== "string" || value.length < 3)
                throw new Error("title must contain at least 3 letters.");

            this.#title = value;
        } catch (e) {
            throw e
        }
    }

    set completed(value) {
        this.#completed = Boolean(value);
    }

    [util.inspect.custom]() {
        return `App {
    id: ${chalk.yellowBright(this.#id)}
    title: ${chalk.green('"' + this.#title + '"')}
    completed: ${chalk.blueBright(this.#completed)}
}`;
    }

    save () {
        try {
            const id = DB.addOrEdit(this.#title, this.#completed);
            this.#id = id;
            return this
        } catch (e) {
            throw new Error(e.message);
        }
    }

    update () {
        try {
            DB.addOrEdit(this.#title, this.#completed, this.#id);
        } catch (e) {
            throw new Error(e.message);
        }
    }

    delete () {
        try {
            return DB.delete(this.#id)
        } catch (e) {
            throw e
        }
    }

    static find (id) {
        try {
            return App.where('id', Number(id))
        } catch (e) {
            throw e
        }
    }

    static get (title) {
        try {
            return App.where('title', title)
        } catch (e) {
            throw e
        }
    }

    static where (field, value) {
        try {
            const app = DB.where(field, value);
            if(!app)
                return null;
            const item = new App(app.title, app.completed);
            item.#id = app.id;
            return item;
        } catch (e) {
            throw e
        }
    }

    static all (raw = false) {
        const records = DB.all();
        if (raw)
            return records;
        const apps = [];
        for(let record of records){
            let app = new App(record.title, record.completed);
            app.#id = record.id;
            apps.push(app);
        }
        return apps;
    }

    static deleteAll () {
        try {
            return DB.reset()
        } catch (e) {
            throw e
        }
    }

    static titles () {
        const apps = App.all();
        const choices = [];
        for(let app of apps)
            choices.push(app.title)
        return choices
    }
}