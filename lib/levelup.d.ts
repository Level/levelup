import { EventEmitter } from 'events';
import * as levelerrors from 'level-errors';

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

declare namespace levelup {
    interface AbstractDown<TPut, TGet, TDelete, TBatch, TOptions> { }

    var errors: typeof levelerrors


    interface LevelUp<
      TPutOptions,
      TGetOptions,
      TDeleteOptions,
      TBatchOptions,
      > extends EventEmitter {
      open(): Promise<void>;
      open(callback?: (err: any) => any): void;

      close(): Promise<void>;
      close(callback?: (err: any) => any): void;

      put(key: any, value: any, options?: TPutOptions): Promise<void>;
      put(key: any, value: any, options?: TPutOptions, callback?: (err: any) => any): void;
      put(key: any, value: any, callback?: (err: any) => any): void;

      get(key: any, options?: TGetOptions): Promise<any>;
      get(key: any, options?: TGetOptions, callback?: (err: any, value: any) => any): void;
      get(key: any, callback?: (err: any, value: any) => any): void;

      del(key: any, options?: TDeleteOptions): Promise<void>
      del(key: any, options?: TDeleteOptions, callback?: (err: any) => any): void;
      del(key: any, callback?: (err: any) => any): void;

      batch(array: LevelUpBatch[], options?: TBatchOptions): Promise<void>;
      batch(array: LevelUpBatch[], options?: TBatchOptions, callback?: (err?: any) => any): void;
      batch(array: LevelUpBatch[], callback?: (err?: any) => any): void;

      batch(): LevelUpChain<TPutOptions, TDeleteOptions>;

      isOpen(): boolean;
      isClosed(): boolean;

      createReadStream(options?: ReadStreamOptions): NodeJS.ReadableStream;
      createKeyStream(options?: StreamOptions): NodeJS.ReadableStream;
      createValueStream(options?: StreamOptions): NodeJS.ReadableStream;

      //emitted when a new value is 'put'
      on(event: 'put', cb: (key: any, value: any) => void): this;
      /**emitted when a value is deleted*/
      on(event: 'del', cb: (key: any) => void): this;
      /**emitted when a batch operation has executed */
      on(event: 'batch', cb: (ary: any[]) => void): this;
      /**emitted when the database has opened ('open' is synonym) */
      on(event: 'ready', cb: () => void): this;
      /**emitted when the database has opened */
      on(event: 'open', cb: () => void): this;
      /** emitted when the database has closed*/
      on(event: 'closed', cb: () => void): this;
      /** emitted when the database is opening */
      on(event: 'opening', cb: () => void): this;
      /** emitted when the database is closing */
      on(event: 'closing', cb: () => void): this;
    }
}

declare function levelup<TPut, TGet, TDelete, TBatch, TOptions>(
  db: levelup.AbstractDown<TPut, TGet, TDelete, TBatch, TOptions>,
  options?: TOptions,
  cb?: (err: Error) => void): levelup.LevelUp<TPut, TGet, TDelete, TBatch>;

export = levelup;
