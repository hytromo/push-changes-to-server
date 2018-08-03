const settings = require('./settings');

const git = require('simple-git')(settings.local.projectPath);
const nodeSsh = require('node-ssh');
const path = require('path');

const ssh = new nodeSsh();

const withPromise = (func, ...params) => new Promise((res, rej) => {
    func.apply(git,
        [
            ...params, (err, result) => (err ? rej(err) : res(result))
        ]);
});

const clearGitChangedFiles = output => output.split('\n').filter(s => s).sort();

const gitFilesToFullPath = (files, basePath) => files.map(file => path.join(basePath, file));

const sshConnect = () => ssh.connect({
    host: settings.remote.host,
    username: settings.remote.user,
    privateKey: settings.sshKey
});


const remoteExecution = (...args) => ssh.exec(...args,
    {
        cwd: settings.remote.projectPath,
        stream: 'stdout',
        options: { pty: true }
    });


const uploadChanges = async () => {
    const changedFiles = clearGitChangedFiles(await withPromise(git.diff, ['--name-only']));

    if (!changedFiles.length) {
        console.log('No changed files found');
        process.exit(0);
    }

    console.log(`· ${changedFiles.length} changed files found`);
    console.log(`· Connecting to ${settings.remote.host}...`);

    await sshConnect();

    console.log(`· Connected!`);

    console.log(`· Uploading files...`);

    const localFiles = gitFilesToFullPath(changedFiles, settings.local.projectPath);
    const remoteFiles = gitFilesToFullPath(changedFiles, settings.remote.projectPath);

    await ssh.putFiles(
        localFiles.map((file, index) => ({ local: file, remote: remoteFiles[index] }))
    );

    console.log('· Done');

    ssh.dispose();
}

const resetAndPull = async () => {
    const branch = (await withPromise(git.branch)).current;

    if (!branch) {
        console.log('Local branch not found');
        process.exit(1);
    }

    const commitHash = (await withPromise(git.revparse, ['HEAD'])).replace('\n', '');

    if (!commitHash) {
        console.log('Local commit hash not found');
        process.exit(1);
    }

    const commitMessage = ((await withPromise(git.log, ['-n', 1]))).all[0];

    if (!commitMessage) {
        console.log('Local commit message not found');
        process.exit(1);
    }

    console.log(`· Syncing server to`);
    console.log(`    ${branch}:${commitHash}`);
    console.log(`    ${commitMessage.message} | ${commitMessage.author_name}`);

    console.log(`· Connecting to ${settings.remote.host}...`);

    await sshConnect();

    console.log(`· Connected!`);

    console.log(`· git reset`);

    const resetResult = await remoteExecution('git', ['reset', '--hard', 'HEAD']);
    console.log(resetResult);

    console.log(`· git checkout ${branch}`);

    const branchResult = await remoteExecution('git', ['checkout', branch]);
    console.log(branchResult);

    console.log(`· git pull origin ${branch}`);

    const pullResult = await remoteExecution('git', ['pull', 'origin', branch]);
    console.log(pullResult);

    console.log('· Done');

    ssh.dispose();
}

const main = async () => {
    try {

        if (process.argv.includes('--push-changes')) {
            await uploadChanges();
        } else if (process.argv.includes('--reset-and-pull')) {
            await resetAndPull();
        } else {
            console.log('Please pass --push-changes or --reset-and-pull');
            process.exit(1);
        }

        process.exit(0);
    } catch (err) {
        console.log(err);
    }
}


main();