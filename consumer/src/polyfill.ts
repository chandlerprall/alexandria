// @ts-ignore
import jsdom from 'jsdom';

const dom = new jsdom.JSDOM();
// @ts-ignore
global.window = dom.window;
// @ts-ignore
global.document = dom.window.document;
// @ts-ignore
global.navigator = dom.window.navigator;
// @ts-ignore
global.Element = dom.window.Element;