/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import {PolymerElement} from '../../@polymer/polymer/polymer-element.js';
import {html} from '../../@polymer/polymer/lib/utils/html-tag.js';
import '../../@polymer/polymer/lib/elements/dom-if.js';
import '../../@advanced-rest-client/arc-icons/arc-icons.js';
import '../../@polymer/iron-pages/iron-pages.js';
import '../../@advanced-rest-client/response-raw-viewer/response-raw-viewer.js';
import '../../@advanced-rest-client/xml-viewer/xml-viewer.js';
import '../../@advanced-rest-client/json-viewer/json-viewer.js';
import '../../@advanced-rest-client/response-highlighter/response-highlighter.js';
import '../../@api-components/clipboard-copy/clipboard-copy.js';
import '../../@polymer/paper-dialog/paper-dialog.js';
import '../../@polymer/paper-icon-button/paper-icon-button.js';
import '../../@polymer/paper-toast/paper-toast.js';
import '../../@advanced-rest-client/json-table/json-table.js';
/* eslint-disable max-len */
/**
 * An element to display a HTTP response body.
 *
 * The element will try to select best view for given `contentType`. It will
 * choose the JSON viewer for JSON response and XML viewer for XML responses.
 * Otherise it will display a syntax hagligter.
 *
 * Note that the `contentType` property **must** be set in order to display any
 * view.
 *
 * ### Save content to file
 *
 * The element uses the web way of file saving. However, it sends the
 * `export-data` custom event first to check if hosting application implements
 * other save functionality. See event description for more information.
 *
 * ## Changes in version 2
 *
 * - Text search library is no longer included
 *
 * ### Styling
 *
 * `<response-body-view>` provides the following custom properties and mixins for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--response-body-view` | Mixin applied to the element | `{}`
 * `--response-body-view-dialog-title` | Mixin applied to dialog title | `{}`
 * `--response-body-view-preview-close` | Mixin applied to the response preview close button | `{}`
 * `--response-body-view-content-actions` | Mixin applied to the content actions container | `{}`
 * `--response-body-view-dialog-buttons` | Mixin applied to the dialog buttons container | `{}`
 * `--response-body-view-dialog-close` | Mixin applied to dialog's close button | `{}`
 * `--response-body-view-dialog-close-hover` | Mixin for dialog's close button when hovering | `{}`
 * `--response-body-view-dialog-download` | Mixin applies to dialog's download button | `{}`
 * `--response-body-view-dialog-download-hover` | Mixin for dialog's download when hovering | `{}`
 *
 * @polymer
 * @customElement
 * @memberof UiElements
 */
class ResponseBodyView extends PolymerElement {
  static get template() {
    return html `<style>
    :host {
      display: block;
      position: relative;
      @apply --response-body-view;
    }

    #webView {
      width: 100%;
      height: 100%;
      background-color: #fff;
      border: 0;
      margin-top: 12px;
    }

    #saveDialog {
      min-width: 320px;
    }

    paper-icon-button {
      transition: color 0.25s ease-in-out;
    }

    paper-icon-button[toggles] {
      color: var(--content-action-button-color, rgba(0, 0, 0, 0.74));
    }

    paper-icon-button:hover {
      color: var(--content-action-button-color-hover, var(--accent-color, rgba(0, 0, 0, 0.74)));
    }

    paper-icon-button[active] {
      background-color: var(--response-raw-viewer-button-active, #BDBDBD);
      border-radius: 50%;
    }

    .close-preview {
      position: absolute;
      top: 8px;
      right: 12px;
      background: #fff;
      color: rgba(0,0,0,0.74);
      @apply --response-body-view-preview-close;
    }

    [hidden] {
      display: none !important;
    }

    .content-actions {
      @apply --layout-horizontal;
      @apply --layout-center;
      @apply --response-body-view-content-actions;
    }

    .dialog-title {
      @apply --arc-font-common-base;
      @apply --response-body-view-dialog-title;
    }

    .buttons {
      @apply --response-body-view-dialog-buttons;
    }

    .button-dismiss {
      @apply --response-body-view-dialog-close;
    }

    .button-dismiss:hover {
      @apply --response-body-view-dialog-close-hover;
    }

    .button-download {
      @apply --response-body-view-dialog-download;
    }

    .button-download:hover {
      @apply --response-body-view-dialog-download-hover;
    }

    .download-link {
      text-decoration: none;
      color: inherit;
      outline: none;
    }
    </style>
    <template is="dom-if" if="[[hasData]]">
      <div class="content-actions" hidden\$="[[contentPreview]]">
        <paper-icon-button data-action="clipboard-copy" icon="arc:content-copy" on-click="_copyToClipboard" title="Copy content to clipboard"></paper-icon-button>
        <paper-icon-button data-action="save-file" icon="arc:archive" on-click="_saveFile" title="Save content to file"></paper-icon-button>
        <paper-icon-button data-action="raw-toggle" icon="arc:code" toggles="" active="{{rawView}}" title="Toogle raw response view"></paper-icon-button>
        <template is="dom-if" if="[[_computeRenderPreviewResponse(activeView)]]">
          <paper-icon-button data-action="preview" icon="arc:visibility" toggles="" active="{{contentPreview}}" title="Preview response"></paper-icon-button>
        </template>
        <template is="dom-if" if="[[isJson]]">
          <paper-icon-button data-action="json-table" icon="arc:view-column" toggles="" active="{{jsonTableView}}" title="Toggle structured table view"></paper-icon-button>
        </template>
        <template is="dom-if" if="[[_computeRenderWithRaw(activeView)]]">
          <paper-icon-button icon="arc:wrap-text" toggles="" active="{{rawTextWrap}}" title="Toggle text wrapping"></paper-icon-button>
        </template>
      </div>
    </template>
    <iron-pages selected="{{activeView}}" hidden\$="[[contentPreview]]">
      <response-raw-viewer response-text="[[_getRawContent(_raw)]]" wrap-text\$="[[rawTextWrap]]"></response-raw-viewer>
      <section>
        <template is="dom-if" if="[[isParsed]]" restamp="true">
          <response-highlighter response-text="[[_getRawContent(_raw)]]" content-type="[[contentType]]" is-timeout="{{prismTimeout}}"></response-highlighter>
        </template>
      </section>
      <section>
        <template is="dom-if" if="[[isJson]]" restamp="true">
          <json-viewer json="[[_getRawContent(_raw)]]"></json-viewer>
        </template>
      </section>
      <section>
        <template is="dom-if" if="[[isXml]]" restamp="true">
          <xml-viewer xml="[[_getRawContent(_raw)]]"></xml-viewer>
        </template>
      </section>
      <section>
        <template is="dom-if" if="[[_computeRenderJsonTable(isJson, jsonTableView)]]" restamp="true">
          <json-table json="[[_getRawContent(_raw)]]"></json-table>
        </template>
      </section>
    </iron-pages>

    <iframe id="webView" hidden\$="[[!contentPreview]]"></iframe>
    <paper-icon-button class="close-preview" title="Close response preview" icon="arc:close" on-click="closePreview" hidden\$="[[!contentPreview]]"></paper-icon-button>

    <paper-dialog id="saveDialog" on-iron-overlay-closed="_downloadDialogClose">
      <h2 class="dialog-title">Saving to file</h2>
      <div>
        <p>Your file is now ready to download.</p>
      </div>
      <div class="buttons">
        <paper-button class="button-dismiss" dialog-dismiss="">Close</paper-button>
        <a href\$="[[downloadFileUrl]]" autofocus="" download\$="[[downloadFileName]]" on-click="_downloadIconTap" target="_blank" class="download-link">
          <paper-button class="button-download">Download file</paper-button>
        </a>
      </div>
    </paper-dialog>
    <clipboard-copy content="[[_getRawContent(_raw)]]"></clipboard-copy>
    <paper-toast id="safariDownload" text="Safari doesn't support file download. Please, use other browser."></paper-toast>
    <paper-toast id="highlightTimeout"></paper-toast>

    <script id="preview" type="text/html">
      <!DOCTYPE html><html><head><title>Advanced REST client - preview</title><style>
        body,html{overflow:auto;margin:0;padding:0}body{margin:16px;min-height:200px}
        </style></head><body></body></html>
    </script>`;
  }
  static get properties() {
    return {
      /**
       * Raw response as a response text.
       */
      responseText: {
        type: String,
        observer: '_responseTextChanged'
      },
      // A variable to be set after the `responseText` change
      _raw: String,
      /**
       * The response content type.
       */
      contentType: String,
      /**
       * Current value of charset encoding, if available.
       * It should be set to correctly decode buffer to string
       */
      charset: String,
      /**
       * If true then the conent preview will be visible instead of the code view
       */
      contentPreview: {
        type: Boolean,
        value: false,
        observer: '_contentPreviewChanged'
      },
      /**
       * Computed value, true if the parsed view can be displayed.
       * If false then the syntax highligter will be removed from the DOM
       * so it will not try to do the parsing job if it is not necessary.
       */
      isParsed: {
        type: Boolean,
        value: false,
        readOnly: true
      },
      /**
       * Computed value, true if the JSON view can be displayed.
       * If false then the syntax highligter will be removed from the DOM
       * so it will not try to do the parsing job if it is not necessary.
       */
      isJson: {
        type: Boolean,
        value: false,
        readOnly: true
      },
      /**
       * Computed value, true if the XML view can be displayed.
       * If false then the syntax highligter will be removed from the DOM
       */
      isXml: {
        type: Boolean,
        value: false,
        readOnly: true
      },
      /**
       * Selected view.
       */
      activeView: Number,
      /**
       * When saving a file this will be the download URL created by the
       * `URL.createObjectURL` function.
       */
      downloadFileUrl: {
        type: String,
        readOnly: true
      },
      /**
       * Autogenerated file name for the download file.
       */
      downloadFileName: {
        type: String,
        readOnly: true
      },
      // Is true then the text in "raw" preview will be wrapped.
      rawTextWrap: Boolean,
      // If set it opens the "raw" view.
      rawView: {
        type: Boolean,
        observer: '_toggleViewSource'
      },
      // If set it opens the JSON table view.
      jsonTableView: {
        type: Boolean,
        observer: '_jsonTableViewChanged'
      },
      // Computed value, true if `contentType` and `_raw` are set
      hasData: {
        value: false,
        type: Boolean,
        computed: '_computeHasData(contentType, _raw)'
      },

      prismTimeout: {
        type: Boolean,
        observer: '_onPrismHighlightTimeout'
      },
      /**
       * True if current environment has localStorage suppport.
       * Chrome apps do not have localStorage property.
       */
      hasLocalStorage: {
        type: Boolean,
        readOnly: true,
        value: function() {
          /* global chrome */
          if (typeof chrome !== 'undefined' && chrome.i18n) {
            // Chrome apps have `chrome.i18n` property, regular website doesn't.
            // This is to avoid annoying warning message in Chrome apps.
            return false;
          }
          try {
            localStorage.getItem('test');
            return true;
          } catch (_) {
            return false;
          }
        }
      }
    };
  }

  static get observers() {
    return [
      '_contentTypeChanged(contentType, _raw)'
    ];
  }
  /**
   * @constructor
   */
  constructor() {
    super();
    this._onStorageChanged = this._onStorageChanged.bind(this);
    this._onJsonTableStateChanged = this._onJsonTableStateChanged.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('storage', this._onStorageChanged);
    window.addEventListener('json-table-state-changed', this._onJsonTableStateChanged);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this._onStorageChanged);
    window.removeEventListener('json-table-state-changed', this._onJsonTableStateChanged);
    if (this.__previewUrl) {
      window.URL.revokeObjectURL(this.__previewUrl);
      this.__previewUrl = undefined;
    }
  }

  /**
   * Handler for `prismTimeout` property change.
   * Displays "raw" view instead of syntax highlighting.
   *
   * @param {Boolean} state
   */
  _onPrismHighlightTimeout(state) {
    if (!state) {
      return;
    }
    this.__parsedView = this.activeView;
    this.activeView = 0;
    let message = 'Response pasing timeout. The response body might be';
    message += ' to long.';
    this.$.highlightTimeout.text = message;
    this.$.highlightTimeout.opened = true;
  }

  /**
   * Set's `_raw` property that it propagated to current viewer.
   * The operation is async for performance reasons.
   *
   * @param {String} payload
   */
  _responseTextChanged(payload) {
    this._setIsXml(false);
    this._setIsJson(false);
    this._setIsParsed(false);
    if (payload === undefined) {
      this.set('_raw', undefined);
      return;
    }
    if (payload === null || payload === false) {
      this.set('_raw', payload);
      return;
    }
    this.set('_raw', undefined);
    if (!payload) {
      return;
    }
    if (this.__setRawDebouncer) {
      return;
    }
    this.__setRawDebouncer = true;
    setTimeout(() => {
      this.__setRawDebouncer = false;
      this.set('_raw', this.responseText);
    }, 1);
  }

  // Computes value for `hasData` property
  _computeHasData(contentType, _raw) {
    return !!(contentType && _raw);
  }
  /**
   * Updates `activeView` property based on `contentType` value.
   *
   * @param {?String} contentType Current content type of the response
   */
  _contentTypeChanged(contentType) {
    let parsed = false;
    let json = false;
    let xml = false;
    this.contentPreview = false;
    if (contentType) {
      if (contentType.indexOf('xml') !== -1) {
        this.activeView = 3;
        xml = true;
      } else if (contentType.indexOf('json') !== -1) {
        this.activeView = 2;
        json = true;
      } else {
        this.activeView = 1;
        parsed = true;
      }
    }
    this._setIsXml(xml);
    this._setIsJson(json);
    this._setIsParsed(parsed);
    if (json) {
      this._ensureJsonTable();
    }
  }
  /**
   * When response's content type is JSON the view renders the
   * JSON table element. This function reads current state for the table
   * (if it is turned on) and handles view change if needed.
   */
  _ensureJsonTable() {
    if (!this.hasLocalStorage) {
      return;
    }
    const isTable = this._localStorageValueToBoolean(localStorage.jsonTableEnabled);
    if (this.jsonTableView !== isTable) {
      this.jsonTableView = isTable;
    }
    if (this.jsonTableView) {
      this.activeView = 4;
    } else if (this.activeView === 4) {
      this.activeView = 2;
    }
  }
  // Handler for `this.contentPreview` change.
  _contentPreviewChanged(val) {
    if (val) {
      this._openResponsePreview();
    } else {
      this._closeResponsePreview();
    }
  }
  /**
   * The component may work in Electron app where Buffer can be returned from
   * the transport library. This ensures that string is always returned.
   * @return {String} String value of `_raw` property
   */
  _getRawContent() {
    let raw = this._raw;
    if (!raw || typeof raw === 'string') {
      return raw;
    }
    if (raw && raw.type === 'Buffer') {
      raw = new Uint16Array(raw.data);
    }
    const ce = this.charset || 'utf-8';
    const decoder = new TextDecoder(ce);
    return decoder.decode(raw);
  }
  // Opens response preview in new layer
  _openResponsePreview() {
    const context = this;
    const raw = this._getRawContent();

    function onLoad() {
      try {
        context.$.webView.contentWindow.document.body.innerHTML = raw;
      } catch (_) {}
      setTimeout(() => {
        context._resizePreviewWindow(context.$.webView.contentWindow.document.body.clientHeight);
      }, 2);
    }
    if (!this.$.webView.src) {
      const blob = new Blob([this.$.preview.textContent], {
        type: 'text/html'
      });
      this.__previewUrl = window.URL.createObjectURL(blob);
      this.$.webView.src = this.__previewUrl;
      this.$.webView.addEventListener('load', () => onLoad());
    } else {
      onLoad();
    }
  }
  // Closes response preview
  _closeResponsePreview() {
    try {
      this.$.webView.contentWindow.document.body.innerHTML = '';
    } catch (_) {}
  }
  /**
   * Sets height for the preview iframe
   *
   * @param {?Number} height
   */
  _resizePreviewWindow(height) {
    if (!height) {
      this.$.webView.style.height = 'auto';
    } else {
      this.$.webView.style.height = height + 'px';
    }
  }
  /**
   * Coppies current response text value to clipboard.
   *
   * @param {CustomEvent} e
   */
  _copyToClipboard(e) {
    const button = e.composedPath()[0];
    const copy = this.shadowRoot.querySelector('clipboard-copy');
    if (copy.copy()) {
      button.icon = 'arc:done';
    } else {
      button.icon = 'arc:error';
    }
    setTimeout(() => this._resetCopyButtonState(button), 1000);
  }

  _resetCopyButtonState(button) {
    button.icon = 'arc:content-copy';
  }

  /**
   * Fires the `export-data` custom event. If the event is not canceled
   * then it will use default web implementation for file saving.
   */
  _saveFile() {
    const e = new CustomEvent('export-data', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        destination: 'file',
        data: this._getRawContent(),
        type: this.contentType,
        file: 'response-data-export'
      }
    });
    this.dispatchEvent(e);
    if (e.defaultPrevented) {
      return;
    }
    this.saveToFile();
  }
  /**
   * Creates a file object form current response text and opens a dialog
   * with the link to a file.
   */
  saveToFile() {
    let ext = '.';
    if (this.isJson) {
      ext += 'json';
    } else if (this.isXml) {
      ext += 'xml';
    } else {
      ext += 'txt';
    }
    const ct = this.contentType || 'text/plain';
    const raw = this._getRawContent();
    const file = new Blob([raw], {
      type: ct
    });
    const fileName = 'response-' + new Date().toISOString() + ext;
    this._setDownloadFileUrl(URL.createObjectURL(file));
    this._setDownloadFileName(fileName);
    this.$.saveDialog.opened = true;
  }
  // Handler for download link click to prevent default and close the dialog.
  _downloadIconTap() {
    setTimeout(() => {
      this.$.saveDialog.opened = false;
    }, 250);
  }
  // Handler for file download dialog close.
  _downloadDialogClose() {
    URL.revokeObjectURL(this.downloadFileUrl);
    this._setDownloadFileUrl(undefined);
    this._setDownloadFileName(undefined);
  }
  /**
   * Toggles "view source" or raw message view.
   *
   * @param {Boolean} opened
   */
  _toggleViewSource(opened) {
    if (!opened) {
      if (!this.__parsedView) {
        return;
      }
      this.activeView = this.__parsedView;
      this.__parsedView = undefined;
      if (this.activeView === 2 && this.jsonTableView) {
        this.jsonTableView = false;
      }
    } else {
      if (this.jsonTableView) {
        this._skipJsonTableEvent = true;
        this.jsonTableView = false;
        this._skipJsonTableEvent = false;
      }
      this.__parsedView = this.activeView;
      this.activeView = 0;
    }
  }
  // Handler for the `jsonTableView` property change.
  _jsonTableViewChanged(state) {
    if (state) {
      if (this.rawView) {
        this.__parsedView = undefined;
        this.rawView = false;
      }
      this.activeView = 4;
    } else {
      this.activeView = 2;
    }
    if (this._skipJsonTableEvent) {
      return;
    }
    if (this.hasLocalStorage) {
      if (localStorage.jsonTableEnabled !== String(state)) {
        window.localStorage.setItem('jsonTableEnabled', state);
      }
    }
    this.dispatchEvent(new CustomEvent('json-table-state-changed', {
      detail: {
        enabled: state
      },
      bubbles: true,
      composed: true
    }));
  }
  /**
   * Updates the value of the `jsonTableView` property when the
   * corresponding localStorage property change.
   *
   * @param {StorageEvent} e
   */
  _onStorageChanged(e) {
    if (e.key !== 'jsonTableEnabled') {
      return;
    }
    if (!e.newValue) {
      return;
    }
    const v = this._localStorageValueToBoolean(e.newValue);
    if (this.jsonTableView !== v) {
      this._skipJsonTableEvent = true;
      this.jsonTableView = v;
      this._skipJsonTableEvent = false;
    }
  }
  /**
   * Reads the local value (always a string) as a boolean value.
   *
   * @param {String} value The value read from the local storage.
   * @return {Boolean} Boolean value read from the value.
   */
  _localStorageValueToBoolean(value) {
    if (!value) {
      return false;
    }
    if (value === 'true') {
      value = true;
    } else {
      value = false;
    }
    return value;
  }

  _onJsonTableStateChanged(e) {
    if (e.target === this) {
      return;
    }
    const enabled = e.detail.enabled;
    if (enabled !== this.jsonTableView) {
      this._skipJsonTableEvent = true;
      this.jsonTableView = enabled;
      this._skipJsonTableEvent = false;
    }
  }

  closePreview() {
    this.contentPreview = false;
  }

  _computeRenderWithRaw(activeView) {
    return activeView === 0 ? true : false;
  }

  _computeRenderShowRaw(activeView) {
    return activeView === 0 ? false : true;
  }

  _computeRenderPreviewResponse(activeView) {
    return activeView === 1 ? true : false;
  }

  _computeRenderToggleTable(activeView) {
    return activeView === 4 || activeView === 2 ? true : false;
  }
  /**
   * Computes boolean value whether to render the JSON table element.
   *
   * @param {Boolean} isJson
   * @param {Boolean} jsonTableView
   * @return {Boolean}
   */
  _computeRenderJsonTable(isJson, jsonTableView) {
    return !!(isJson && jsonTableView);
  }
  /**
   * Fired when the element request to export data outside the application.
   *
   * Application can handle this event if it support native UX of file saving.
   * In this case this event must be canceled by calling `preventDefault()`
   * on it. If the event is not canceled then save to file dialog appears
   * with a regular download link.
   *
   * @event export-data
   * @param {String} data A text to save in the file.
   * @param {String} type Data content type
   * @param {String} file Suggested file name
   */
  /**
   * Fired when the `jsonTableView` property change to inform other
   * elements to switch corresponding view as well.
   *
   * @event json-table-state-changed
   * @param {Boolean} enabled If true then the view is enabled.
   */
}
window.customElements.define('response-body-view', ResponseBodyView);
