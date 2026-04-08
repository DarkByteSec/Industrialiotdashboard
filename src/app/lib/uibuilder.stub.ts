// uibuilder stub — بيتستخدم في vite dev بدل المكتبة الحقيقية
// في Node-RED، uibuilder الحقيقي بيتحمّل من الـ HTML مباشرة

const uibuilderStub = {
  start() {
    console.info('[uibuilder stub] start() called — running outside Node-RED');
  },
  onChange(_event: string, _callback: (msg: any) => void) {
    console.info('[uibuilder stub] onChange() called — no messages in dev mode');
  },
  send(_msg: any) {
    console.info('[uibuilder stub] send() called:', _msg);
  },
  get(prop: string) {
    console.info('[uibuilder stub] get() called for:', prop);
    return null;
  },
};

export default uibuilderStub;
