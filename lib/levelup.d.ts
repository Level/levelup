import { EventEmitter } from 'events';
import * as levelerrors from 'level-errors';
import * as Abstract from 'abstract-leveldown';

declare global {
  namespace Level {
    // These open interfaces may be extended in an application-specific manner via declaration merging.
    export interface UP<TKey, TValue, TOptions, TPutOptions, TGetOptions, TDeleteOptions, TIteratorOptions, TBatchOptions> { }
  }
}

declare namespace levelup {
  interface LevelUp<TKey, TValue, TOptions, TPutOptions, TGetOptions, TDeleteOptions, TIteratorOptions, TBatchOptions>
    extends Level.UP<TKey, TValue, TOptions, TPutOptions, TGetOptions, TDeleteOptions, TIteratorOptions, TBatchOptions>, EventEmitter {
    open(): Promise<void>;
    open(callback?: (err: any) => any): void;

    close(): Promise<void>;
    close(callback?: (err: any) => any): void;

    put(key: TKey, value: TValue, options?: TPutOptions): Promise<void>;
    put(key: TKey, value: TValue, options: TPutOptions, callback: (err: any) => any): void;
    put(key: TKey, value: TValue, callback: (err: any) => any): void;

    get(key: TKey, options?: TGetOptions): Promise<TValue>;
    get(key: TKey, options: TGetOptions, callback: (err: any, value: TValue) => any): void;
    get(key: TKey, callback: (err: any, value: TValue) => any): void;

    del(key: TKey, options?: TDeleteOptions): Promise<void>
    del(key: TKey, options: TDeleteOptions, callback: (err: any) => any): void;
    del(key: TKey, callback: (err: any) => any): void;

    batch(array: LevelUpBatch[], options?: TBatchOptions): Promise<void>;
    batch(array: LevelUpBatch[], options: TBatchOptions, callback: (err?: any) => any): void;
    batch(array: LevelUpBatch[], callback: (err?: any) => any): void;

    batch(): LevelUpChain<TPutOptions, TDeleteOptions>;

    isOpen(): boolean;
    isClosed(): boolean;

    createReadStream(options?: TIteratorOptions & ReadStreamOptions): NodeJS.ReadableStream;
    createKeyStream(options?: TIteratorOptions & StreamOptions): NodeJS.ReadableStream;
    createValueStream(options?: TIteratorOptions & StreamOptions): NodeJS.ReadableStream;

    //emitted when a new value is 'put'
    on(event: 'put', cb: (key: any, value: any) => void): this
    /**emitted when a value is deleted*/
    on(event: 'del', cb: (key: any) => void)
    /**emitted when a batch operation has executed */
    on(event: 'batch', cb: (ary: any[]) => void)
    /**emitted when the database has opened ('open' is synonym) */
    on(event: 'ready', cb: () => void)
    /**emitted when the database has opened */
    on(event: 'open', cb: () => void)
    /** emitted when the database has closed*/
    on(event: 'closed', cb: () => void)
    /** emitted when the database is opening */
    on(event: 'opening', cb: () => void)
    /** emitted when the database is closing */
    on(event: 'closing', cb: () => void)
  }

  interface StreamOptions {
    gt?: any,
    gte?: any,
    lt?: any,
    lte?: any,
    reverse?: boolean,
    limit?: number,
  }

  interface ReadStreamOptions extends StreamOptions {
    keys?: boolean,
    values?: boolean,
  }

  interface LevelUpChain<TPutOptions, TDeleteOptions> {
    put(key: any, value: any, options?: TPutOptions): this;
    del(key: any, options?: TDeleteOptions): this;
    clear(): this;
    write(callback?: (err?: any) => any): this;
    write(): Promise<this>;
  }

  interface BatchDelete {
    type: 'del',
    key: any
  }

  interface BatchPut {
    type: 'put',
    key: any,
    value: any,
  }

  type LevelUpBatch = BatchDelete | BatchPut

  export var errors: typeof levelerrors;

}

declare function levelup<
  TKey=any,
  TValue=any,
  TOptions=any,
  TPutOptions=any,
  TGetOptions=any,
  TDeleteOptions=any,
  TIteratorOptions=any,
  TBatchOptions=any
  >(
  db: Abstract.LevelDOWN<TKey, TValue, TOptions, TPutOptions, TGetOptions, TDeleteOptions, TIteratorOptions, TBatchOptions>,
  options: TOptions,
  cb?: (err: Error) => void): levelup.LevelUp<TKey, TValue, TOptions, TPutOptions, TGetOptions, TDeleteOptions, TIteratorOptions, TBatchOptions>;

declare function levelup<
  TKey=any,
  TValue=any,
  TOptions=any,
  TPutOptions=any,
  TGetOptions=any,
  TDeleteOptions=any,
  TIteratorOptions=any,
  TBatchOptions=any
  >(
  db: Abstract.LevelDOWN<TKey, TValue, TOptions, TPutOptions, TGetOptions, TDeleteOptions, TIteratorOptions, TBatchOptions>,
  cb?: (err: Error) => void): levelup.LevelUp<TKey, TValue, TOptions, TPutOptions, TGetOptions, TDeleteOptions, TIteratorOptions, TBatchOptions>;

export = levelup;