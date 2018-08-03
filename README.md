# Push changes to a development server

## What is this

You develop a server app that you don't run locally, only in a development server. Why? Because it can depend on 100 different things and be hard to setup databases, slaves, redis and so on.

You need to push your changes to the server in order to test things out, before you actually commit anything.

There are many solutions, like sshing in the server and editing via `vim`, but you lose all the speed and comfort of your local IDE.

This proposed solution allows you to develop your code locally and, whenever you want to test something, auto-copy the changed files to the development server, using `ssh`.

When you are done locally and you commit + push your changes to your git repo, this solution allows you to auto-reset (git reset) the development server and pull the commit you just pushed, so you stay in sync.

So, to sum up:
* Push just the changed files when you want
* Sync the development server with the local commit when you want (typically when you commit+push locally)

## How to

1. Run `yarn`/`npm i` in the project root to install the few dependencies that allow for git + ssh.

2. Copy `settings.example.json` into `settings.json` and edit the fields:

```json
{
    "sshKey": "/path/to/ssh/key",
    "local": {
        "projectPath": "/path/to/local/project"
    },
    "remote": {
        "host": "remote ip or host",
        "user": "remote user name",
        "projectPath": "/path/to/remote/project"
    }
}
```

They are pretty self-explanatory.

3. Run the program

* Just to push the changed files since the last commit (`git diff --name-only`)

```bash
$ node index.js --push-changes

· 2 changed files found
· Connecting to X.X.X.X...
· Connected!
· Uploading files...
· Done

```

* Reset the development server to the last commit of your current branch

```bash
$ node index.js --reset-and-pull

· Syncing server to
    booking-manage:53f6f934f179aba4238f4dce91134a7ebbeb5521
    Helpers/bike_import: Make eslint happy (HEAD -> booking-manage, origin/booking-manage) | Alexandros Solanos
· Connecting to X.X.X.X...
· Connected!
· git reset
HEAD is now at 53f6f93 Helpers/bike_import: Make eslint happy
· git checkout booking-manage
Already on 'booking-manage'
Your branch is up-to-date with 'origin/booking-manage'.
· git pull origin booking-manage
From bitbucket.org:rentalguru_team/rental-guru-api-server
 * branch            booking-manage -> FETCH_HEAD
Already up-to-date.
· Done

```

That's all there is to it, really.

## I want to integrate this inside VSCode

Yes, this can be handy. I have added this as a VSCode task.

Go to `Tasks->Configure Tasks...` and input this:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Remote push changes",
            "type": "shell",
            "command": "node ~/Projects/personal/push-changes-to-server/index.js --push-changes",
            "presentation": {
                "focus": true,
                "reveal": "always",
                "panel": "new"
            },
            "problemMatcher": []
        },
        {
            "label": "Remote reset + pull",
            "type": "shell",
            "command": "node ~/Projects/personal/push-changes-to-server/index.js --reset-and-pull",
            "presentation": {
                "focus": true,
                "reveal": "always",
                "panel": "new"
            },
            "problemMatcher": []
        }
    ]
}
```

Change the `command` fields to point to this project's `index.js` file in your filesystem.

After you save the file, you can run these tasks through `Tasks->Run Task`.

If you want, you can bind a shortcut to `Tasks->Run Task` to access it more quickly.

## I need to restart the server after its code is changed

This project doesn't do this. Run your dev server with something like `nodemon` that autodetects changes.