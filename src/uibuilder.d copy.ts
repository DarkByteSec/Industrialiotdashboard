declare module 'node-red-contrib-uibuilder/front-end/uibuilder.esm.js';

declare module 'uibuilder' {
  interface UibuilderClient {
    start(): void;
    onChange(event: string, callback: (msg: any) => void): void;
    send(msg: any): void;
    get(prop: string): any;
  }
  const uibuilder: UibuilderClient;
  export default uibuilder;
}
