import {
  fixture,
  assert,
  nextFrame,
  aTimeout,
  html
} from '@open-wc/testing';
import * as MockInteractions from '@polymer/iron-test-helpers/mock-interactions.js';
import * as sinon from 'sinon/pkg/sinon-esm.js';
import '../response-body-view.js';

describe('<response-body-view>', function() {
  function str2ab(str) {
    const buf = new ArrayBuffer(str.length * 2);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  const hasPartsApi = 'part' in document.createElement('span');
  const hasTextEncoder = typeof TextEncoder !== 'undefined';

  async function basicFixture() {
    return (await fixture(html`<response-body-view></response-body-view>`));
  }

  async function jsonFixture() {
    const data = {
      test: true
    };
    const responseText = JSON.stringify(data);
    const fix = (await fixture(html`<response-body-view
      .responseText="${responseText}"
      contenttype="application/json"></response-body-view>`));
    await aTimeout(1);
    await nextFrame();
    return fix;
  }

  async function bufferFixture() {
    const responseText = str2ab('lorem ipsum');
    const fix = (await fixture(html`<response-body-view
      .responseText="${responseText}"
      contenttype="text/plain"></response-body-view>`));
    await aTimeout(1);
    await nextFrame();
    return fix;
  }

  async function bufferJsonFixture() {
    const responseText = str2ab('{"test": true}');
    const fix = (await fixture(html`<response-body-view
      .responseText="${responseText}"
      contenttype="application/json"></response-body-view>`));
    await aTimeout(1);
    await nextFrame();
    return fix;
  }

  before(() => {
    window.localStorage.setItem('jsonTableEnabled', false);
  });

  describe('Content actions', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('ignores actions when no content', () => {
      const node = element.shadowRoot.querySelector('.content-actions');
      assert.notOk(node);
    });

    it('renders actions when content', async () => {
      element.responseText = 'test';
      element.contentType = 'text/plain';
      await aTimeout(1);
      await nextFrame();
      const node = element.shadowRoot.querySelector('.content-actions');
      assert.ok(node);
    });

    it('renders copy to clipboard button', async () => {
      element.responseText = 'test';
      element.contentType = 'text/plain';
      await aTimeout(1);
      await nextFrame();
      const node = element.shadowRoot.querySelector('.action-button[data-action="copy"]');
      assert.ok(node);
    });

    it('renders save to file button', async () => {
      element.responseText = 'test';
      element.contentType = 'text/plain';
      await aTimeout(1);
      await nextFrame();
      const node = element.shadowRoot.querySelector('.action-button[data-action="save-file"]');
      assert.ok(node);
    });

    it('renders toggle source button', async () => {
      element.responseText = 'test';
      element.contentType = 'text/plain';
      await aTimeout(1);
      await nextFrame();
      const node = element.shadowRoot.querySelector('.action-button[data-action="raw-toggle"]');
      assert.ok(node);
    });

    it('renders text wrapping button when source view', async () => {
      element.responseText = 'test';
      element.contentType = 'text/plain';
      await aTimeout(1);
      await nextFrame();
      const button = element.shadowRoot.querySelector('.action-button[data-action="raw-toggle"]');
      MockInteractions.tap(button);
      await nextFrame();
      const node = element.shadowRoot.querySelector('.action-button[data-action="text-wrap"]');
      assert.ok(node);
    });

    it('text wrapping button sets wrapText property on raw viewer', async () => {
      element.responseText = 'test';
      element.contentType = 'text/plain';
      await aTimeout(1);
      await nextFrame();
      const button = element.shadowRoot.querySelector('.action-button[data-action="raw-toggle"]');
      MockInteractions.tap(button);
      await nextFrame();
      const button2 = element.shadowRoot.querySelector('.action-button[data-action="text-wrap"]');
      MockInteractions.tap(button2);
      await nextFrame();
      const node = element.shadowRoot.querySelector('response-raw-viewer');
      assert.isTrue(node.hasAttribute('wraptext'));
    });
  });

  describe('JSON response type', () => {
    let element;
    beforeEach(async () => {
      element = await jsonFixture();
    });

    it('renders JSON view', () => {
      const node = element.shadowRoot.querySelector('json-viewer');
      assert.ok(node);
    });

    it('view has content', () => {
      const node = element.shadowRoot.querySelector('json-viewer');
      assert.equal(node.json, '{"test":true}');
    });

    it('renders JSON table switch button', () => {
      const node = element.shadowRoot.querySelector('.action-button[data-action="json-table"]');
      assert.ok(node);
    });

    it('toggles table view', async () => {
      const node = element.shadowRoot.querySelector('.action-button[data-action="json-table"]');
      MockInteractions.tap(node);
      await nextFrame();
      assert.isTrue(element.jsonTableView, 'jsonTableView is set');
      assert.equal(element.activeView, 3, 'activeView is set');
      const table = element.shadowRoot.querySelector('json-table');
      assert.ok(table, 'table is rendered');
    });

    it('restores latest table state', async () => {
      assert.isTrue(element.jsonTableView, 'jsonTableView is set');
      assert.equal(element.activeView, 3, 'activeView is set');
      const table = element.shadowRoot.querySelector('json-table');
      assert.ok(table, 'table is rendered');
    });
  });

  (hasTextEncoder ? describe : describe.skip)('ArrayBuffer response type', () => {
    let element;
    beforeEach(async () => {
      element = await bufferFixture();
    });

    it('renders response-highlighter', () => {
      const table = element.shadowRoot.querySelector('response-highlighter');
      assert.ok(table);
    });

    it('processes buffer to string', () => {
      const table = element.shadowRoot.querySelector('response-highlighter');
      assert.typeOf(table.responseText, 'string');
    });
  });

  (hasTextEncoder ? describe : describe.skip)('ArrayBuffer as JSON response type', () => {
    let element;
    beforeEach(async () => {
      window.localStorage.setItem('jsonTableEnabled', false);
      element = await bufferJsonFixture();
    });

    it('renders json-viewer', () => {
      const view = element.shadowRoot.querySelector('json-viewer');
      assert.ok(view);
    });

    it('processes buffer to string', () => {
      const view = element.shadowRoot.querySelector('json-viewer');
      assert.typeOf(view.json, 'string');
    });
  });

  describe('content type properties', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Sets isParsed property', async () => {
      element.contentType = 'text/plain';
      element.responseText = 'Test';
      await aTimeout(1);
      await nextFrame();
      assert.isTrue(element._isParsed, 'isParsed equals true');
      assert.equal(element.activeView, 1, 'activeView equals 1');
    });

    it('Sets isJson property', async () => {
      element.contentType = 'application/json';
      element.responseText = '{}';
      await aTimeout(1);
      await nextFrame();
      assert.isTrue(element._isJson, 'isJson equals true');
      assert.equal(element.activeView, 2, 'activeView equals 2');
    });
  });

  describe('JSON table state events', () => {
    let element;
    beforeEach(async () => {
      window.localStorage.setItem('jsonTableEnabled', false);
      element = await jsonFixture();
    });

    it('json-table-state-changed event renders the table', () => {
      const e = new CustomEvent('json-table-state-changed', {
        detail: { enabled: true },
        bubbles: true,
        composed: true
      });
      document.body.dispatchEvent(e);
      assert.equal(element.activeView, 3);
      assert.isTrue(element.jsonTableView);
    });

    it('jsonTableView change dispatches json-table-state-changed event', () => {
      const spy = sinon.spy();
      element.addEventListener('json-table-state-changed', spy);
      element.jsonTableView = !element.jsonTableView;
      assert.equal(spy.args[0][0].detail.enabled, element.jsonTableView);
    });

    it('Enabling jsonTableView disables rawView', async () => {
      element.rawView = true;
      element.jsonTableView = false;
      await nextFrame();
      element.jsonTableView = true;
      assert.isFalse(element.rawView, 'rawView is false');
      assert.isUndefined(element.__parsedView, '__parsedView is undefined');
    });
  });

  describe('_getRawContent()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns undefined when no _raw property', () => {
      const result = element._getRawContent();
      assert.isUndefined(result);
    });

    it('Returns string value when _raw is string', () => {
      const value = 'test-value';
      element._raw = value;
      const result = element._getRawContent();
      assert.equal(result, value);
    });

    (hasTextEncoder ? it : it.skip)('Returns string for Uint8Array', () => {
      const string = 'test encoded value';
      const textEncoder = new TextEncoder();
      element._raw = textEncoder.encode(string);
      const result = element._getRawContent();
      assert.equal(result, string);
    });

    (hasTextEncoder ? it : it.skip)('Returns string for meta data (ArrayBuffer)', () => {
      const string = 'test encoded value';
      const textEncoder = new TextEncoder();
      element._raw = {
        data: textEncoder.encode(string).buffer,
        type: 'Buffer'
      };
      const result = element._getRawContent();
      assert.equal(result, string);
    });
  });

  describe('_responseTextChanged()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Sets _isJson to false', () => {
      element._isJson = true;
      element._responseTextChanged('');
      assert.isFalse(element._isJson);
    });

    it('Sets _isParsed to false', () => {
      element._isParsed = true;
      element._responseTextChanged('');
      assert.isFalse(element._isParsed);
    });

    it('Sets _raw undefined', () => {
      element._raw = 'test';
      element._responseTextChanged();
      assert.isUndefined(element._raw);
      assert.isUndefined(element.__setRawDebouncer);
    });

    it('Sets _raw null', () => {
      element._responseTextChanged(null);
      assert.equal(element._raw, null);
    });

    [
      false, true, 'value'
    ].forEach((item) => {
      it(`Sets _raw "${item}"`, (done) => {
        element.responseText = item;
        setTimeout(() => {
          assert.equal(element._raw, item);
          done();
        }, 1);
      });
    });

    it('Does nothing when __setRawDebouncer is set', () => {
      element.__setRawDebouncer = true;
      element._isJson = true;
      element._responseTextChanged('');
      assert.isTrue(element._isJson);
    });

    it('Clears __setRawDebouncer', (done) => {
      element.responseText = 'test';
      setTimeout(() => {
        assert.isFalse(element.__setRawDebouncer);
        done();
      }, 1);
    });
  });

  describe('_localStorageValueToBoolean()', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    [
      [false, false],
      [true, true],
      ['false', false],
      ['true', true]
    ].forEach((item) => {
      it(`Returns  "${item[1]}" for "${item[0]}"`, () => {
        const result = element._localStorageValueToBoolean(item[0]);
        assert.equal(result, item[1]);
      });
    });
  });

  describe('_onStorageChanged()', () => {
    let element;
    let ev;
    beforeEach(async () => {
      localStorage.removeItem('jsonTableEnabled');
      element = await basicFixture();
      ev = {
        key: 'jsonTableEnabled',
        newValue: 'true'
      };
    });

    it('Sets jsonTableView', () => {
      element.jsonTableView = false;
      element._onStorageChanged(ev);
      assert.isTrue(element.jsonTableView);
    });

    it('Skips when jsonTableView already set', () => {
      element.jsonTableView = true;
      element._onStorageChanged(ev);
      assert.isTrue(element.jsonTableView);
    });

    it('Skips when no newValue value', () => {
      delete ev.newValue;
      element._onStorageChanged(ev);
      assert.isUndefined(element.jsonTableView);
    });

    it('Skips when key is invalid', () => {
      ev.key = 'other';
      element._onStorageChanged(ev);
      assert.isUndefined(element.jsonTableView);
    });
  });

  describe('_copyToClipboard()', () => {
    let element;
    beforeEach(async () => {
      element = await jsonFixture();
    });

    it('Calls copy() in the `clipboard-copy` element', async () => {
      const copy = element.shadowRoot.querySelector('clipboard-copy');
      const spy = sinon.spy(copy, 'copy');
      const button = element.shadowRoot.querySelector('.action-button[data-action="copy"]');
      MockInteractions.tap(button);
      assert.isTrue(spy.called);
    });

    it('Changes the label', async () => {
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      assert.notEqual(button.innerText.trim().toLowerCase(), 'copy');
    });

    it('Disables the button', (done) => {
      setTimeout(() => {
        const button = element.shadowRoot.querySelector('[data-action="copy"]');
        button.click();
        assert.isTrue(button.disabled);
        done();
      });
    });

    (hasPartsApi ? it : it.skip)('Adds content-action-button-disabled to the button', async () => {
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      assert.isTrue(button.part.contains('content-action-button-disabled'));
    });

    (hasPartsApi ? it : it.skip)('Adds code-content-action-button-disabled to the button', async () => {
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      assert.isTrue(button.part.contains('code-content-action-button-disabled'));
    });
  });

  describe('_resetCopyButtonState()', () => {
    let element;
    beforeEach(async () => {
      element = await jsonFixture();
    });

    it('Changes label back', (done) => {
      setTimeout(() => {
        const button = element.shadowRoot.querySelector('[data-action="copy"]');
        button.innerText = 'test';
        element._resetCopyButtonState(button);
        assert.equal(button.innerText.trim().toLowerCase(), 'copy');
        done();
      });
    });

    it('Restores disabled state', (done) => {
      setTimeout(() => {
        const button = element.shadowRoot.querySelector('[data-action="copy"]');
        button.click();
        button.disabled = true;
        element._resetCopyButtonState(button);
        assert.isFalse(button.disabled);
        done();
      });
    });

    (hasPartsApi ? it : it.skip)('Removes content-action-button-disabled part from the button', async () => {
      await aTimeout();
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      element._resetCopyButtonState(button);
      assert.isFalse(button.part.contains('content-action-button-disabled'));
    });

    (hasPartsApi ? it : it.skip)('Removes code-content-action-button-disabled part from the button', async () => {
      await aTimeout();
      const button = element.shadowRoot.querySelector('[data-action="copy"]');
      button.click();
      element._resetCopyButtonState(button);
      assert.isFalse(button.part.contains('code-content-action-button-disabled'));
    });
  });

  describe('Save to file action', () => {
    let element;
    beforeEach(async () => {
      localStorage.removeItem('jsonTableEnabled');
      element = await jsonFixture();
    });

    it('dispatches export-data event', () => {
      const spy = sinon.spy();
      element.addEventListener('export-data', spy);
      const button = element.shadowRoot.querySelector('.action-button[data-action="save-file"]');
      MockInteractions.tap(button);
      const { detail } = spy.args[0][0];
      assert.equal(detail.destination, 'file', 'destination is set');
      assert.equal(detail.data, '{"test":true}', 'data is set');
      assert.equal(detail.file, 'response-data', 'file is set');
      assert.deepEqual(detail.providerOptions, {
        contentType: 'application/json'
      }, 'providerOptions is set');
    });

    it('calls saveToFile() when event is ignored', () => {
      const spy = sinon.spy(element, 'saveToFile');
      const button = element.shadowRoot.querySelector('.action-button[data-action="save-file"]');
      MockInteractions.tap(button);
      assert.isTrue(spy.called);
    });

    it('does not call saveToFile() when event is canxcelled', () => {
      const spy = sinon.spy(element, 'saveToFile');
      element.addEventListener('export-data', (e) => {
        e.preventDefault();
      });
      const button = element.shadowRoot.querySelector('.action-button[data-action="save-file"]');
      MockInteractions.tap(button);
      assert.isFalse(spy.called);
    });

    it('sets web download properties', () => {
      element.saveToFile();
      assert.typeOf(element._downloadFileUrl, 'string', '_downloadFileUrl is set');
      assert.typeOf(element._downloadFileName, 'string', '_downloadFileName is set');
    });

    it('renders download dialog instead of the response view', async () => {
      element.saveToFile();
      await nextFrame();
      const dialog = element.shadowRoot.querySelector('.save-dialog');
      assert.ok(dialog);
      const view = element.shadowRoot.querySelector('json-view');
      assert.notOk(view);
    });

    it('anhor has required web download properties', async () => {
      element.saveToFile();
      await nextFrame();
      const a = element.shadowRoot.querySelector('.save-dialog a');
      assert.notEmpty(a.href);
      assert.notEmpty(a.getAttribute('download'));
    });

    it('cancels the dialog on cancel button click', async () => {
      element.saveToFile();
      await nextFrame();
      const button = element.shadowRoot.querySelectorAll('.save-dialog anypoint-button')[0];
      MockInteractions.tap(button);
      assert.isUndefined(element._downloadFileUrl);
      assert.isUndefined(element._downloadFileName);
    });

    it('clears the state when download is clicked', async () => {
      element.saveToFile();
      await nextFrame();
      const button = element.shadowRoot.querySelectorAll('.save-dialog anypoint-button')[1];
      MockInteractions.tap(button);
      await aTimeout(250);
      assert.isUndefined(element._downloadFileUrl);
      assert.isUndefined(element._downloadFileName);
    });

    it('clears download dialog when response changes', async () => {
      element.saveToFile();
      await nextFrame();
      /* eslint-disable require-atomic-updates */
      element.responseText = 'test';
      element.contentType = 'text/plain';
      await nextFrame();
      assert.isUndefined(element._downloadFileUrl);
      assert.isUndefined(element._downloadFileName);
    });
  });

  describe('a11y', () => {
    beforeEach(() => {
      localStorage.removeItem('jsonTableEnabled');
    });

    it('is accessible when empty', async () => {
      const element = await basicFixture();
      await assert.isAccessible(element);
    });

    it('is accessible with content', async () => {
      const element = await bufferFixture();
      await assert.isAccessible(element);
    });

    it('is accessible with JSON content', async () => {
      const element = await jsonFixture();
      await assert.isAccessible(element);
    });

    it('is accessible in source view', async () => {
      const element = await jsonFixture();
      element.rawView = true;
      await nextFrame();
      await assert.isAccessible(element);
    });

    it('is accessible in JSON table view', async () => {
      const element = await jsonFixture();
      element.jsonTableView = true;
      await nextFrame();
      await assert.isAccessible(element);
    });

    it('is accessible with download dialog', async () => {
      const element = await jsonFixture();
      element.saveToFile();
      await nextFrame();
      await assert.isAccessible(element);
    });
  });
});
