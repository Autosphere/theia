import {MessageConnection, RequestType} from "vscode-jsonrpc";
import {FileSystem, FileSystemWatcher, FileChangeEvent, FileChangeType, FileChange} from "../file-system";
import {Path} from "../path";
import {Disposable, DisposableCollection} from "../../../application/common";
import {
    LsRequest,
    DirExistsRequest,
    DidChangeFilesNotification,
    DidChangeFilesParam,
    ReadFileRequest,
    BooleanResult,
    WriteFileRequest
} from "./filesystem-protocol";
import {AbstractFileSystemConnectionHandler} from "./filesystem-handler";

export class FileSystemClient extends AbstractFileSystemConnectionHandler implements FileSystem {

    protected readonly watchers: FileSystemWatcher[] = [];
    protected connection: MessageConnection | undefined;
    protected readonly connectionListeners = new DisposableCollection();

    onConnection(connection: MessageConnection) {
        this.connectionListeners.dispose();
        this.connection = connection;
        let disposed = false;
        const handler = (params: DidChangeFilesParam) => {
            if (!disposed) {
                this.notifyWatchers(new FileChangeEvent(
                    params.changes.map(change => new FileChange(
                        Path.fromString(change.path),
                        change.type
                        )
                    )));
            }
        };
        this.connectionListeners.push({
            dispose() {
                disposed = true;
            }
        });
        this.connection.onNotification(DidChangeFilesNotification.type, handler);
        this.connection.onDispose(() => {
            this.connectionListeners.dispose();
            this.connection = undefined;
        });
        this.connection.listen();
        this.initialize();
    }

    // FIXME we should have the initialize request
    protected initialize(): void {
        this.notifyWatchers({
            changes: [{
                path: Path.ROOT,
                type: FileChangeType.UPDATED
            }]
        });
    }

    protected notifyWatchers(event: FileChangeEvent): void {
        for (const watcher of this.watchers) {
            watcher(event);
        }
    }

    ls(path: Path): Promise<Path[]> {
        const param = {path: path.toString()};
        return this.sendRequest(LsRequest.type, param, {paths: []}).then(result =>
            result.paths.map(p => Path.fromString(p))
        );
    }

    chmod(path: Path, mode: number): Promise<boolean> {
        throw Error('chmod is no implemented yet');
    }

    mkdir(path: Path, mode?: number): Promise<boolean> {
        throw Error('mkdir is no implemented yet');
    }

    rename(oldPath: Path, newPath: Path): Promise<boolean> {
        throw Error('rename is no implemented yet');
    }

    rmdir(path: Path): Promise<boolean> {
        throw Error('rmdir is no implemented yet');
    }

    rm(path: Path): Promise<boolean> {
        throw Error('rm is no implemented yet');
    }

    readFile(path: Path, encoding: string): Promise<string> {
        const param = {
            path: path.toString(),
            encoding
        };
        return this.sendRequest(ReadFileRequest.type, param, {content: ''}).then(result => result.content);
    }

    writeFile(path: Path, data: string, encoding?: string): Promise<boolean> {
        const param = {
            path: path.toString(),
            content: data,
            encoding
        };
        return this.sendBooleanRequest(WriteFileRequest.type, param);
    }

    exists(path: Path): Promise<boolean> {
        throw Error('exists is no implemented yet');
    }

    dirExists(path: Path): Promise<boolean> {
        const param = {path: path.toString()};
        return this.sendBooleanRequest(DirExistsRequest.type, param);
    }

    fileExists(path: Path): Promise<boolean> {
        throw Error('fileExists is no implemented yet');
    }

    watch(watcher: FileSystemWatcher): Disposable {
        this.watchers.push(watcher);
        return {
            dispose() {
                const index = this.watchers.indexOf(watcher);
                if (index !== -1) {
                    this.watchers.splice(index, 1);
                }
            }
        }
    }

    protected sendBooleanRequest<P>(type: RequestType<P, BooleanResult, void, void>, params: P): Promise<boolean> {
        return this.sendRequest(type, params, {value: false}).then(result => result.value);
    }

    protected sendRequest<P, R>(type: RequestType<P, R, void, void>, params: P, defaultResult: R): Promise<R> {
        const connection = this.connection;
        if (connection) {
            return Promise.resolve(connection.sendRequest(type, params));
        }
        return Promise.resolve(defaultResult);
    }

}