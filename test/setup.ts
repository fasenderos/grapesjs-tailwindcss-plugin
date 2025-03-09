import { JSDOM } from "jsdom";

// Crea un ambiente DOM simulato
const dom = new JSDOM(
  `<!DOCTYPE html><html><body><div id="gjs"></div></body></html>`,
  {
    url: "http://localhost",
  },
);

// Assign global vars to simulate a browser
global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage
global.sessionStorage = dom.window.sessionStorage
global.DOMParser = dom.window.DOMParser
