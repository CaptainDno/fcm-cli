import {program} from "commander";
import {initializeApp} from "firebase-admin/app";
import {cert} from "firebase-admin/app";
import Handlebars from "handlebars";

import {getMessaging} from "firebase-admin/messaging";
import {readFile} from "node:fs/promises";
import {createInterface} from "node:readline";
import nestedProperty from "nested-property";
import chalk from "chalk";



const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
})

async function q(query) {
    return await new Promise(resolve => {
        return rl.question(query, resolve)
    })
}

program
    .version("0.0.1")
    .description("Command line tool for sending notifications with FCM")
    .command("send <template_file> <credentials_file>")
    .description("Send notification")
    .action(async (template_file, credentials_file) => {
        // Init app
        initializeApp({
            credential: cert(credentials_file)
        });

        const template = await readFile(template_file, 'utf8')

        const compiledTemplate = Handlebars.compile(template);

        let context = {}

        for (let variable of template.matchAll(/{{[{]?(.*?)[}]?}}/g)) {
            variable = variable[1].trim()

            nestedProperty.set(context, variable, await q(chalk.green(`Enter ${chalk.yellow(variable)}: `)))
        }

        const jsonValue = compiledTemplate(context);

        console.log(chalk.green("Template with applied values:"))
        console.log(jsonValue);
        if ((await q(chalk.yellow("Send? (y/N):"))) === 'y') {
            await getMessaging().send(JSON.parse(jsonValue));
            console.log(chalk.green("DONE"));
            process.exit(0);
        } else {
            console.log(chalk.red("Cancelled"));
        }
    })
;
program.parse(process.argv);