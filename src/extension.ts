import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Auto Gkeep extension is now active!');

    // Register a new command that generates .gitkeep file in empty directories
    let disposable = vscode.commands.registerCommand('auto-gkeep.generateGitkeep', async () => {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: 'Select Folder'
        });

        if (!folderUri || folderUri.length === 0) {
            vscode.window.showErrorMessage('No folder selected!');
            return;
        }

        const folderPath = folderUri[0].fsPath;

        // Create .gitkeep files in empty directories
        createGitkeepInEmptyDirs(folderPath);

        // Set up a file system watcher to monitor changes in the selected folder
        const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folderUri[0], '**/*'));

        // Watch for changes and handle file creation and deletion
        watcher.onDidCreate((uri) => {
            checkAndRemoveGitkeep(uri.fsPath);
            checkAndCreateGitkeepIfEmpty(uri.fsPath); // Check if new folder is empty
        });

        watcher.onDidDelete((uri) => {
            // Optional: You can handle the deletion if necessary
            // checkAndCreateGitkeepIfEmpty(path.dirname(uri.fsPath)); // Uncomment if you want to recreate .gitkeep if folder becomes empty again
        });

        context.subscriptions.push(disposable, watcher);
    });

    context.subscriptions.push(disposable);
}

// Function to create .gitkeep in empty directories
function createGitkeepInEmptyDirs(dirPath: string) {
    const files = fs.readdirSync(dirPath);

    if (files.length === 0) {
        const gitkeepPath = path.join(dirPath, '.gitkeep');
        fs.writeFileSync(gitkeepPath, '', 'utf8');
        vscode.window.showInformationMessage(`.gitkeep created in ${dirPath}`);
    } else {
        files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                createGitkeepInEmptyDirs(filePath);
            }
        });
    }
}

// Function to check and remove .gitkeep if new files are added
function checkAndRemoveGitkeep(filePath: string) {
    const dirPath = path.dirname(filePath);
    const gitkeepPath = path.join(dirPath, '.gitkeep');

    // Read the contents of the directory
    const files = fs.readdirSync(dirPath);

    // If the directory contains more than one file or is not empty, remove .gitkeep
    if (files.length > 1 || (files.length === 1 && files[0] !== '.gitkeep')) {
        if (fs.existsSync(gitkeepPath)) {
            fs.unlinkSync(gitkeepPath);
            vscode.window.showInformationMessage(`.gitkeep removed from ${dirPath}`);
        }
    }
}

// Function to check if the created folder is empty and create .gitkeep if it is
function checkAndCreateGitkeepIfEmpty(filePath: string) {
    const dirPath = path.dirname(filePath);
    const newFolderPath = filePath; // The newly created folder

    // Check if the new folder is empty
    const files = fs.readdirSync(newFolderPath);
    if (files.length === 0) {
        const gitkeepPath = path.join(newFolderPath, '.gitkeep');
        fs.writeFileSync(gitkeepPath, '', 'utf8');
        vscode.window.showInformationMessage(`.gitkeep created in ${newFolderPath}`);
    }
}

export function deactivate() {}
