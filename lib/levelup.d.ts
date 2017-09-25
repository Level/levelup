import { EventEmitter } from 'events';
import * as levelerrors from 'level-errors';
import { AbstractLevelDOWN, AbstractIteratorOptions, Batch } from 'abstract-leveldown';

declare global {
  namespace Level {
    export interface UP<K, V, O, PO, GO, DO, IO, BO, TB> {
    }
  }
}

export interface LevelUp<K=any, V=any, O={}, PO={}, GO={}, DO={}, IO={}, BO={}, TB=Batch<K, V>>
  extends Level.UP<K, V, O, PO, GO, DO, IO, BO, TB>,
  EventEmitter {

  open(): Promise<void>;
  open(callback?: (err: any) => any): void;
  close(): Promise<void>;
  close(callback?: (err: any) => any): void;

  put(key: K, value: V, options?: PO): Promise<void>;
  put(key: K, value: V, options: PO, callback: (err: any) => any): void;
  put(key: K, value: V, callback: (err: any) => any): void;

  get(key: K, options?: GO): Promise<any>;
  get(key: K, options: GO, callback: (err: any, value: any) => any): void;
  get(key: K, callback: (err: any, value: any) => any): void;

  del(key: K, options?: DO): Promise<void>
  del(key: K, options: DO, callback: (err: any) => any): void;
  del(key: K, callback: (err: any) => any): void;

  batch(array: TB[], options?: BO): Promise<void>;
  batch(array: TB[], options: BO, callback: (err?: any) => any): void;
  batch(array: TB[], callback: (err?: any) => any): void;

  batch(): LevelUpChain<K, V>;

  isOpen(): boolean;
  isClosed(): boolean;

  createReadStream(options?: IO & AbstractIteratorOptions<K>): NodeJS.ReadableStream;
  createKeyStream(options?: IO & AbstractIteratorOptions<K>): NodeJS.ReadableStream;
  createValueStream(options?: IO & AbstractIteratorOptions<K>): NodeJS.ReadableStream;

  /**emitted when a new value is 'put' */
  on(event: 'put', cb: (key: K, value: V) => void): this
  /**emitted when a value is deleted*/
  on(event: 'del', cb: (key: K) => void)
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

interface LevelUpConstructor {
  <K=any, V=any, O=any, PO={}, GO={}, DO={}, IO={}, BO={}, B = Batch<K, V>>(
    db: AbstractLevelDOWN<any, any, O, PO, GO, DO, IO, BO>,
    options: O,
    cb?: (err: Error) => void): LevelUp<K, V, O, PO, GO, DO, IO, BO, B>;
  <K=any, V=any, O=any, PO={}, GO={}, DO={}, IO={}, BO={}, B = Batch<K, V>>(
    db: AbstractLevelDOWN<any, any, O, PO, GO, DO, IO, BO>,
    cb?: (err: Error) => void): LevelUp<K, V, O, PO, GO, DO, IO, BO, B>;

  new <K=any, V=any, O=any, PO={}, GO={}, DO={}, IO={}, BO={}, B = Batch<K, V>>(
    db: AbstractLevelDOWN<any, any, O, PO, GO, DO, IO, BO>,
    options: O,
    cb?: (err?: Error) => void): LevelUp<K, V, O, PO, GO, DO, IO, BO, B>;
  new <K=any, V=any, O=any, PO={}, GO={}, DO={}, IO={}, BO={}, B = Batch<K, V>>(
    db: AbstractLevelDOWN<any, any, O, PO, GO, DO, IO, BO>,
    cb?: (err?: Error) => void): LevelUp<K, V, O, PO, GO, DO, IO, BO, B>;

  errors: typeof levelerrors;
}

export interface LevelUpChain<K=any, V=any> {
  readonly length: number;
  put(key: K, value: V): this;
  del(key: K): this;
  clear(): this;
  write(callback: (err?: any) => any): this;
  write(): Promise<this>;
}

export var errors: typeof levelerrors;

declare const LevelUp: LevelUpConstructor;
export default LevelUp