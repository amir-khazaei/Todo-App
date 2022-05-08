import fs from 'fs'

import chalk from "chalk"
import inquirer from "inquirer"
import axios from "axios"
import { parse, stringify } from "csv/sync"

import DB from './db.js'
import App from "./app.js"

const error = chalk.redBright.bold
const warn = chalk.yellowBright.bold
const success = chalk.greenBright.bold

export default class Controller {

    static async menu() {
        console.clear();
        const comands = [
            "list",
            "add",
            "delete",
            "reset",
            "edit",
            "export",
            "import",
            "download",
            "exit"
        ];

        let answer = await inquirer.prompt({
            type: "list",
            name: "command",
            message: "Command:",
            choices: comands,
        });
        Controller.handle(answer.command).then(() => {
            inquirer.prompt({
                    type: "confirm",
                    name: "result",
                    message: "Continue?",
                    default: true,
                })
                .then((answer) => {
                    if (answer.result)
                        Controller.menu()
                    else
                        process.exit()
                })
                .catch((error) => { });
        })
    }

    static handle(command) {
        console.clear();
        return new Promise(function (resolve, reject) {
            if (command === "list")
                Controller.list().then(() => {
                    resolve()
                })
            else if (command === "add")
                Controller.add().then(() => {
                    resolve()
                })
            else if (command === "delete")
                Controller.delete().then(() => {
                    resolve()
                });
            else if (command === "reset")
                Controller.deleteAll().then(() => {
                    resolve()
                })
            else if (command === "edit")
                Controller.edit().then(() => {
                    resolve()
                })
            else if (command === "export")
                Controller.export().then(() => {
                    resolve()
                })
            else if (command === "import")
                Controller.import().then(() => {
                    resolve()
                })
            else if (command === "download")
                Controller.download().then(() => {
                    resolve()
                })
            else if (command === "exit")
                process.exit()
        })
    }

    static async list() {
        const apps = App.all(true);
        if (apps.length)
            console.table(apps);
        else
            console.log(warn("There is not any App."));
        /*return new Promise(function (resolve, reject) {
            const Apps = App.all(true);
            if (Apps.length)
                console.table(Apps);
            else
                console.log(warn("There is not any App."));
            resolve()
        })*/
    }

    static async add() {
        const answers = await inquirer.prompt([{
                type: "input",
                name: "title",
                message: "App Title: ",
                validate: (entry) => {
                    if (entry.length < 3) return "The title must contain at least 3 letters.";
                    return true;
                },
            },
            {
                type: "confirm",
                name: "completed",
                message: "completed? ",
                default: false,
            },
        ]);
        try {
            const app = new App(answers.title, answers.completed);
            app.save();
            console.log(success("New App saved successfully."));
        } catch (e) {
            console.log(error(e.message));
        }
    }

    static async delete() {
        const answer = await inquirer.prompt({
            type: "list",
            name: "title",
            message: "Select App",
            choices: App.titles()
        });

        try {
            const app = App.get(answer.title);
            app.delete();
            console.log(success("App deleted successfully."));
        } catch (e) {
            console.log(error(e.message));
        }
    }

    static async edit() {
        const answer = await inquirer.prompt({
            type: "list",
            name: "title",
            message: "Select App",
            choices: App.titles()
        });

        const app = App.get(answer.title);
        const answers = await inquirer.prompt([{
                type: "input",
                name: "title",
                message: "App title: ",
                validate: (value) => {
                    if (value.length < 3) return "The title must contain at least 3 letters.";
                    return true;
                },
                default: app.title,
            },
            {
                type: "confirm",
                name: "completed",
                message: "Completed?",
                default: true,
            },
        ]);

        try {
            app.title = answers.title;
            app.completed = answers.completed;
            app.update();
            console.log(success("App edited successfully."));
        } catch (e) {
            console.log(error(e.message));
        }
    }

    static async deleteAll() {
        const answer = await inquirer.prompt({
            type: "confirm",
            name: "result",
            message: "Are you sure?",
        });

        if (!answer.result)
            return;
        try {
            App.deleteAll();
            console.log(success("All Apps deleted successfully."));
        } catch (e) {
            console.log(error(e.message));
        }
    }

    static async export () {
        const answer = await inquirer.prompt({
            type: "input",
            name: "filename",
            message: "Enter output filename:",
            validate: (value) => {
                if (!/^[\w .-]{1,50}$/.test(value)) {
                    return "Please enter a valid filename.";
                }
                return true;
            },
        });

        const output = stringify(App.all(true), {
            header: true,
            cast: {
                boolean: (value, context) => {
                    return String(value);
                },
            },
        });

        try {
            fs.writeFileSync(answer.filename, output);
            console.log(success("Apps exported successfully"));
        } catch (e) {
            console.log(error("Can not write to " + answer.filename));
            //console.log(error(e.message));
        }
    }

    static async import() {
        const answer = await inquirer.prompt({
            type: "input",
            name: "filename",
            message: "Backup filename:",
        });

        try {
            if (!fs.existsSync(answer.filename))
                throw new Error('Backup file does not exists.');

            const input = fs.readFileSync(answer.filename);
            const data = parse(input, {
                columns: true,
                cast: (value, context) => {
                    if (context.column === "id")
                        return Number(value);
                    else if (context.column === "completed")
                        return value.toLowerCase() === "true" ? true : false;
                    return value;
                },
            });
            DB.insertData(data);
            console.log(success("Data imported successfully."));

         }catch(e){
             console.log(error(e.message));
        }
    }

    static async download() {
        const answer = await inquirer.prompt({
            type: "input",
            name: "filename",
            message: "Enter filename to download:",
        });

        const config = {
            baseURL: process.env.BASE_URL,
            url: answer.filename,
        };

        try {
            const response = await axios(config)
            const data = parse(response.data, {
                columns: true,
                cast: (value, context) => {
                    if (context.column === "id") {
                        return Number(value);
                    } else if (context.column === "completed") {
                        return value.toLowerCase() === "true" ? true : false;
                    }
                    return value;
                },
            });
            DB.insertData(data);
            console.log(success("Data downloaded to database successfully."));
            //console.table(data);
        } catch (e) {
            console.log(error(e.message));
        }
    }
}