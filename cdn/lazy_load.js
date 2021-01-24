import "chrome://new-tab-page/strings.m.js";
import { Polymer, html, useShadow, dom, PolymerElement, mixinBehaviors } from "chrome://resources/polymer/v3_0/polymer/polymer_bundled.min.js";
import "chrome://resources/mojo/mojo/public/js/mojo_bindings_lite.js";
import "chrome://resources/mojo/mojo/public/mojom/base/big_buffer.mojom-lite.js";
import "chrome://resources/mojo/mojo/public/mojom/base/string16.mojom-lite.js";
import "chrome://resources/mojo/mojo/public/mojom/base/text_direction.mojom-lite.js";
import "chrome://resources/mojo/mojo/public/mojom/base/time.mojom-lite.js";
import "chrome://resources/mojo/skia/public/mojom/skcolor.mojom-lite.js";
import "chrome://resources/mojo/url/mojom/url.mojom-lite.js";
import "chrome://new-tab-page/omnibox.mojom-lite.js";
import "chrome://new-tab-page/new_tab_page.mojom-lite.js";
import { addSingletonGetter, isIOS, isWindows, isMac } from "chrome://resources/js/cr.m.js";
import { g as PaperRippleBehavior, i as IronSelectableBehavior, a as assert, h as hexColorToSkColor, s as skColorToRgba, e as BackgroundSelectionType, B as BrowserProxy, F as FocusOutlineManager, c as assertNotReached, j as IronMeta, f as createScrollBorders, I as ImgElement, P as PromoBrowserCommandProxy, E as EventTracker, k as assertInstanceof } from "./shared.rollup.js";
import { loadTimeData } from "chrome://resources/js/load_time_data.m.js";
import "chrome://new-tab-page/promo_browser_command.mojom-lite.js"; // Copyright 2017 The Chromium Authors. All rights reserved.
Polymer({
    _template: html `<!--css-build:shadow--><!--_html_template_start_--><style scope="cr-toggle">:host {
  --cr-toggle-checked-bar-color: var(--google-blue-600);
        --cr-toggle-checked-button-color: var(--google-blue-600);
        --cr-toggle-checked-ripple-color:
            rgba(var(--google-blue-600-rgb), .2);
        --cr-toggle-unchecked-bar-color: var(--google-grey-400);
        --cr-toggle-unchecked-button-color: white;
        --cr-toggle-unchecked-ripple-color:
            rgba(var(--google-grey-600-rgb), .15);
        -webkit-tap-highlight-color: transparent;
        cursor: pointer;
        display: block;
        min-width: 34px;
        outline: none;
        position: relative;
        width: 34px;
}

@media (prefers-color-scheme: dark) {
:host {
  --cr-toggle-checked-bar-color: var(--google-blue-refresh-300);
          --cr-toggle-checked-button-color: var(--google-blue-refresh-300);
          --cr-toggle-checked-ripple-color:
              rgba(var(--google-blue-refresh-300-rgb), .4);
          --cr-toggle-unchecked-bar-color: var(--google-grey-refresh-500);
          --cr-toggle-unchecked-button-color: var(--google-grey-refresh-300);
          --cr-toggle-unchecked-ripple-color:
              rgba(var(--google-grey-refresh-300-rgb), .4);
}

}

:host([dark]) {
  --cr-toggle-checked-bar-color: var(--google-blue-refresh-300);
        --cr-toggle-checked-button-color: var(--google-blue-refresh-300);
        --cr-toggle-checked-ripple-color:
            rgba(var(--google-blue-refresh-300-rgb), .4);
        --cr-toggle-unchecked-bar-color: var(--google-grey-refresh-500);
        --cr-toggle-unchecked-button-color: var(--google-grey-refresh-300);
        --cr-toggle-unchecked-ripple-color:
            rgba(var(--google-grey-refresh-300-rgb), .4);
}

:host([disabled]) {
  cursor: initial;
        opacity: var(--cr-disabled-opacity);
        pointer-events: none;
}

#bar {
  background-color: var(--cr-toggle-unchecked-bar-color);
        border-radius: 8px;
        height: 12px;
        left: 3px;
        position: absolute;
        top: 2px;
        transition: background-color linear 80ms;
        width: 28px;
        z-index: 0;
}

:host([checked]) #bar {
  background-color: var(--cr-toggle-checked-bar-color);
        opacity: 0.5;
}

#knob {
  background-color: var(--cr-toggle-unchecked-button-color);
        border-radius: 50%;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .4);
        display: block;
        height: 16px;
        position: relative;
        transition: transform linear 80ms, background-color linear 80ms;
        width: 16px;
        z-index: 1;
}

:host([checked]) #knob {
  background-color: var(--cr-toggle-checked-button-color);
        transform: translate3d(18px, 0, 0);
}

:host-context([dir=rtl]):host([checked]) #knob {
  transform: translate3d(-18px, 0, 0);
}

paper-ripple {
  --paper-ripple-opacity: 1;
        color: var(--cr-toggle-unchecked-ripple-color);
        height: 40px;
        left: -12px;
        pointer-events: none;
        top: -12px;
        transition: color linear 80ms;
        width: 40px;
}

:host([checked]) paper-ripple {
  color: var(--cr-toggle-checked-ripple-color);
}

:host-context([dir=rtl]) paper-ripple {
  left: auto;
        right: -12px;
}

</style>
    <span id="bar"></span>
    <span id="knob"></span>
<!--_html_template_end_-->`,
    is: "cr-toggle",
    behaviors: [PaperRippleBehavior],
    properties: { checked: { type: Boolean, value: false, reflectToAttribute: true, observer: "checkedChanged_", notify: true }, dark: { type: Boolean, value: false, reflectToAttribute: true }, disabled: { type: Boolean, value: false, reflectToAttribute: true, observer: "disabledChanged_" } },
    hostAttributes: { "aria-disabled": "false", "aria-pressed": "false", role: "button", tabindex: 0 },
    listeners: { blur: "hideRipple_", click: "onClick_", focus: "onFocus_", keydown: "onKeyDown_", keyup: "onKeyUp_", pointerdown: "onPointerDown_", pointerup: "onPointerUp_" },
    boundPointerMove_: null,
    MOVE_THRESHOLD_PX: 5,
    handledInPointerMove_: false,
    attached() {
        const direction = this.matches(":host-context([dir=rtl]) cr-toggle") ? -1 : 1;
        this.boundPointerMove_ = e => {
            e.preventDefault();
            const diff = e.clientX - this.pointerDownX_;
            if (Math.abs(diff) < this.MOVE_THRESHOLD_PX) { return }
            this.handledInPointerMove_ = true;
            const shouldToggle = diff * direction < 0 && this.checked || diff * direction > 0 && !this.checked;
            if (shouldToggle) { this.toggleState_(false) }
        }
    },
    checkedChanged_() { this.setAttribute("aria-pressed", this.checked ? "true" : "false") },
    disabledChanged_() {
        this.setAttribute("tabindex", this.disabled ? -1 : 0);
        this.setAttribute("aria-disabled", this.disabled ? "true" : "false")
    },
    onFocus_() { this.getRipple().showAndHoldDown() },
    hideRipple_() { this.getRipple().clear() },
    onPointerUp_() {
        this.removeEventListener("pointermove", this.boundPointerMove_);
        this.hideRipple_()
    },
    onPointerDown_(e) {
        if (e.button !== 0) { return }
        this.setPointerCapture(e.pointerId);
        this.pointerDownX_ = e.clientX;
        this.handledInPointerMove_ = false;
        this.addEventListener("pointermove", this.boundPointerMove_)
    },
    onClick_(e) {
        e.stopPropagation();
        e.preventDefault();
        if (this.handledInPointerMove_) { return }
        this.toggleState_(false)
    },
    toggleState_(fromKeyboard) {
        if (this.disabled) { return }
        if (!fromKeyboard) { this.hideRipple_() }
        this.checked = !this.checked;
        this.fire("change", this.checked)
    },
    onKeyDown_(e) {
        if (e.key !== " " && e.key !== "Enter") { return }
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) { return }
        if (e.key === "Enter") { this.toggleState_(true) }
    },
    onKeyUp_(e) {
        if (e.key !== " " && e.key !== "Enter") { return }
        e.preventDefault();
        e.stopPropagation();
        if (e.key === " ") { this.toggleState_(true) }
    },
    _createRipple() {
        this._rippleContainer = this.$.knob;
        const ripple = PaperRippleBehavior._createRipple();
        ripple.id = "ink";
        ripple.setAttribute("recenters", "");
        ripple.classList.add("circle", "toggle-ink");
        return ripple
    }
});
/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
var ORPHANS = new Set;
const IronResizableBehavior = {
    properties: { _parentResizable: { type: Object, observer: "_parentResizableChanged" }, _notifyingDescendant: { type: Boolean, value: false } },
    listeners: { "iron-request-resize-notifications": "_onIronRequestResizeNotifications" },
    created: function() {
        this._interestedResizables = [];
        this._boundNotifyResize = this.notifyResize.bind(this);
        this._boundOnDescendantIronResize = this._onDescendantIronResize.bind(this)
    },
    attached: function() { this._requestResizeNotifications() },
    detached: function() {
        if (this._parentResizable) { this._parentResizable.stopResizeNotificationsFor(this) } else {
            ORPHANS.delete(this);
            window.removeEventListener("resize", this._boundNotifyResize)
        }
        this._parentResizable = null
    },
    notifyResize: function() {
        if (!this.isAttached) { return }
        this._interestedResizables.forEach((function(resizable) { if (this.resizerShouldNotify(resizable)) { this._notifyDescendant(resizable) } }), this);
        this._fireResize()
    },
    assignParentResizable: function(parentResizable) {
        if (this._parentResizable) { this._parentResizable.stopResizeNotificationsFor(this) }
        this._parentResizable = parentResizable;
        if (parentResizable && parentResizable._interestedResizables.indexOf(this) === -1) {
            parentResizable._interestedResizables.push(this);
            parentResizable._subscribeIronResize(this)
        }
    },
    stopResizeNotificationsFor: function(target) {
        var index = this._interestedResizables.indexOf(target);
        if (index > -1) {
            this._interestedResizables.splice(index, 1);
            this._unsubscribeIronResize(target)
        }
    },
    _subscribeIronResize: function(target) { target.addEventListener("iron-resize", this._boundOnDescendantIronResize) },
    _unsubscribeIronResize: function(target) { target.removeEventListener("iron-resize", this._boundOnDescendantIronResize) },
    resizerShouldNotify: function(element) { return true },
    _onDescendantIronResize: function(event) { if (this._notifyingDescendant) { event.stopPropagation(); return } if (!useShadow) { this._fireResize() } },
    _fireResize: function() { this.fire("iron-resize", null, { node: this, bubbles: false }) },
    _onIronRequestResizeNotifications: function(event) {
        var target = dom(event).rootTarget;
        if (target === this) { return }
        target.assignParentResizable(this);
        this._notifyDescendant(target);
        event.stopPropagation()
    },
    _parentResizableChanged: function(parentResizable) { if (parentResizable) { window.removeEventListener("resize", this._boundNotifyResize) } },
    _notifyDescendant: function(descendant) {
        if (!this.isAttached) { return }
        this._notifyingDescendant = true;
        descendant.notifyResize();
        this._notifyingDescendant = false
    },
    _requestResizeNotifications: function() {
        if (!this.isAttached) { return }
        if (document.readyState === "loading") {
            var _requestResizeNotifications = this._requestResizeNotifications.bind(this);
            document.addEventListener("readystatechange", (function readystatechanged() {
                document.removeEventListener("readystatechange", readystatechanged);
                _requestResizeNotifications()
            }))
        } else {
            this._findParent();
            if (!this._parentResizable) {
                ORPHANS.forEach((function(orphan) { if (orphan !== this) { orphan._findParent() } }), this);
                window.addEventListener("resize", this._boundNotifyResize);
                this.notifyResize()
            } else { this._parentResizable._interestedResizables.forEach((function(resizable) { if (resizable !== this) { resizable._findParent() } }), this) }
        }
    },
    _findParent: function() {
        this.assignParentResizable(null);
        this.fire("iron-request-resize-notifications", null, { node: this, bubbles: true, cancelable: true });
        if (!this._parentResizable) { ORPHANS.add(this) } else { ORPHANS.delete(this) }
    }
};
/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
Polymer({ _template: html `<!--css-build:shadow--><style scope="iron-pages">:host {
  display: block;
}

:host > ::slotted(:not(slot):not(.iron-selected)) {
  display: none !important;
}

</style>

    <slot></slot>
`, is: "iron-pages", behaviors: [IronResizableBehavior, IronSelectableBehavior], properties: { activateEvent: { type: String, value: null } }, observers: ["_selectedPageChanged(selected)"], _selectedPageChanged: function(selected, old) { this.async(this.notifyResize) } }); // Copyright 2020 The Chromium Authors. All rights reserved.
class CrGridElement extends PolymerElement {
    static get is() { return "cr-grid" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style scope="cr-grid">:host {
  --cr-grid-gap: 0px;
}

#grid {
  display: grid;
    grid-column-gap: var(--cr-grid-gap);
    grid-row-gap: var(--cr-grid-gap);
    grid-template-columns: repeat(var(--cr-grid-columns), auto);
    width: fit-content;
}

::slotted(*) {
  align-self: center;
    justify-self: center;
}

</style>
<div id="grid" on-keydown="onKeyDown_">
  <slot id="items"></slot>
</div>
<!--_html_template_end_-->` }
    static get properties() { return { columns: { type: Number, value: 1, observer: "onColumnsChange_" } } }
    onColumnsChange_() { this.updateStyles({ "--cr-grid-columns": this.columns }) }
    onKeyDown_(e) {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
            e.preventDefault();
            const items = this.$.items.assignedElements().filter((el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)));
            const currentIndex = items.indexOf(e.target);
            const isRtl = window.getComputedStyle(this)["direction"] === "rtl";
            const bottomRowColumns = items.length % this.columns;
            const direction = ["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : -1;
            const inEdgeRow = direction === 1 ? currentIndex >= items.length - bottomRowColumns : currentIndex < this.columns;
            let delta = 0;
            switch (e.key) {
                case "ArrowLeft":
                case "ArrowRight":
                    delta = direction * (isRtl ? -1 : 1);
                    break;
                case "ArrowUp":
                case "ArrowDown":
                    delta = direction * (inEdgeRow ? bottomRowColumns : this.columns);
                    break
            }
            if (e.key === "ArrowUp" && inEdgeRow && currentIndex >= bottomRowColumns) { delta -= this.columns } else if (e.key === "ArrowDown" && !inEdgeRow && currentIndex + delta >= items.length) { delta += bottomRowColumns }
            const mod = function(m, n) { return (m % n + n) % n };
            const newIndex = mod(currentIndex + delta, items.length);
            items[newIndex].focus()
        }
        if (["Enter", " "].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            e.target.click()
        }
    }
}
customElements.define(CrGridElement.is, CrGridElement);
mojo.internal.exportModule("customizeThemes.mojom");
customizeThemes.mojom.ThemeTypeSpec = { $: mojo.internal.Enum() };
customizeThemes.mojom.ThemeType = { kDefault: 0, kAutogenerated: 1, kChrome: 2, kThirdParty: 3, MIN_VALUE: 0, MAX_VALUE: 3 };
customizeThemes.mojom.CustomizeThemesHandlerFactoryPendingReceiver = class { constructor(handle) { this.handle = handle } };
customizeThemes.mojom.CustomizeThemesHandlerFactoryRemote = class {
    constructor(opt_handle) {
        this.proxy = new mojo.internal.interfaceSupport.InterfaceRemoteBase(customizeThemes.mojom.CustomizeThemesHandlerFactoryPendingReceiver, opt_handle);
        this.$ = new mojo.internal.interfaceSupport.InterfaceRemoteBaseWrapper(this.proxy);
        this.onConnectionError = this.proxy.getConnectionErrorEventRouter()
    }
    createCustomizeThemesHandler(client, handler) { this.proxy.sendMessage(227399096, customizeThemes.mojom.CustomizeThemesHandlerFactory_CreateCustomizeThemesHandler_ParamsSpec.$, null, [client, handler]) }
};
customizeThemes.mojom.CustomizeThemesHandlerFactoryReceiver = class {
    constructor(impl) {
        this.helper_internal_ = new mojo.internal.interfaceSupport.InterfaceReceiverHelperInternal(customizeThemes.mojom.CustomizeThemesHandlerFactoryRemote);
        this.$ = new mojo.internal.interfaceSupport.InterfaceReceiverHelper(this.helper_internal_);
        this.helper_internal_.registerHandler(227399096, customizeThemes.mojom.CustomizeThemesHandlerFactory_CreateCustomizeThemesHandler_ParamsSpec.$, null, impl.createCustomizeThemesHandler.bind(impl));
        this.onConnectionError = this.helper_internal_.getConnectionErrorEventRouter()
    }
};
customizeThemes.mojom.CustomizeThemesHandlerFactory = class {
    static get $interfaceName() { return "customize_themes.mojom.CustomizeThemesHandlerFactory" }
    static getRemote() {
        let remote = new customizeThemes.mojom.CustomizeThemesHandlerFactoryRemote;
        Mojo.bindInterface(customizeThemes.mojom.CustomizeThemesHandlerFactory.$interfaceName, remote.$.bindNewPipeAndPassReceiver().handle);
        return remote
    }
};
customizeThemes.mojom.CustomizeThemesHandlerFactoryCallbackRouter = class {
    constructor() {
        this.helper_internal_ = new mojo.internal.interfaceSupport.InterfaceReceiverHelperInternal(customizeThemes.mojom.CustomizeThemesHandlerFactoryRemote);
        this.$ = new mojo.internal.interfaceSupport.InterfaceReceiverHelper(this.helper_internal_);
        this.router_ = new mojo.internal.interfaceSupport.CallbackRouter;
        this.createCustomizeThemesHandler = new mojo.internal.interfaceSupport.InterfaceCallbackReceiver(this.router_);
        this.helper_internal_.registerHandler(227399096, customizeThemes.mojom.CustomizeThemesHandlerFactory_CreateCustomizeThemesHandler_ParamsSpec.$, null, this.createCustomizeThemesHandler.createReceiverHandler(false));
        this.onConnectionError = this.helper_internal_.getConnectionErrorEventRouter()
    }
    removeListener(id) { return this.router_.removeListener(id) }
};
customizeThemes.mojom.CustomizeThemesHandlerPendingReceiver = class { constructor(handle) { this.handle = handle } };
customizeThemes.mojom.CustomizeThemesHandlerRemote = class {
    constructor(opt_handle) {
        this.proxy = new mojo.internal.interfaceSupport.InterfaceRemoteBase(customizeThemes.mojom.CustomizeThemesHandlerPendingReceiver, opt_handle);
        this.$ = new mojo.internal.interfaceSupport.InterfaceRemoteBaseWrapper(this.proxy);
        this.onConnectionError = this.proxy.getConnectionErrorEventRouter()
    }
    applyAutogeneratedTheme(frameColor) { this.proxy.sendMessage(1288351295, customizeThemes.mojom.CustomizeThemesHandler_ApplyAutogeneratedTheme_ParamsSpec.$, null, [frameColor]) }
    applyChromeTheme(id) { this.proxy.sendMessage(105284502, customizeThemes.mojom.CustomizeThemesHandler_ApplyChromeTheme_ParamsSpec.$, null, [id]) }
    applyDefaultTheme() { this.proxy.sendMessage(238663760, customizeThemes.mojom.CustomizeThemesHandler_ApplyDefaultTheme_ParamsSpec.$, null, []) }
    initializeTheme() { this.proxy.sendMessage(364731212, customizeThemes.mojom.CustomizeThemesHandler_InitializeTheme_ParamsSpec.$, null, []) }
    getChromeThemes() { return this.proxy.sendMessage(63470370, customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ParamsSpec.$, customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ResponseParamsSpec.$, []) }
    confirmThemeChanges() { this.proxy.sendMessage(1264412422, customizeThemes.mojom.CustomizeThemesHandler_ConfirmThemeChanges_ParamsSpec.$, null, []) }
    revertThemeChanges() { this.proxy.sendMessage(633055110, customizeThemes.mojom.CustomizeThemesHandler_RevertThemeChanges_ParamsSpec.$, null, []) }
};
customizeThemes.mojom.CustomizeThemesHandlerReceiver = class {
    constructor(impl) {
        this.helper_internal_ = new mojo.internal.interfaceSupport.InterfaceReceiverHelperInternal(customizeThemes.mojom.CustomizeThemesHandlerRemote);
        this.$ = new mojo.internal.interfaceSupport.InterfaceReceiverHelper(this.helper_internal_);
        this.helper_internal_.registerHandler(1288351295, customizeThemes.mojom.CustomizeThemesHandler_ApplyAutogeneratedTheme_ParamsSpec.$, null, impl.applyAutogeneratedTheme.bind(impl));
        this.helper_internal_.registerHandler(105284502, customizeThemes.mojom.CustomizeThemesHandler_ApplyChromeTheme_ParamsSpec.$, null, impl.applyChromeTheme.bind(impl));
        this.helper_internal_.registerHandler(238663760, customizeThemes.mojom.CustomizeThemesHandler_ApplyDefaultTheme_ParamsSpec.$, null, impl.applyDefaultTheme.bind(impl));
        this.helper_internal_.registerHandler(364731212, customizeThemes.mojom.CustomizeThemesHandler_InitializeTheme_ParamsSpec.$, null, impl.initializeTheme.bind(impl));
        this.helper_internal_.registerHandler(63470370, customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ParamsSpec.$, customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ResponseParamsSpec.$, impl.getChromeThemes.bind(impl));
        this.helper_internal_.registerHandler(1264412422, customizeThemes.mojom.CustomizeThemesHandler_ConfirmThemeChanges_ParamsSpec.$, null, impl.confirmThemeChanges.bind(impl));
        this.helper_internal_.registerHandler(633055110, customizeThemes.mojom.CustomizeThemesHandler_RevertThemeChanges_ParamsSpec.$, null, impl.revertThemeChanges.bind(impl));
        this.onConnectionError = this.helper_internal_.getConnectionErrorEventRouter()
    }
};
customizeThemes.mojom.CustomizeThemesHandler = class {
    static get $interfaceName() { return "customize_themes.mojom.CustomizeThemesHandler" }
    static getRemote() {
        let remote = new customizeThemes.mojom.CustomizeThemesHandlerRemote;
        Mojo.bindInterface(customizeThemes.mojom.CustomizeThemesHandler.$interfaceName, remote.$.bindNewPipeAndPassReceiver().handle);
        return remote
    }
};
customizeThemes.mojom.CustomizeThemesHandlerCallbackRouter = class {
    constructor() {
        this.helper_internal_ = new mojo.internal.interfaceSupport.InterfaceReceiverHelperInternal(customizeThemes.mojom.CustomizeThemesHandlerRemote);
        this.$ = new mojo.internal.interfaceSupport.InterfaceReceiverHelper(this.helper_internal_);
        this.router_ = new mojo.internal.interfaceSupport.CallbackRouter;
        this.applyAutogeneratedTheme = new mojo.internal.interfaceSupport.InterfaceCallbackReceiver(this.router_);
        this.helper_internal_.registerHandler(1288351295, customizeThemes.mojom.CustomizeThemesHandler_ApplyAutogeneratedTheme_ParamsSpec.$, null, this.applyAutogeneratedTheme.createReceiverHandler(false));
        this.applyChromeTheme = new mojo.internal.interfaceSupport.InterfaceCallbackReceiver(this.router_);
        this.helper_internal_.registerHandler(105284502, customizeThemes.mojom.CustomizeThemesHandler_ApplyChromeTheme_ParamsSpec.$, null, this.applyChromeTheme.createReceiverHandler(false));
        this.applyDefaultTheme = new mojo.internal.interfaceSupport.InterfaceCallbackReceiver(this.router_);
        this.helper_internal_.registerHandler(238663760, customizeThemes.mojom.CustomizeThemesHandler_ApplyDefaultTheme_ParamsSpec.$, null, this.applyDefaultTheme.createReceiverHandler(false));
        this.initializeTheme = new mojo.internal.interfaceSupport.InterfaceCallbackReceiver(this.router_);
        this.helper_internal_.registerHandler(364731212, customizeThemes.mojom.CustomizeThemesHandler_InitializeTheme_ParamsSpec.$, null, this.initializeTheme.createReceiverHandler(false));
        this.getChromeThemes = new mojo.internal.interfaceSupport.InterfaceCallbackReceiver(this.router_);
        this.helper_internal_.registerHandler(63470370, customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ParamsSpec.$, customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ResponseParamsSpec.$, this.getChromeThemes.createReceiverHandler(true));
        this.confirmThemeChanges = new mojo.internal.interfaceSupport.InterfaceCallbackReceiver(this.router_);
        this.helper_internal_.registerHandler(1264412422, customizeThemes.mojom.CustomizeThemesHandler_ConfirmThemeChanges_ParamsSpec.$, null, this.confirmThemeChanges.createReceiverHandler(false));
        this.revertThemeChanges = new mojo.internal.interfaceSupport.InterfaceCallbackReceiver(this.router_);
        this.helper_internal_.registerHandler(633055110, customizeThemes.mojom.CustomizeThemesHandler_RevertThemeChanges_ParamsSpec.$, null, this.revertThemeChanges.createReceiverHandler(false));
        this.onConnectionError = this.helper_internal_.getConnectionErrorEventRouter()
    }
    removeListener(id) { return this.router_.removeListener(id) }
};
customizeThemes.mojom.CustomizeThemesClientPendingReceiver = class { constructor(handle) { this.handle = handle } };
customizeThemes.mojom.CustomizeThemesClientRemote = class {
    constructor(opt_handle) {
        this.proxy = new mojo.internal.interfaceSupport.InterfaceRemoteBase(customizeThemes.mojom.CustomizeThemesClientPendingReceiver, opt_handle);
        this.$ = new mojo.internal.interfaceSupport.InterfaceRemoteBaseWrapper(this.proxy);
        this.onConnectionError = this.proxy.getConnectionErrorEventRouter()
    }
    setTheme(theme) { this.proxy.sendMessage(392131817, customizeThemes.mojom.CustomizeThemesClient_SetTheme_ParamsSpec.$, null, [theme]) }
};
customizeThemes.mojom.CustomizeThemesClientReceiver = class {
    constructor(impl) {
        this.helper_internal_ = new mojo.internal.interfaceSupport.InterfaceReceiverHelperInternal(customizeThemes.mojom.CustomizeThemesClientRemote);
        this.$ = new mojo.internal.interfaceSupport.InterfaceReceiverHelper(this.helper_internal_);
        this.helper_internal_.registerHandler(392131817, customizeThemes.mojom.CustomizeThemesClient_SetTheme_ParamsSpec.$, null, impl.setTheme.bind(impl));
        this.onConnectionError = this.helper_internal_.getConnectionErrorEventRouter()
    }
};
customizeThemes.mojom.CustomizeThemesClient = class {
    static get $interfaceName() { return "customize_themes.mojom.CustomizeThemesClient" }
    static getRemote() {
        let remote = new customizeThemes.mojom.CustomizeThemesClientRemote;
        Mojo.bindInterface(customizeThemes.mojom.CustomizeThemesClient.$interfaceName, remote.$.bindNewPipeAndPassReceiver().handle);
        return remote
    }
};
customizeThemes.mojom.CustomizeThemesClientCallbackRouter = class {
    constructor() {
        this.helper_internal_ = new mojo.internal.interfaceSupport.InterfaceReceiverHelperInternal(customizeThemes.mojom.CustomizeThemesClientRemote);
        this.$ = new mojo.internal.interfaceSupport.InterfaceReceiverHelper(this.helper_internal_);
        this.router_ = new mojo.internal.interfaceSupport.CallbackRouter;
        this.setTheme = new mojo.internal.interfaceSupport.InterfaceCallbackReceiver(this.router_);
        this.helper_internal_.registerHandler(392131817, customizeThemes.mojom.CustomizeThemesClient_SetTheme_ParamsSpec.$, null, this.setTheme.createReceiverHandler(false));
        this.onConnectionError = this.helper_internal_.getConnectionErrorEventRouter()
    }
    removeListener(id) { return this.router_.removeListener(id) }
};
customizeThemes.mojom.ThemeColorsSpec = { $: {} };
customizeThemes.mojom.ChromeThemeSpec = { $: {} };
customizeThemes.mojom.ThirdPartyThemeInfoSpec = { $: {} };
customizeThemes.mojom.ThemeSpec = { $: {} };
customizeThemes.mojom.CustomizeThemesHandlerFactory_CreateCustomizeThemesHandler_ParamsSpec = { $: {} };
customizeThemes.mojom.CustomizeThemesHandler_ApplyAutogeneratedTheme_ParamsSpec = { $: {} };
customizeThemes.mojom.CustomizeThemesHandler_ApplyChromeTheme_ParamsSpec = { $: {} };
customizeThemes.mojom.CustomizeThemesHandler_ApplyDefaultTheme_ParamsSpec = { $: {} };
customizeThemes.mojom.CustomizeThemesHandler_InitializeTheme_ParamsSpec = { $: {} };
customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ParamsSpec = { $: {} };
customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ResponseParamsSpec = { $: {} };
customizeThemes.mojom.CustomizeThemesHandler_ConfirmThemeChanges_ParamsSpec = { $: {} };
customizeThemes.mojom.CustomizeThemesHandler_RevertThemeChanges_ParamsSpec = { $: {} };
customizeThemes.mojom.CustomizeThemesClient_SetTheme_ParamsSpec = { $: {} };
customizeThemes.mojom.ThemeInfoSpec = { $: {} };
mojo.internal.Struct(customizeThemes.mojom.ThemeColorsSpec.$, "ThemeColors", 24, [mojo.internal.StructField("frame", 0, 0, skia.mojom.SkColorSpec.$, null, false), mojo.internal.StructField("activeTab", 8, 0, skia.mojom.SkColorSpec.$, null, false), mojo.internal.StructField("activeTabText", 16, 0, skia.mojom.SkColorSpec.$, null, false)]);
customizeThemes.mojom.ThemeColors = class {
    constructor() {
        this.frame;
        this.activeTab;
        this.activeTabText
    }
};
mojo.internal.Struct(customizeThemes.mojom.ChromeThemeSpec.$, "ChromeTheme", 24, [mojo.internal.StructField("id", 0, 0, mojo.internal.Int32, 0, false), mojo.internal.StructField("label", 8, 0, mojo.internal.String, null, false), mojo.internal.StructField("colors", 16, 0, customizeThemes.mojom.ThemeColorsSpec.$, null, false)]);
customizeThemes.mojom.ChromeTheme = class {
    constructor() {
        this.id;
        this.label;
        this.colors
    }
};
mojo.internal.Struct(customizeThemes.mojom.ThirdPartyThemeInfoSpec.$, "ThirdPartyThemeInfo", 16, [mojo.internal.StructField("id", 0, 0, mojo.internal.String, null, false), mojo.internal.StructField("name", 8, 0, mojo.internal.String, null, false)]);
customizeThemes.mojom.ThirdPartyThemeInfo = class {
    constructor() {
        this.id;
        this.name
    }
};
mojo.internal.Struct(customizeThemes.mojom.ThemeSpec.$, "Theme", 24, [mojo.internal.StructField("type", 0, 0, customizeThemes.mojom.ThemeTypeSpec.$, 0, false), mojo.internal.StructField("info", 8, 0, customizeThemes.mojom.ThemeInfoSpec.$, null, false)]);
customizeThemes.mojom.Theme = class {
    constructor() {
        this.type;
        this.info
    }
};
mojo.internal.Struct(customizeThemes.mojom.CustomizeThemesHandlerFactory_CreateCustomizeThemesHandler_ParamsSpec.$, "CustomizeThemesHandlerFactory_CreateCustomizeThemesHandler_Params", 16, [mojo.internal.StructField("client", 0, 0, mojo.internal.InterfaceProxy(customizeThemes.mojom.CustomizeThemesClientRemote), null, false), mojo.internal.StructField("handler", 8, 0, mojo.internal.InterfaceRequest(customizeThemes.mojom.CustomizeThemesHandlerPendingReceiver), null, false)]);
customizeThemes.mojom.CustomizeThemesHandlerFactory_CreateCustomizeThemesHandler_Params = class {
    constructor() {
        this.client;
        this.handler
    }
};
mojo.internal.Struct(customizeThemes.mojom.CustomizeThemesHandler_ApplyAutogeneratedTheme_ParamsSpec.$, "CustomizeThemesHandler_ApplyAutogeneratedTheme_Params", 8, [mojo.internal.StructField("frameColor", 0, 0, skia.mojom.SkColorSpec.$, null, false)]);
customizeThemes.mojom.CustomizeThemesHandler_ApplyAutogeneratedTheme_Params = class { constructor() { this.frameColor } };
mojo.internal.Struct(customizeThemes.mojom.CustomizeThemesHandler_ApplyChromeTheme_ParamsSpec.$, "CustomizeThemesHandler_ApplyChromeTheme_Params", 8, [mojo.internal.StructField("id", 0, 0, mojo.internal.Int32, 0, false)]);
customizeThemes.mojom.CustomizeThemesHandler_ApplyChromeTheme_Params = class { constructor() { this.id } };
mojo.internal.Struct(customizeThemes.mojom.CustomizeThemesHandler_ApplyDefaultTheme_ParamsSpec.$, "CustomizeThemesHandler_ApplyDefaultTheme_Params", 0, []);
customizeThemes.mojom.CustomizeThemesHandler_ApplyDefaultTheme_Params = class { constructor() {} };
mojo.internal.Struct(customizeThemes.mojom.CustomizeThemesHandler_InitializeTheme_ParamsSpec.$, "CustomizeThemesHandler_InitializeTheme_Params", 0, []);
customizeThemes.mojom.CustomizeThemesHandler_InitializeTheme_Params = class { constructor() {} };
mojo.internal.Struct(customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ParamsSpec.$, "CustomizeThemesHandler_GetChromeThemes_Params", 0, []);
customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_Params = class { constructor() {} };
mojo.internal.Struct(customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ResponseParamsSpec.$, "CustomizeThemesHandler_GetChromeThemes_ResponseParams", 8, [mojo.internal.StructField("chromeThemes", 0, 0, mojo.internal.Array(customizeThemes.mojom.ChromeThemeSpec.$, false), null, false)]);
customizeThemes.mojom.CustomizeThemesHandler_GetChromeThemes_ResponseParams = class { constructor() { this.chromeThemes } };
mojo.internal.Struct(customizeThemes.mojom.CustomizeThemesHandler_ConfirmThemeChanges_ParamsSpec.$, "CustomizeThemesHandler_ConfirmThemeChanges_Params", 0, []);
customizeThemes.mojom.CustomizeThemesHandler_ConfirmThemeChanges_Params = class { constructor() {} };
mojo.internal.Struct(customizeThemes.mojom.CustomizeThemesHandler_RevertThemeChanges_ParamsSpec.$, "CustomizeThemesHandler_RevertThemeChanges_Params", 0, []);
customizeThemes.mojom.CustomizeThemesHandler_RevertThemeChanges_Params = class { constructor() {} };
mojo.internal.Struct(customizeThemes.mojom.CustomizeThemesClient_SetTheme_ParamsSpec.$, "CustomizeThemesClient_SetTheme_Params", 8, [mojo.internal.StructField("theme", 0, 0, customizeThemes.mojom.ThemeSpec.$, null, false)]);
customizeThemes.mojom.CustomizeThemesClient_SetTheme_Params = class { constructor() { this.theme } };
mojo.internal.Union(customizeThemes.mojom.ThemeInfoSpec.$, "ThemeInfo", { chromeThemeId: { ordinal: 0, type: mojo.internal.Int32 }, autogeneratedThemeColors: { ordinal: 1, type: customizeThemes.mojom.ThemeColorsSpec.$ }, thirdPartyThemeInfo: { ordinal: 2, type: customizeThemes.mojom.ThirdPartyThemeInfoSpec.$ } });
customizeThemes.mojom.ThemeInfo; // Copyright 2020 The Chromium Authors. All rights reserved.
class ThemeIconElement extends PolymerElement {
    static get is() { return "cr-theme-icon" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style scope="cr-theme-icon">:host {
  --cr-theme-icon-size: 72px;
}

:host, svg {
  height: var(--cr-theme-icon-size);
    width: var(--cr-theme-icon-size);
}

#ring {
  fill: rgba(var(--google-blue-600-rgb), 0.4);
    visibility: hidden;
}

#checkMark {
  visibility: hidden;
}

:host([selected]) #ring, :host([selected]) #checkMark {
  visibility: visible;
}

#circle {
  fill: url(#gradient);
    stroke: var(--cr-theme-icon-stroke-color,
        var(--cr-theme-icon-frame-color));
    stroke-width: 1;
}

#leftColor {
  stop-color: var(--cr-theme-icon-active-tab-color);
}

#rightColor {
  stop-color: var(--cr-theme-icon-frame-color);
}

#checkMark circle {
  fill: var(--google-blue-600);
}

#checkMark path {
  fill: white;
}

@media (prefers-color-scheme: dark) {
#checkMark circle {
  fill: var(--google-blue-refresh-300);
}

#checkMark path {
  fill: var(--google-grey-900);
}

}

</style>
<svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="gradient" gradientUnits="objectBoundingBox" x1="50%" y1="0" x2="50.01%" y2="0">
      <stop id="leftColor" offset="0%"></stop>
      <stop id="rightColor" offset="100%"></stop>
    </linearGradient>
  </defs>
  <circle id="ring" cx="36" cy="36" r="36"></circle>
  <circle id="circle" cx="36" cy="36" r="32"></circle>
  <g id="checkMark" transform="translate(48.5, 3.5)">
    <circle cx="10" cy="10" r="10"></circle>
    <path d="m 2.9885708,9.99721 5.0109458,4.98792 0.00275,-0.003
        0.024151,0.0227 8.9741604,-9.01557 -1.431323,-1.42476 -7.5742214,7.6092
        -3.6031671,-3.58665 z">
    </path>
  </g>
</svg>
<!--_html_template_end_-->` }
}
customElements.define(ThemeIconElement.is, ThemeIconElement); // Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const parseHtmlSubset = function() {
    const allowAttribute = (node, value) => true;
    const allowedAttributes = new Map([
        ["href", (node, value) => node.tagName === "A" && (value.startsWith("chrome://") || value.startsWith("https://"))],
        ["target", (node, value) => node.tagName === "A" && value === "_blank"]
    ]);
    const allowedOptionalAttributes = new Map([
        ["class", allowAttribute],
        ["id", allowAttribute],
        ["is", (node, value) => value === "action-link" || value === ""],
        ["role", (node, value) => value === "link"],
        ["src", (node, value) => node.tagName === "IMG" && value.startsWith("chrome://")],
        ["tabindex", allowAttribute]
    ]);
    const allowedTags = new Set(["A", "B", "BR", "DIV", "P", "PRE", "SPAN", "STRONG"]);
    const allowedOptionalTags = new Set(["IMG"]);
    let unsanitizedPolicy;
    if (window.trustedTypes) { unsanitizedPolicy = trustedTypes.createPolicy("parse-html-subset", { createHTML: untrustedHTML => untrustedHTML }) }

    function mergeTags(optTags) {
        const clone = new Set(allowedTags);
        optTags.forEach((str => { const tag = str.toUpperCase(); if (allowedOptionalTags.has(tag)) { clone.add(tag) } }));
        return clone
    }

    function mergeAttrs(optAttrs) {
        const clone = new Map([...allowedAttributes]);
        optAttrs.forEach((key => { if (allowedOptionalAttributes.has(key)) { clone.set(key, allowedOptionalAttributes.get(key)) } }));
        return clone
    }

    function walk(n, f) { f(n); for (let i = 0; i < n.childNodes.length; i++) { walk(n.childNodes[i], f) } }

    function assertElement(tags, node) { if (!tags.has(node.tagName)) { throw Error(node.tagName + " is not supported") } }

    function assertAttribute(attrs, attrNode, node) { const n = attrNode.nodeName; const v = attrNode.nodeValue; if (!attrs.has(n) || !attrs.get(n)(node, v)) { throw Error(node.tagName + "[" + n + '="' + v + '"] is not supported') } }
    return function(s, opt_extraTags, opt_extraAttrs) {
        const tags = opt_extraTags ? mergeTags(opt_extraTags) : allowedTags;
        const attrs = opt_extraAttrs ? mergeAttrs(opt_extraAttrs) : allowedAttributes;
        const doc = document.implementation.createHTMLDocument("");
        const r = doc.createRange();
        r.selectNode(doc.body);
        if (window.trustedTypes) { s = unsanitizedPolicy.createHTML(s) }
        const df = r.createContextualFragment(s);
        walk(df, (function(node) {
            switch (node.nodeType) {
                case Node.ELEMENT_NODE:
                    assertElement(tags, node);
                    const nodeAttrs = node.attributes;
                    for (let i = 0; i < nodeAttrs.length; ++i) { assertAttribute(attrs, nodeAttrs[i], node) }
                    break;
                case Node.COMMENT_NODE:
                case Node.DOCUMENT_FRAGMENT_NODE:
                case Node.TEXT_NODE:
                    break;
                default:
                    throw Error("Node type " + node.nodeType + " is not supported")
            }
        }));
        return df
    }
}(); // Copyright 2015 The Chromium Authors. All rights reserved.
const I18nBehavior = {
    i18nRaw_(id, var_args) { return arguments.length === 1 ? loadTimeData.getString(id) : loadTimeData.getStringF.apply(loadTimeData, arguments) },
    i18n(id, var_args) { const rawString = this.i18nRaw_.apply(this, arguments); return parseHtmlSubset("<b>" + rawString + "</b>").firstChild.textContent },
    i18nAdvanced(id, opts) { opts = opts || {}; const args = [id].concat(opts.substitutions || []); const rawString = this.i18nRaw_.apply(this, args); return loadTimeData.sanitizeInnerHtml(rawString, opts) },
    i18nDynamic(locale, id, var_args) { return this.i18n.apply(this, Array.prototype.slice.call(arguments, 1)) },
    i18nRecursive(locale, id, var_args) {
        let args = Array.prototype.slice.call(arguments, 2);
        if (args.length > 0) {
            const self = this;
            args = args.map((function(str) { return self.i18nExists(str) ? loadTimeData.getString(str) : str }))
        }
        return this.i18nDynamic.apply(this, [locale, id].concat(args))
    },
    i18nExists(id) { return loadTimeData.valueExists(id) }
}; // Copyright 2020 The Chromium Authors. All rights reserved.
class CustomizeThemesBrowserProxyImpl {
    constructor() {
        this.handler_ = new customizeThemes.mojom.CustomizeThemesHandlerRemote;
        this.callbackRouter_ = new customizeThemes.mojom.CustomizeThemesClientCallbackRouter;
        const factory = customizeThemes.mojom.CustomizeThemesHandlerFactory.getRemote();
        factory.createCustomizeThemesHandler(this.callbackRouter_.$.bindNewPipeAndPassRemote(), this.handler_.$.bindNewPipeAndPassReceiver())
    }
    handler() { return this.handler_ }
    callbackRouter() { return this.callbackRouter_ }
    open(url) { window.open(url, "_blank") }
}
addSingletonGetter(CustomizeThemesBrowserProxyImpl); // Copyright 2020 The Chromium Authors. All rights reserved.
class CustomizeThemesElement extends(mixinBehaviors([I18nBehavior], PolymerElement)) {
    static get is() { return "cr-customize-themes" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style include="cr-hidden-style cr-icons" scope="cr-customize-themes">:host {
  --cr-customize-themes-grid-gap: 20px;
    --cr-customize-themes-icon-size: 72px;
    display: inline-block;
}

#thirdPartyThemeContainer {
  max-width: 544px;
    width: 100%;
}

#thirdPartyTheme {
  align-items: center;
    border: 1px solid var(--google-grey-refresh-300);
    border-radius: 5px;
    color: var(--cr-primary-text-color);
    display: flex;
    flex-direction: row;
    margin-bottom: 24px;
    padding: 0 16px;
}

@media (prefers-color-scheme: dark) {
#thirdPartyTheme {
  border-color: var(--google-grey-refresh-700);
}

}

#thirdPartyBrushIcon {
  -webkit-mask-image: url(chrome://resources/cr_components/customize_themes/brush.svg);
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100%;
    background-color: var(--cr-primary-text-color);
    margin-inline-end: 20px;
    min-height: 24px;
    min-width: 24px;
}

#thirdPartyThemeNameContainer {
  flex-grow: 1;
    margin-inline-end: 24px;
}

#thirdPartyThemeName {
  font-weight: bold;
}

#thirdPartyLink {
  --cr-icon-button-fill-color: var(--cr-primary-text-color);
    margin-inline-end: 24px;
}

#uninstallThirdPartyButton {
  margin: 16px 0;
}

#themesContainer {
  --cr-grid-gap: var(--cr-customize-themes-grid-gap);
}

#themesContainer > * {
  outline-width: 0;
}

:host-context(.focus-outline-visible) #themesContainer > *:focus {
  box-shadow: 0 0 0 2px rgba(var(--google-blue-600-rgb), .4);
}

#autogeneratedThemeContainer {
  display: flex;
    flex-direction: column;
    position: relative;
}

#colorPicker {
  border: 0;
    height: 0;
    margin: 0;
    padding: 0;
    visibility: hidden;
    width: 0;
}

#colorPickerIcon {
  -webkit-mask-image: url(chrome://resources/cr_components/customize_themes/colorize.svg);
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100%;
    background-color: var(--google-grey-refresh-700);
    height: 20px;
    left: calc(50% - 10px);
    position: absolute;
    top: calc(50% - 10px);
    width: 20px;
}

cr-theme-icon {
  --cr-theme-icon-size: var(--cr-customize-themes-icon-size);
}

#autogeneratedTheme {
  --cr-theme-icon-frame-color: var(--google-grey-refresh-100);
    --cr-theme-icon-active-tab-color: white;
    --cr-theme-icon-stroke-color: var(--google-grey-refresh-300);
}

#defaultTheme {
  --cr-theme-icon-frame-color: rgb(222, 225, 230);
    --cr-theme-icon-active-tab-color: white;
}

@media (prefers-color-scheme: dark) {
#defaultTheme {
  --cr-theme-icon-frame-color: rgb(var(--google-grey-900-rgb));
      --cr-theme-icon-active-tab-color: rgb(50, 54, 57);
}

}

</style>
<div id="thirdPartyThemeContainer" hidden="[[!isThirdPartyTheme_(selectedTheme)]]">
  <div id="thirdPartyTheme">
    <div id="thirdPartyBrushIcon"></div>
    <div id="thirdPartyThemeNameContainer">
      <div id="thirdPartyThemeName">
        [[selectedTheme.info.thirdPartyThemeInfo.name]]
      </div>
      <div>[[i18n('thirdPartyThemeDescription')]]</div>
    </div>
    <cr-icon-button id="thirdPartyLink" class="icon-external" role="link" on-click="onThirdPartyLinkButtonClick_">
    </cr-icon-button>
    <cr-button id="uninstallThirdPartyButton" on-click="onUninstallThirdPartyThemeClick_">
      [[i18n('uninstallThirdPartyThemeButton')]]
    </cr-button>
  </div>
</div>
<cr-grid id="themesContainer" columns="6">
  <div id="autogeneratedThemeContainer" title="[[i18n('colorPickerLabel')]]" tabindex="0" on-click="onAutogeneratedThemeClick_">
    <cr-theme-icon id="autogeneratedTheme" selected$="[[isThemeIconSelected_('autogenerated', selectedTheme)]]">
    </cr-theme-icon>
    <div id="colorPickerIcon"></div>
    <input id="colorPicker" type="color" on-change="onCustomFrameColorChange_">
    
  </div>
  <cr-theme-icon id="defaultTheme" title="[[i18n('defaultThemeLabel')]]" on-click="onDefaultThemeClick_" tabindex="0" selected$="[[isThemeIconSelected_('default', selectedTheme)]]">
  </cr-theme-icon>
  <template is="dom-repeat" id="themes" items="[[chromeThemes_]]">
    <cr-theme-icon title="[[item.label]]" on-click="onChromeThemeClick_" style="--cr-theme-icon-frame-color:
            [[skColorToRgba_(item.colors.frame)]];
            --cr-theme-icon-active-tab-color:
            [[skColorToRgba_(item.colors.activeTab)]];" tabindex="0" selected$="[[isThemeIconSelected_(item.id, selectedTheme)]]">
    </cr-theme-icon>
  </template>
</cr-grid>
<!--_html_template_end_-->` }
    static get properties() { return { selectedTheme: { type: Object, observer: "onThemeChange_", notify: true }, autoConfirmThemeChanges: { type: Boolean, value: false }, chromeThemes_: Array } }
    constructor() {
        super();
        this.handler_ = CustomizeThemesBrowserProxyImpl.getInstance().handler();
        this.callbackRouter_ = CustomizeThemesBrowserProxyImpl.getInstance().callbackRouter();
        this.setThemeListenerId_ = null
    }
    connectedCallback() {
        super.connectedCallback();
        this.handler_.initializeTheme();
        this.handler_.getChromeThemes().then((({ chromeThemes: chromeThemes }) => { this.chromeThemes_ = chromeThemes }));
        this.setThemeListenerId_ = this.callbackRouter_.setTheme.addListener((theme => { this.selectedTheme = theme }))
    }
    disconnectedCallback() {
        this.revertThemeChanges();
        this.callbackRouter_.removeListener(assert(this.setThemeListenerId_));
        super.disconnectedCallback()
    }
    confirmThemeChanges() { this.handler_.confirmThemeChanges() }
    revertThemeChanges() { this.handler_.revertThemeChanges() }
    onCustomFrameColorChange_(e) { this.handler_.applyAutogeneratedTheme(hexColorToSkColor(e.target.value)); if (this.autoConfirmThemeChanges) { this.handler_.confirmThemeChanges() } }
    onAutogeneratedThemeClick_() { this.$.colorPicker.click() }
    onDefaultThemeClick_() { this.handler_.applyDefaultTheme(); if (this.autoConfirmThemeChanges) { this.handler_.confirmThemeChanges() } }
    onChromeThemeClick_(e) { this.handler_.applyChromeTheme(this.$.themes.itemForElement(e.target).id); if (this.autoConfirmThemeChanges) { this.handler_.confirmThemeChanges() } }
    onThemeChange_() {
        if (this.selectedTheme.type !== customizeThemes.mojom.ThemeType.kAutogenerated) { return }
        const rgbaFrameColor = skColorToRgba(this.selectedTheme.info.autogeneratedThemeColors.frame);
        const rgbaActiveTabColor = skColorToRgba(this.selectedTheme.info.autogeneratedThemeColors.activeTab);
        this.$.autogeneratedTheme.style.setProperty("--cr-theme-icon-frame-color", rgbaFrameColor);
        this.$.autogeneratedTheme.style.setProperty("--cr-theme-icon-stroke-color", rgbaFrameColor);
        this.$.autogeneratedTheme.style.setProperty("--cr-theme-icon-active-tab-color", rgbaActiveTabColor);
        this.$.colorPickerIcon.style.setProperty("background-color", skColorToRgba(this.selectedTheme.info.autogeneratedThemeColors.activeTabText))
    }
    onUninstallThirdPartyThemeClick_(e) {
        this.handler_.applyDefaultTheme();
        this.handler_.confirmThemeChanges()
    }
    onThirdPartyLinkButtonClick_() { CustomizeThemesBrowserProxyImpl.getInstance().open(`https://chrome.google.com/webstore/detail/${this.selectedTheme.info.thirdPartyThemeInfo.id}`) }
    isThemeIconSelected_(id) { if (!this.selectedTheme) { return false } if (id === "autogenerated") { return this.selectedTheme.type === customizeThemes.mojom.ThemeType.kAutogenerated } else if (id === "default") { return this.selectedTheme.type === customizeThemes.mojom.ThemeType.kDefault } else { return this.selectedTheme.type === customizeThemes.mojom.ThemeType.kChrome && id === this.selectedTheme.info.chromeThemeId } }
    isThirdPartyTheme_() { return this.selectedTheme.type === customizeThemes.mojom.ThemeType.kThirdParty }
    skColorToRgba_(skColor) { return skColorToRgba(skColor) }
}
customElements.define(CustomizeThemesElement.is, CustomizeThemesElement); // Copyright 2020 The Chromium Authors. All rights reserved.
class MiniPageElement extends PolymerElement {
    static get is() { return "ntp-mini-page" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style scope="ntp-mini-page">:host {
  --ntp-mini-page-shortcut-color: var(--google-grey-refresh-300);
}

.mini-page {
  align-items: center;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    width: 100%;
}

.mini-header {
  height: 28%;
    width: 92%;
}

:host(:not([single-colored-logo])) .mini-header {
  background-image: url(icons/colored_header.svg);
    background-repeat: no-repeat;
    background-size: 100%;
}

:host([single-colored-logo]) .mini-header {
  -webkit-mask-image: url(icons/colored_header.svg);
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100%;
    background-color: var(--google-grey-refresh-300);
}

.mini-shortcuts {
  -webkit-mask-image: url(icons/shortcut_circles.svg);
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100%;
    background-color: var(--ntp-mini-page-shortcut-color);
    height: 29%;
    margin-top: 8%;
    width: 82%;
}

@media (prefers-color-scheme: dark) {
:host(:not([single-colored-logo])) .mini-header, .mini-header {
  -webkit-mask-image: url(icons/colored_header.svg);
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-size: 100%;
      background: white;
}

}

</style>
<div class="mini-page">
  <div class="mini-header"></div>
  <div class="mini-shortcuts"></div>
</div>
<!--_html_template_end_-->` }
}
customElements.define(MiniPageElement.is, MiniPageElement); // Copyright 2020 The Chromium Authors. All rights reserved.
class CustomizeBackgroundsElement extends PolymerElement {
    static get is() { return "ntp-customize-backgrounds" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style include="cr-hidden-style" scope="ntp-customize-backgrounds">:host {
  display: flex;
}

#container {
  padding: 4px;
}

cr-grid {
  --cr-grid-gap: 8px;
}

.tile {
  cursor: pointer;
    outline-width: 0;
}

ntp-iframe {
  pointer-events: none;
}

:host-context(.focus-outline-visible) .tile:focus {
  box-shadow: var(--ntp-focus-shadow);
}

.image {
  border-radius: 4px;
    display: block;
    height: 176px;
    width: 176px;
}

.label {
  color: var(--cr-primary-text-color);
    margin-bottom: 4px;
    margin-top: 3px;
    min-height: 30px;
}

.selected {
  background-color: var(--ntp-selected-background-color);
    border-radius: 4px;
    position: relative;
}

.selected .image, .selected #uploadFromDevice {
  box-shadow: 0 1px 3px 0 rgba(var(--google-grey-800-rgb), .3),
        0 4px 8px 3px rgba(var(--google-grey-800-rgb), .15);
}

.selected .image {
  transform: scale(.8);
}

.selected-circle {
  background-color: var(--ntp-background-override-color);
    border-radius: 50%;
    box-shadow: 0 3px 6px 1px rgba(0, 0, 0, .16),
        0 1px 2px 1px rgba(0, 0, 0, .23);
    display: none;
    height: 22px;
    left: initial;
    position: absolute;
    right: 10px;
    top: 8px;
    width: 22px;
}

:host-context([dir=rtl]) .selected-circle {
  left: 10px;
    right: initial;
}

.selected-check {
  -webkit-mask-image: url(icons/check_circle.svg);
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 28px;
    background-color: var(--ntp-selected-border-color);
    display: none;
    height: 28px;
    left: initial;
    position: absolute;
    right: 7px;
    top: 5px;
    width: 28px;
}

:host-context([dir=rtl]) .selected-check {
  left: 7px;
    right: initial;
}

.selected :-webkit-any(.selected-circle, .selected-check) {
  display: block;
}

#noBackground .image, #uploadFromDevice .image {
  background: var(--ntp-background-override-color);
    border: 1px solid var(--ntp-border-color);
}

#uploadFromDevice {
  position: relative;
}

#uploadFromDeviceImage {
  position: absolute;
    top: 0;
    width: 100%;
}

#uploadFromDeviceImage .label {
  text-align: center;
}

#uploadIcon {
  -webkit-mask-image: url(icons/upload.svg);
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100%;
    background-color: var(--google-grey-refresh-700);
    height: 32px;
    margin: 61px auto 8px;
    width: 32px;
}

#backgroundsDisabled {
  align-items: center;
    align-self: center;
    display: flex;
    flex-direction: column;
    width: 100%;
}

#backgroundsDisabledIcon {
  -webkit-mask-image: url(chrome://resources/images/business.svg);
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100%;
    background-color: var(--cr-primary-text-color);
    height: 48px;
    margin: auto;
    width: 48px;
}

#backgroundsDisabledTitle {
  margin-top: 10px;
    text-align: center;
    width: 50%;
}

@media (prefers-color-scheme: dark) {
.selected .image, .selected #uploadFromDevice {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .3),
          0 4px 8px 3px rgba(0, 0, 0, .15);
}

#uploadIcon {
  background-color: var(--google-grey-refresh-500);
}

}

</style>
<div id="backgroundsDisabled" hidden$="[[!customBackgroundDisabledByPolicy_]]">
  <div id="backgroundsDisabledIcon"></div>
  <div id="backgroundsDisabledTitle">你的系統管理員已停用自訂背景功能</div>
</div>
<cr-grid id="collections" columns="3" hidden="[[!showBackgroundSelection_]]">
  <div id="uploadFromDevice" class="tile" role="button" on-click="onUploadFromDeviceClick_" tabindex="0">
    <div class$="[[getCustomBackgroundClass_(theme, backgroundSelection)]]">
      <div class="image">
      </div>
      <div id="uploadFromDeviceImage">
        <div id="uploadIcon"></div>
        <div class="label">從裝置上傳</div>
      </div>
      <div class="selected-circle"></div>
      <div class="selected-check"></div>
    </div>
    <div class="label"></div>
  </div>
  <div id="noBackground" class="tile" role="button" on-click="onDefaultClick_" tabindex="0">
    <div class$="[[getNoBackgroundClass_(theme, backgroundSelection)]]">
      <div class="image">
        <ntp-mini-page></ntp-mini-page>
      </div>
      <div class="selected-circle"></div>
      <div class="selected-check"></div>
    </div>
    <div class="label">無背景圖片</div>
  </div>
  <dom-repeat id="collectionsRepeat" items="[[collections_]]">
    <template>
      <div class="tile" tabindex="0" title="[[item.label]]" role="button" on-click="onCollectionClick_">
        <ntp-iframe class="image" src="chrome-untrusted://new-tab-page/background_image?[[item.previewImageUrl.url]]">
        </ntp-iframe>
        <div class="label">[[item.label]]</div>
      </div>
    </template>
  </dom-repeat>
</cr-grid>
<cr-grid id="images" columns="3" hidden="[[!selectedCollection]]">
  <dom-repeat id="imagesRepeat" items="[[images_]]">
    <template>
      <div class$="tile
              [[getImageSelectedClass_(index, theme, backgroundSelection)]]" tabindex="0" title="[[item.attribution1]]" role="button" on-click="onImageClick_">
        <ntp-iframe class="image" src="chrome-untrusted://new-tab-page/background_image?[[item.previewImageUrl.url]]">
        </ntp-iframe>
        <div class="selected-circle"></div>
        <div class="selected-check"></div>
      </div>
    </template>
  </dom-repeat>
</cr-grid>
<!--_html_template_end_-->` }
    static get properties() { return { backgroundSelection: { type: Object, value: () => ({ type: BackgroundSelectionType.NO_SELECTION }), notify: true }, customBackgroundDisabledByPolicy_: { type: Boolean, value: () => loadTimeData.getBoolean("customBackgroundDisabledByPolicy") }, showBackgroundSelection_: { type: Boolean, computed: "computeShowBackgroundSelection_(selectedCollection)" }, selectedCollection: { notify: true, observer: "onSelectedCollectionChange_", type: Object, value: null }, theme: Object, collections_: Array, images_: Array } }
    constructor() {
        super();
        if (this.customBackgroundDisabledByPolicy_) { return }
        this.pageHandler_ = BrowserProxy.getInstance().handler;
        this.pageHandler_.getBackgroundCollections().then((({ collections: collections }) => { this.collections_ = collections }))
    }
    computeShowBackgroundSelection_() { return !this.customBackgroundDisabledByPolicy_ && !this.selectedCollection }
    getCustomBackgroundClass_() {
        switch (this.backgroundSelection.type) {
            case BackgroundSelectionType.NO_SELECTION:
                return this.theme && this.theme.backgroundImage && this.theme.backgroundImage.url.url.startsWith("chrome-untrusted://new-tab-page/background.jpg") ? "selected" : "";
            default:
                return ""
        }
    }
    getNoBackgroundClass_() {
        switch (this.backgroundSelection.type) {
            case BackgroundSelectionType.NO_BACKGROUND:
                return "selected";
            case BackgroundSelectionType.NO_SELECTION:
                return this.theme && !this.theme.backgroundImage && !this.theme.dailyRefreshCollectionId ? "selected" : "";
            case BackgroundSelectionType.IMAGE:
            case BackgroundSelectionType.DAILY_REFRESH:
            default:
                return ""
        }
    }
    getImageSelectedClass_(index) {
        const { url: url } = this.images_[index].imageUrl;
        switch (this.backgroundSelection.type) {
            case BackgroundSelectionType.IMAGE:
                return this.backgroundSelection.image.imageUrl.url === url ? "selected" : "";
            case BackgroundSelectionType.NO_SELECTION:
                return this.theme && this.theme.backgroundImage && this.theme.backgroundImage.url.url === url && !this.theme.dailyRefreshCollectionId ? "selected" : "";
            case BackgroundSelectionType.NO_BACKGROUND:
            case BackgroundSelectionType.DAILY_REFRESH:
            default:
                return ""
        }
    }
    onCollectionClick_(e) {
        this.selectedCollection = this.$.collectionsRepeat.itemForElement(e.target);
        this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kBackgroundsCollectionOpened)
    }
    async onUploadFromDeviceClick_() { this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kBackgroundsUploadFromDeviceClicked); const { success: success } = await this.pageHandler_.chooseLocalCustomBackground(); if (success) { this.dispatchEvent(new Event("close", { bubbles: true, composed: true })) } }
    onDefaultClick_() {
        if (this.backgroundSelection.type !== BackgroundSelectionType.NO_BACKGROUND) { this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kBackgroundsNoBackgroundSelected) }
        this.backgroundSelection = { type: BackgroundSelectionType.NO_BACKGROUND }
    }
    onImageClick_(e) {
        const image = this.$.imagesRepeat.itemForElement(e.target);
        if (this.backgroundSelection.type !== BackgroundSelectionType.IMAGE || this.backgroundSelection.image !== image) { this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kBackgroundsImageSelected) }
        this.backgroundSelection = { type: BackgroundSelectionType.IMAGE, image: image }
    }
    async onSelectedCollectionChange_() {
        this.images_ = [];
        if (!this.selectedCollection) { return }
        const collectionId = this.selectedCollection.id;
        const { images: images } = await this.pageHandler_.getBackgroundImages(collectionId);
        if (!this.selectedCollection || this.selectedCollection.id !== collectionId) { return }
        this.images_ = images
    }
}
customElements.define(CustomizeBackgroundsElement.is, CustomizeBackgroundsElement); // Copyright 2020 The Chromium Authors. All rights reserved.
class CustomizeShortcutsElement extends PolymerElement {
    static get is() { return "ntp-customize-shortcuts" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style include="cr-icons" scope="ntp-customize-shortcuts">:host {
  line-height: 20px;
}

#options {
  display: flex;
}

.option {
  margin-inline-end: 9px;
    width: 268px;
}

.option-image {
  border: 1px solid var(--ntp-border-color);
    border-radius: 4px;
    box-sizing: border-box;
    cursor: pointer;
    height: 176px;
    position: relative;
    width: 268px;
}

:host-context(.focus-outline-visible) .option-image:focus {
  box-shadow: var(--ntp-focus-shadow);
}

.selected .option-image {
  background-color: var(--ntp-selected-background-color);
    border-color: var(--ntp-selected-border-color);
}

.option-mini {
  background-color: var(--ntp-background-override-color);
    border: 1px solid var(--ntp-border-color);
    border-radius: 4px;
    box-sizing: border-box;
    height: 144px;
    position: absolute;
    right: 40px;
    top: 16px;
    width: 144px;
}

:host-context([dir='rtl']) .option-mini {
  left: 40px;
    right: unset;
}

.selected .option-mini {
  border-color: transparent;
    box-shadow: 0 1px 3px 0 rgba(var(--google-grey-800-rgb), .3),
        0 4px 8px 3px rgba(var(--google-grey-800-rgb), .15);
}

@media (prefers-color-scheme: dark) {
.selected .option-mini {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .3),
          0 4px 8px 3px rgba(0, 0, 0, .15);
}

}

ntp-mini-page {
  --ntp-mini-page-shortcut-color: var(--google-grey-refresh-500);
}

.selected ntp-mini-page {
  --ntp-mini-page-shortcut-color: var(--ntp-selected-border-color);
}

.option-icon {
  -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100%;
    background: 96px 96px var(--ntp-border-color);
    height: 96px;
    left: 16px;
    position: absolute;
    top: 48px;
    width: 96px;
}

#optionCustomLinks .option-icon {
  -webkit-mask-image: url(icons/account_circle.svg);
}

#optionMostVisited .option-icon {
  -webkit-mask-image: url(icons/generic_globe.svg);
}

:host-context([dir='rtl']) .option-icon {
  right: 16px;
}

.selected .option-icon {
  background-color: var(--ntp-selected-light-background-color);
}

@media (prefers-color-scheme: dark) {
.selected .option-icon {
  background-color: var(--ntp-selected-border-color);
}

}

.option-image .selected-circle {
  box-shadow: 0 3px 6px 1px rgba(0, 0, 0, .16),
        0 1px 2px 1px rgba(0, 0, 0, .23);
    height: 22px;
    left: 209px;
    top: 9px;
    width: 22px;
}

:host-context([dir='rtl']) .option-image .selected-circle {
  left: 0;
    right: 209px;
}

.option-image .selected-check {
  left: initial;
    right: 32px;
    top: 6px;
}

:host-context([dir='rtl']) .option-image .selected-check {
  left: 32px;
    right: initial;
}

.option-title {
  font-weight: bold;
    margin: 8px 0;
}

#hide {
  align-items: center;
    border: 1px solid var(--ntp-border-color);
    border-radius: 4px;
    box-sizing: border-box;
    display: flex;
    height: 64px;
    margin-top: 24px;
    max-width: 544px;
    width: 100%;
}

#hide.selected {
  background-color: var(--ntp-selected-background-color);
    border-color: var(--ntp-selected-border-color);
    color: var(--ntp-selected-border-color);
}

#hideIcon {
  margin-inline-end: 20px;
    margin-inline-start: 24px;
}

.selected #hideIcon {
  background-color: var(--ntp-selected-border-color);
}

#hideTitleContainer {
  flex-grow: 1;
}

#hideTitle {
  font-weight: bold;
}

cr-toggle {
  margin-inline-end: 20px;
}

.selected-circle {
  background: var(--ntp-background-override-color) no-repeat center;
    border-radius: 50%;
    display: none;
    height: 22px;
    left: 66px;
    position: absolute;
    top: 46px;
    width: 22px;
}

:host-context([dir='rtl']) .selected-circle {
  left: auto;
    right: 66px;
}

.selected-check {
  background: url(icons/check_circle.svg) no-repeat center;
    background-size: 28px 28px;
    display: none;
    height: 28px;
    left: 63px;
    position: absolute;
    top: 43px;
    width: 28px;
}

.selected :-webkit-any(.selected-circle, .selected-check) {
  display: block;
}

:host-context([dir='rtl']) .selected-check {
  left: auto;
    right: 63px;
}

@media (prefers-color-scheme: dark) {
.selected-check {
  background: transparent;
}

}

@media (prefers-color-scheme: dark) {
.selected-check::after {
  -webkit-mask-image: url(icons/check_circle.svg);
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-size: 28px;
      background-color: var(--google-blue-refresh-300);
      content: '';
      display: block;
      height: 28px;
      left: 0;
      position: absolute;
      top: 0;
      width: 28px;
}

}

</style>
<div id="options">
  <div id="optionCustomLinks" class$="option [[getCustomLinksSelected_(customLinksEnabled_, hide_)]]">
    <cr-button id="optionCustomLinksButton" class="option-image" tabindex="0" aria-pressed$="[[getCustomLinksAriaPressed_(customLinksEnabled_,
            hide_)]]" title="我的捷徑" on-click="onCustomLinksClick_" noink="">
      <div class="option-icon"></div>
      <div class="option-mini">
        <ntp-mini-page single-colored-logo=""></ntp-mini-page>
      </div>
      <div class="selected-circle"></div>
      <div class="selected-check"></div>
    </cr-button>
    <div class="option-title">我的捷徑</div>
    自訂專屬捷徑
  </div>
  <div id="optionMostVisited" class$="option [[getMostVisitedSelected_(customLinksEnabled_, hide_)]]">
    <cr-button id="optionMostVisitedButton" class="option-image" tabindex="0" aria-pressed$="[[getMostVisitedAriaPressed_(customLinksEnabled_,
            hide_)]]" title="最常造訪的網站" on-click="onMostVisitedClick_" on-keydown="onMostVistedKey" noink="">
      <div class="option-icon"></div>
      <div class="option-mini">
        <ntp-mini-page single-colored-logo=""></ntp-mini-page>
      </div>
      <div class="selected-circle"></div>
      <div class="selected-check"></div>
    </cr-button>
    <div class="option-title">最常造訪的網站</div>
    系統會根據你經常造訪的網站提供捷徑建議
  </div>
</div>
<div id="hide" class$="[[getHideClass_(hide_)]]">
  <div id="hideIcon" class="cr-icon icon-visibility-off"></div>
  <div id="hideTitleContainer">
    <div id="hideTitle">隱藏捷徑</div>
    不要在這個頁面顯示捷徑
  </div>
  <cr-toggle id="hideToggle" title="隱藏捷徑" checked="[[hide_]]" on-change="onHideChange_"></cr-toggle>
</div>
<!--_html_template_end_-->` }
    static get properties() { return { customLinksEnabled_: Boolean, hide_: Boolean } }
    constructor() {
        super();
        const { callbackRouter: callbackRouter, handler: handler } = BrowserProxy.getInstance();
        this.callbackRouter_ = callbackRouter;
        this.pageHandler_ = handler;
        this.setMostVisitedInfoListenerId_ = null
    }
    connectedCallback() {
        super.connectedCallback();
        this.setMostVisitedInfoListenerId_ = this.callbackRouter_.setMostVisitedInfo.addListener((info => {
            this.customLinksEnabled_ = info.customLinksEnabled;
            this.hide_ = !info.visible
        }));
        this.pageHandler_.updateMostVisitedInfo();
        FocusOutlineManager.forDocument(document)
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.callbackRouter_.removeListener(assert(this.setMostVisitedInfoListenerId_))
    }
    apply() { this.pageHandler_.setMostVisitedSettings(this.customLinksEnabled_, !this.hide_) }
    getCustomLinksAriaPressed_() { return !this.hide_ && this.customLinksEnabled_ ? "true" : "false" }
    getCustomLinksSelected_() { return !this.hide_ && this.customLinksEnabled_ ? "selected" : "" }
    getHideClass_() { return this.hide_ ? "selected" : "" }
    getMostVisitedAriaPressed_() { return !this.hide_ && !this.customLinksEnabled_ ? "true" : "false" }
    getMostVisitedSelected_() { return !this.hide_ && !this.customLinksEnabled_ ? "selected" : "" }
    onCustomLinksClick_() {
        if (!this.customLinksEnabled_) { this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kShortcutsCustomLinksClicked) }
        this.customLinksEnabled_ = true;
        this.hide_ = false
    }
    onHideChange_(e) {
        this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kShortcutsVisibilityToggleClicked);
        this.hide_ = e.detail
    }
    onMostVisitedClick_() {
        if (this.customLinksEnabled_) { this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kShortcutsMostVisitedClicked) }
        this.customLinksEnabled_ = false;
        this.hide_ = false
    }
}
customElements.define(CustomizeShortcutsElement.is, CustomizeShortcutsElement); // Copyright 2015 The Chromium Authors. All rights reserved.
var CrPolicyStrings;
const CrPolicyIndicatorType = { DEVICE_POLICY: "devicePolicy", EXTENSION: "extension", NONE: "none", OWNER: "owner", PRIMARY_USER: "primary_user", RECOMMENDED: "recommended", USER_POLICY: "userPolicy", PARENT: "parent", CHILD_RESTRICTION: "childRestriction" };
const CrPolicyIndicatorBehavior = {
    properties: { indicatorType: { type: String, value: CrPolicyIndicatorType.NONE }, indicatorSourceName: { type: String, value: "" }, indicatorVisible: { type: Boolean, computed: "getIndicatorVisible_(indicatorType)" }, indicatorIcon: { type: String, computed: "getIndicatorIcon_(indicatorType)" } },
    getIndicatorVisible_(type) { return type !== CrPolicyIndicatorType.NONE },
    getIndicatorIcon_(type) {
        switch (type) {
            case CrPolicyIndicatorType.EXTENSION:
                return "cr:extension";
            case CrPolicyIndicatorType.NONE:
                return "";
            case CrPolicyIndicatorType.PRIMARY_USER:
                return "cr:group";
            case CrPolicyIndicatorType.OWNER:
                return "cr:person";
            case CrPolicyIndicatorType.USER_POLICY:
            case CrPolicyIndicatorType.DEVICE_POLICY:
            case CrPolicyIndicatorType.RECOMMENDED:
                return "cr20:domain";
            case CrPolicyIndicatorType.PARENT:
            case CrPolicyIndicatorType.CHILD_RESTRICTION:
                return "cr20:kite";
            default:
                assertNotReached()
        }
    },
    getIndicatorTooltip(type, name, opt_matches) {
        if (!window["CrPolicyStrings"]) { return "" }
        CrPolicyStrings = window["CrPolicyStrings"];
        switch (type) {
            case CrPolicyIndicatorType.EXTENSION:
                return name.length > 0 ? CrPolicyStrings.controlledSettingExtension.replace("$1", name) : CrPolicyStrings.controlledSettingExtensionWithoutName;
            case CrPolicyIndicatorType.PRIMARY_USER:
                return CrPolicyStrings.controlledSettingShared.replace("$1", name);
            case CrPolicyIndicatorType.OWNER:
                return name.length > 0 ? CrPolicyStrings.controlledSettingWithOwner.replace("$1", name) : CrPolicyStrings.controlledSettingNoOwner;
            case CrPolicyIndicatorType.USER_POLICY:
            case CrPolicyIndicatorType.DEVICE_POLICY:
                return CrPolicyStrings.controlledSettingPolicy;
            case CrPolicyIndicatorType.RECOMMENDED:
                return opt_matches ? CrPolicyStrings.controlledSettingRecommendedMatches : CrPolicyStrings.controlledSettingRecommendedDiffers;
            case CrPolicyIndicatorType.PARENT:
                return CrPolicyStrings.controlledSettingParent;
            case CrPolicyIndicatorType.CHILD_RESTRICTION:
                return CrPolicyStrings.controlledSettingChildRestriction
        }
        return ""
    }
};
/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
Polymer({
    is: "iron-iconset-svg",
    properties: { name: { type: String, observer: "_nameChanged" }, size: { type: Number, value: 24 }, rtlMirroring: { type: Boolean, value: false }, useGlobalRtlAttribute: { type: Boolean, value: false } },
    created: function() { this._meta = new IronMeta({ type: "iconset", key: null, value: null }) },
    attached: function() { this.style.display = "none" },
    getIconNames: function() { this._icons = this._createIconMap(); return Object.keys(this._icons).map((function(n) { return this.name + ":" + n }), this) },
    applyIcon: function(element, iconName) {
        this.removeIcon(element);
        var svg = this._cloneIcon(iconName, this.rtlMirroring && this._targetIsRTL(element));
        if (svg) {
            var pde = dom(element.root || element);
            pde.insertBefore(svg, pde.childNodes[0]);
            return element._svgIcon = svg
        }
        return null
    },
    createIcon: function(iconName, targetIsRTL) { return this._cloneIcon(iconName, this.rtlMirroring && targetIsRTL) },
    removeIcon: function(element) {
        if (element._svgIcon) {
            dom(element.root || element).removeChild(element._svgIcon);
            element._svgIcon = null
        }
    },
    _targetIsRTL: function(target) {
        if (this.__targetIsRTL == null) {
            if (this.useGlobalRtlAttribute) {
                var globalElement = document.body && document.body.hasAttribute("dir") ? document.body : document.documentElement;
                this.__targetIsRTL = globalElement.getAttribute("dir") === "rtl"
            } else {
                if (target && target.nodeType !== Node.ELEMENT_NODE) { target = target.host }
                this.__targetIsRTL = target && window.getComputedStyle(target)["direction"] === "rtl"
            }
        }
        return this.__targetIsRTL
    },
    _nameChanged: function() {
        this._meta.value = null;
        this._meta.key = this.name;
        this._meta.value = this;
        this.async((function() { this.fire("iron-iconset-added", this, { node: window }) }))
    },
    _createIconMap: function() {
        var icons = Object.create(null);
        dom(this).querySelectorAll("[id]").forEach((function(icon) { icons[icon.id] = icon }));
        return icons
    },
    _cloneIcon: function(id, mirrorAllowed) { this._icons = this._icons || this._createIconMap(); return this._prepareSvgClone(this._icons[id], this.size, mirrorAllowed) },
    _prepareSvgClone: function(sourceSvg, size, mirrorAllowed) {
        if (sourceSvg) {
            var content = sourceSvg.cloneNode(true),
                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
                viewBox = content.getAttribute("viewBox") || "0 0 " + size + " " + size,
                cssText = "pointer-events: none; display: block; width: 100%; height: 100%;";
            if (mirrorAllowed && content.hasAttribute("mirror-in-rtl")) { cssText += "-webkit-transform:scale(-1,1);transform:scale(-1,1);transform-origin:center;" }
            svg.setAttribute("viewBox", viewBox);
            svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
            svg.setAttribute("focusable", "false");
            svg.style.cssText = cssText;
            svg.appendChild(content).removeAttribute("id");
            return svg
        }
        return null
    }
});
const template = html `<iron-iconset-svg name="cr20" size="20">
  <svg>
    <defs>
      <!--
      Keep these in sorted order by id="". See also http://goo.gl/Y1OdAq
      -->
      <g id="domain">
        <path d="M2,3 L2,17 L11.8267655,17 L13.7904799,17 L18,17 L18,7 L12,7 L12,3 L2,3 Z M8,13 L10,13 L10,15 L8,15 L8,13 Z M4,13 L6,13 L6,15 L4,15 L4,13 Z M8,9 L10,9 L10,11 L8,11 L8,9 Z M4,9 L6,9 L6,11 L4,11 L4,9 Z M12,9 L16,9 L16,15 L12,15 L12,9 Z M12,11 L14,11 L14,13 L12,13 L12,11 Z M8,5 L10,5 L10,7 L8,7 L8,5 Z M4,5 L6,5 L6,7 L4,7 L4,5 Z">
        </path>
      </g>
      <g id="kite">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M4.6327 8.00094L10.3199 2L16 8.00094L10.1848 16.8673C10.0995 16.9873 10.0071 17.1074 9.90047 17.2199C9.42417 17.7225 8.79147 18 8.11611 18C7.44076 18 6.80806 17.7225 6.33175 17.2199C5.85545 16.7173 5.59242 16.0497 5.59242 15.3371C5.59242 14.977 5.46445 14.647 5.22275 14.3919C4.98104 14.1369 4.66825 14.0019 4.32701 14.0019H4V12.6667H4.32701C5.00237 12.6667 5.63507 12.9442 6.11137 13.4468C6.58768 13.9494 6.85071 14.617 6.85071 15.3296C6.85071 15.6896 6.97867 16.0197 7.22038 16.2747C7.46209 16.5298 7.77488 16.6648 8.11611 16.6648C8.45735 16.6648 8.77014 16.5223 9.01185 16.2747C9.02396 16.2601 9.03607 16.246 9.04808 16.2319C9.08541 16.1883 9.12176 16.1458 9.15403 16.0947L9.55213 15.4946L4.6327 8.00094ZM10.3199 13.9371L6.53802 8.17116L10.3199 4.1814L14.0963 8.17103L10.3199 13.9371Z">
        </path>
      </g>
      <g id="menu">
        <path d="M2 4h16v2H2zM2 9h16v2H2zM2 14h16v2H2z"></path>
      </g>
      
  </defs></svg>
</iron-iconset-svg>
<iron-iconset-svg name="cr" size="24">
  <svg>
    <defs>
      <!--
      These icons are copied from Polymer's iron-icons and kept in sorted order.
      See http://goo.gl/Y1OdAq for instructions on adding additional icons.
      -->
      <g id="account-child-invert" viewBox="0 0 48 48">
        <path d="M24 4c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6z"></path>
        <path fill="none" d="M0 0h48v48H0V0z"></path>
        <circle fill="none" cx="24" cy="26" r="4"></circle>
        <path d="M24 18c-6.16 0-13 3.12-13 7.23v11.54c0 2.32 2.19 4.33 5.2 5.63 2.32 1 5.12 1.59 7.8 1.59.66 0 1.33-.06 2-.14v-5.2c-.67.08-1.34.14-2 .14-2.63 0-5.39-.57-7.68-1.55.67-2.12 4.34-3.65 7.68-3.65.86 0 1.75.11 2.6.29 2.79.62 5.2 2.15 5.2 4.04v4.47c3.01-1.31 5.2-3.31 5.2-5.63V25.23C37 21.12 30.16 18 24 18zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z">
        </path>
      </g>
      <g id="add">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
      </g>
      <g id="arrow-back">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
      </g>
      <g id="arrow-drop-up">
        <path d="M7 14l5-5 5 5z">
      </path></g>
      <g id="arrow-drop-down">
        <path d="M7 10l5 5 5-5z"></path>
      </g>
      <g id="arrow-forward">
        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path>
      </g>
      <g id="arrow-right">
        <path d="M10 7l5 5-5 5z"></path>
      </g>
      
      <g id="cancel">
        <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z">
        </path>
      </g>
      <g id="check">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
      </g>
      <g id="check-circle">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z">
        </path>
      </g>
      <g id="chevron-left">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
      </g>
      <g id="chevron-right">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
      </g>
      <g id="clear">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z">
        </path>
      </g>
      <g id="close">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z">
        </path>
      </g>
      <g id="computer">
        <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z">
        </path>
      </g>
      <g id="delete">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
      </g>
      <g id="domain">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z">
        </path>
      </g>
      <g id="error">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z">
        </path>
      </g>
      <g id="error-outline">
        <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z">
        </path>
      </g>
      <g id="expand-less">
        <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"></path>
      </g>
      <g id="expand-more">
        <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path>
      </g>
      <g id="extension">
        <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z">
        </path>
      </g>
      <g id="file-download">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path>
      </g>
      
      <g id="fullscreen">
        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path>
      </g>
      <g id="group">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z">
        </path>
      </g>
      <g id="help-outline">
        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z">
        </path>
      </g>
      <g id="info">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z">
        </path>
      </g>
      <g id="info-outline">
        <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z">
        </path>
      </g>
      <g id="insert-drive-file">
        <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z">
        </path>
      </g>
      <g id="location-on">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z">
        </path>
      </g>
      <g id="mic">
        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z">
        </path>
      </g>
      <g id="more-vert">
        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z">
        </path>
      </g>
      <g id="open-in-new">
        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z">
        </path>
      </g>
      <g id="person">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z">
        </path>
      </g>
      <g id="print">
        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z">
        </path>
      </g>
      <g id="search">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z">
        </path>
      </g>
      <g id="security">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z">
        </path>
      </g>
      
      <!-- The <g> IDs are exposed as global variables in Vulcanized mode, which
        conflicts with the "settings" namespace of MD Settings. Using an "_icon"
        suffix prevents the naming conflict. -->
      <g id="settings_icon">
        <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z">
        </path>
      </g>
      <g id="star">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
      </g>
      <g id="sync">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z">
        </path>
      </g>
      <g id="videocam">
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z">
        </path>
      </g>
      <g id="warning">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"></path>
      </g>
    </defs>
  </svg>
</iron-iconset-svg>
`;
document.head.appendChild(template.content);
/**
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
Polymer({
    _template: html `<!--css-build:shadow--><style scope="paper-tooltip">:host {
  display: block;
        position: absolute;
        outline: none;
        z-index: 1002;
        user-select: none;
        cursor: default;
}

#tooltip {
  display: block;
        outline: none;
        ;
        font-size: 10px;
        line-height: 1;
        background-color: var(--paper-tooltip-background, #616161);
        color: var(--paper-tooltip-text-color, white);
        padding: 8px;
        border-radius: 2px;
        font-size: var(--paper-tooltip_-_font-size, 10px); font-weight: var(--paper-tooltip_-_font-weight); max-width: var(--paper-tooltip_-_max-width); min-width: var(--paper-tooltip_-_min-width); padding: var(--paper-tooltip_-_padding, 8px);
}

@keyframes keyFrameScaleUp {
0% {
  transform: scale(0.0);
}

100% {
  transform: scale(1.0);
}

}

@keyframes keyFrameScaleDown {
0% {
  transform: scale(1.0);
}

100% {
  transform: scale(0.0);
}

}

@keyframes keyFrameFadeInOpacity {
0% {
  opacity: 0;
}

100% {
  opacity: var(--paper-tooltip-opacity, 0.9);
}

}

@keyframes keyFrameFadeOutOpacity {
0% {
  opacity: var(--paper-tooltip-opacity, 0.9);
}

100% {
  opacity: 0;
}

}

@keyframes keyFrameSlideDownIn {
0% {
  transform: translateY(-2000px);
          opacity: 0;
}

10% {
  opacity: 0.2;
}

100% {
  transform: translateY(0);
          opacity: var(--paper-tooltip-opacity, 0.9);
}

}

@keyframes keyFrameSlideDownOut {
0% {
  transform: translateY(0);
          opacity: var(--paper-tooltip-opacity, 0.9);
}

10% {
  opacity: 0.2;
}

100% {
  transform: translateY(-2000px);
          opacity: 0;
}

}

.fade-in-animation {
  opacity: 0;
        animation-delay: var(--paper-tooltip-delay-in, 500ms);
        animation-name: keyFrameFadeInOpacity;
        animation-iteration-count: 1;
        animation-timing-function: ease-in;
        animation-duration: var(--paper-tooltip-duration-in, 500ms);
        animation-fill-mode: forwards;
        ;
}

.fade-out-animation {
  opacity: var(--paper-tooltip-opacity, 0.9);
        animation-delay: var(--paper-tooltip-delay-out, 0ms);
        animation-name: keyFrameFadeOutOpacity;
        animation-iteration-count: 1;
        animation-timing-function: ease-in;
        animation-duration: var(--paper-tooltip-duration-out, 500ms);
        animation-fill-mode: forwards;
        ;
}

.scale-up-animation {
  transform: scale(0);
        opacity: var(--paper-tooltip-opacity, 0.9);
        animation-delay: var(--paper-tooltip-delay-in, 500ms);
        animation-name: keyFrameScaleUp;
        animation-iteration-count: 1;
        animation-timing-function: ease-in;
        animation-duration: var(--paper-tooltip-duration-in, 500ms);
        animation-fill-mode: forwards;
        ;
}

.scale-down-animation {
  transform: scale(1);
        opacity: var(--paper-tooltip-opacity, 0.9);
        animation-delay: var(--paper-tooltip-delay-out, 500ms);
        animation-name: keyFrameScaleDown;
        animation-iteration-count: 1;
        animation-timing-function: ease-in;
        animation-duration: var(--paper-tooltip-duration-out, 500ms);
        animation-fill-mode: forwards;
        ;
}

.slide-down-animation {
  transform: translateY(-2000px);
        opacity: 0;
        animation-delay: var(--paper-tooltip-delay-out, 500ms);
        animation-name: keyFrameSlideDownIn;
        animation-iteration-count: 1;
        animation-timing-function: cubic-bezier(0.0, 0.0, 0.2, 1);
        animation-duration: var(--paper-tooltip-duration-out, 500ms);
        animation-fill-mode: forwards;
        ;
}

.slide-down-animation-out {
  transform: translateY(0);
        opacity: var(--paper-tooltip-opacity, 0.9);
        animation-delay: var(--paper-tooltip-delay-out, 500ms);
        animation-name: keyFrameSlideDownOut;
        animation-iteration-count: 1;
        animation-timing-function: cubic-bezier(0.4, 0.0, 1, 1);
        animation-duration: var(--paper-tooltip-duration-out, 500ms);
        animation-fill-mode: forwards;
        ;
}

.cancel-animation {
  animation-delay: -30s !important;
}

.hidden {
  display: none !important;
}

</style>

    <div id="tooltip" class="hidden">
      <slot></slot>
    </div>
`,
    is: "paper-tooltip",
    hostAttributes: { role: "tooltip", tabindex: -1 },
    properties: { for: { type: String, observer: "_findTarget" }, manualMode: { type: Boolean, value: false, observer: "_manualModeChanged" }, position: { type: String, value: "bottom" }, fitToVisibleBounds: { type: Boolean, value: false }, offset: { type: Number, value: 14 }, marginTop: { type: Number, value: 14 }, animationDelay: { type: Number, value: 500, observer: "_delayChange" }, animationEntry: { type: String, value: "" }, animationExit: { type: String, value: "" }, animationConfig: { type: Object, value: function() { return { entry: [{ name: "fade-in-animation", node: this, timing: { delay: 0 } }], exit: [{ name: "fade-out-animation", node: this }] } } }, _showing: { type: Boolean, value: false } },
    listeners: { webkitAnimationEnd: "_onAnimationEnd" },
    get target() { if (this._manualTarget) return this._manualTarget; var parentNode = dom(this).parentNode; var ownerRoot = dom(this).getOwnerRoot(); var target; if (this.for) { target = dom(ownerRoot).querySelector("#" + this.for) } else { target = parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE ? ownerRoot.host : parentNode } return target },
    set target(target) {
        this._manualTarget = target;
        this._findTarget()
    },
    attached: function() { this._findTarget() },
    detached: function() { if (!this.manualMode) this._removeListeners() },
    playAnimation: function(type) { if (type === "entry") { this.show() } else if (type === "exit") { this.hide() } },
    cancelAnimation: function() { this.$.tooltip.classList.add("cancel-animation") },
    show: function() {
        if (this._showing) return;
        if (dom(this).textContent.trim() === "") { var allChildrenEmpty = true; var effectiveChildren = dom(this).getEffectiveChildNodes(); for (var i = 0; i < effectiveChildren.length; i++) { if (effectiveChildren[i].textContent.trim() !== "") { allChildrenEmpty = false; break } } if (allChildrenEmpty) { return } }
        this._showing = true;
        this.$.tooltip.classList.remove("hidden");
        this.$.tooltip.classList.remove("cancel-animation");
        this.$.tooltip.classList.remove(this._getAnimationType("exit"));
        this.updatePosition();
        this._animationPlaying = true;
        this.$.tooltip.classList.add(this._getAnimationType("entry"))
    },
    hide: function() {
        if (!this._showing) { return }
        if (this._animationPlaying) {
            this._showing = false;
            this._cancelAnimation();
            return
        } else { this._onAnimationFinish() }
        this._showing = false;
        this._animationPlaying = true
    },
    updatePosition: function() {
        if (!this._target || !this.offsetParent) return;
        var offset = this.offset;
        if (this.marginTop != 14 && this.offset == 14) offset = this.marginTop;
        var parentRect = this.offsetParent.getBoundingClientRect();
        var targetRect = this._target.getBoundingClientRect();
        var thisRect = this.getBoundingClientRect();
        var horizontalCenterOffset = (targetRect.width - thisRect.width) / 2;
        var verticalCenterOffset = (targetRect.height - thisRect.height) / 2;
        var targetLeft = targetRect.left - parentRect.left;
        var targetTop = targetRect.top - parentRect.top;
        var tooltipLeft, tooltipTop;
        switch (this.position) {
            case "top":
                tooltipLeft = targetLeft + horizontalCenterOffset;
                tooltipTop = targetTop - thisRect.height - offset;
                break;
            case "bottom":
                tooltipLeft = targetLeft + horizontalCenterOffset;
                tooltipTop = targetTop + targetRect.height + offset;
                break;
            case "left":
                tooltipLeft = targetLeft - thisRect.width - offset;
                tooltipTop = targetTop + verticalCenterOffset;
                break;
            case "right":
                tooltipLeft = targetLeft + targetRect.width + offset;
                tooltipTop = targetTop + verticalCenterOffset;
                break
        }
        if (this.fitToVisibleBounds) {
            if (parentRect.left + tooltipLeft + thisRect.width > window.innerWidth) {
                this.style.right = "0px";
                this.style.left = "auto"
            } else {
                this.style.left = Math.max(0, tooltipLeft) + "px";
                this.style.right = "auto"
            }
            if (parentRect.top + tooltipTop + thisRect.height > window.innerHeight) {
                this.style.bottom = parentRect.height - targetTop + offset + "px";
                this.style.top = "auto"
            } else {
                this.style.top = Math.max(-parentRect.top, tooltipTop) + "px";
                this.style.bottom = "auto"
            }
        } else {
            this.style.left = tooltipLeft + "px";
            this.style.top = tooltipTop + "px"
        }
    },
    _addListeners: function() {
        if (this._target) {
            this.listen(this._target, "mouseenter", "show");
            this.listen(this._target, "focus", "show");
            this.listen(this._target, "mouseleave", "hide");
            this.listen(this._target, "blur", "hide");
            this.listen(this._target, "tap", "hide")
        }
        this.listen(this.$.tooltip, "animationend", "_onAnimationEnd");
        this.listen(this, "mouseenter", "hide")
    },
    _findTarget: function() {
        if (!this.manualMode) this._removeListeners();
        this._target = this.target;
        if (!this.manualMode) this._addListeners()
    },
    _delayChange: function(newValue) { if (newValue !== 500) { this.updateStyles({ "--paper-tooltip-delay-in": newValue + "ms" }) } },
    _manualModeChanged: function() {
        if (this.manualMode) this._removeListeners();
        else this._addListeners()
    },
    _cancelAnimation: function() {
        this.$.tooltip.classList.remove(this._getAnimationType("entry"));
        this.$.tooltip.classList.remove(this._getAnimationType("exit"));
        this.$.tooltip.classList.remove("cancel-animation");
        this.$.tooltip.classList.add("hidden")
    },
    _onAnimationFinish: function() {
        if (this._showing) {
            this.$.tooltip.classList.remove(this._getAnimationType("entry"));
            this.$.tooltip.classList.remove("cancel-animation");
            this.$.tooltip.classList.add(this._getAnimationType("exit"))
        }
    },
    _onAnimationEnd: function() {
        this._animationPlaying = false;
        if (!this._showing) {
            this.$.tooltip.classList.remove(this._getAnimationType("exit"));
            this.$.tooltip.classList.add("hidden")
        }
    },
    _getAnimationType: function(type) { if (type === "entry" && this.animationEntry !== "") { return this.animationEntry } if (type === "exit" && this.animationExit !== "") { return this.animationExit } if (this.animationConfig[type] && typeof this.animationConfig[type][0].name === "string") { if (this.animationConfig[type][0].timing && this.animationConfig[type][0].timing.delay && this.animationConfig[type][0].timing.delay !== 0) { var timingDelay = this.animationConfig[type][0].timing.delay; if (type === "entry") { this.updateStyles({ "--paper-tooltip-delay-in": timingDelay + "ms" }) } else if (type === "exit") { this.updateStyles({ "--paper-tooltip-delay-out": timingDelay + "ms" }) } } return this.animationConfig[type][0].name } },
    _removeListeners: function() {
        if (this._target) {
            this.unlisten(this._target, "mouseenter", "show");
            this.unlisten(this._target, "focus", "show");
            this.unlisten(this._target, "mouseleave", "hide");
            this.unlisten(this._target, "blur", "hide");
            this.unlisten(this._target, "tap", "hide")
        }
        this.unlisten(this.$.tooltip, "animationend", "_onAnimationEnd");
        this.unlisten(this, "mouseenter", "hide")
    }
}); // Copyright 2017 The Chromium Authors. All rights reserved.
Polymer({ _template: html `<!--css-build:shadow--><!--_html_template_start_--><style include="cr-shared-style" scope="cr-tooltip-icon">:host {
  display: flex;
}

iron-icon {
  --iron-icon-width: var(--cr-icon-size);
        --iron-icon-height: var(--cr-icon-size);
}

</style>
    <iron-icon id="indicator" tabindex="0" aria-label$="[[iconAriaLabel]]" aria-describedby="tooltip" icon="[[iconClass]]"></iron-icon>
    <paper-tooltip id="tooltip" for="indicator" position="[[tooltipPosition]]" fit-to-visible-bounds="" part="tooltip">
      [[tooltipText]]
    </paper-tooltip>
<!--_html_template_end_-->`, is: "cr-tooltip-icon", properties: { iconAriaLabel: String, iconClass: String, tooltipText: String, tooltipPosition: { type: String, value: "top" } }, getFocusableElement() { return this.$.indicator } }); // Copyright 2017 The Chromium Authors. All rights reserved.
Polymer({ _template: html `<!--css-build:shadow--><!--_html_template_start_--><style include="cr-hidden-style" scope="cr-policy-indicator"></style>
    <cr-tooltip-icon hidden$="[[!indicatorVisible]]" tooltip-text="[[indicatorTooltip_]]" icon-class="[[indicatorIcon]]" icon-aria-label="[[iconAriaLabel]]">
    </cr-tooltip-icon>
<!--_html_template_end_-->`, is: "cr-policy-indicator", behaviors: [CrPolicyIndicatorBehavior], properties: { iconAriaLabel: String, indicatorTooltip_: { type: String, computed: "getIndicatorTooltip_(indicatorType, indicatorSourceName)" } }, getIndicatorTooltip_(indicatorType, indicatorSourceName) { return this.getIndicatorTooltip(indicatorType, indicatorSourceName) } }); // Copyright 2020 The Chromium Authors. All rights reserved.
class CustomizeModulesElement extends PolymerElement {
    static get is() { return "ntp-customize-modules" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style include="cr-icons" scope="ntp-customize-modules">:host {
  line-height: 20px;
}

#hide {
  align-items: center;
    border: 1px solid var(--ntp-border-color);
    border-radius: 4px;
    box-sizing: border-box;
    display: flex;
    height: 64px;
    max-width: 544px;
    width: 100%;
}

:host([selected_]) #hide {
  background-color: var(--ntp-selected-background-color);
    border-color: var(--ntp-selected-border-color);
    color: var(--ntp-selected-border-color);
}

#hideIcon {
  margin-inline-end: 20px;
    margin-inline-start: 24px;
}

:host([selected_]) #hideIcon {
  background-color: var(--ntp-selected-border-color);
}

#hideTitleContainer {
  flex-grow: 1;
}

#hideTitle {
  font-weight: bold;
}

cr-policy-indicator {
  margin-inline-end: 24px;
}

cr-toggle {
  margin-inline-end: 20px;
}

</style>
<div id="hide">
  <div id="hideIcon" class="cr-icon icon-visibility-off"></div>
  <div id="hideTitleContainer">
    <div id="hideTitle">隱藏資訊卡</div>
    不要在這個頁面顯示資訊卡
  </div>
  <cr-policy-indicator indicator-type="devicePolicy" hidden="[[!hideManagedByPolicy_]]">
  </cr-policy-indicator>
  <cr-toggle id="hideToggle" title="隱藏資訊卡" checked="[[hide_]]" on-change="onHideChange_" disabled="[[hideManagedByPolicy_]]">
  </cr-toggle>
</div>
<!--_html_template_end_-->` }
    static get properties() { return { hide_: { type: Boolean, reflectToAttribute: true }, hideManagedByPolicy_: { type: Boolean, value: () => loadTimeData.getBoolean("modulesVisibleManagedByPolicy") }, selected_: { type: Boolean, reflectToAttribute: true, computed: "computeSelected_(hide_, hideManagedByPolicy_)" } } }
    constructor() {
        super();
        this.setModulesVisibleListenerId_ = null
    }
    connectedCallback() {
        super.connectedCallback();
        this.setModulesVisibleListenerId_ = BrowserProxy.getInstance().callbackRouter.setModulesVisible.addListener((visible => { this.hide_ = !visible }));
        BrowserProxy.getInstance().handler.updateModulesVisible()
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        BrowserProxy.getInstance().callbackRouter.removeListener(assert(this.setModulesVisibleListenerId_))
    }
    ready() {
        window.CrPolicyStrings = { controlledSettingPolicy: loadTimeData.getString("controlledSettingPolicy") };
        super.ready()
    }
    apply() { BrowserProxy.getInstance().handler.setModulesVisible(!this.hide_) }
    computeSelected_() { return this.hide_ && !this.hideManagedByPolicy_ }
    onHideChange_(e) { this.hide_ = e.detail }
}
customElements.define(CustomizeModulesElement.is, CustomizeModulesElement); // Copyright 2019 The Chromium Authors. All rights reserved.
class CustomizeDialogElement extends PolymerElement {
    static get is() { return "ntp-customize-dialog" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style include="cr-hidden-style cr-icons" scope="ntp-customize-dialog">cr-dialog::part(dialog) {
  height: 100%;
    max-height: 520px;
    min-width: 800px;
}

cr-dialog::part(wrapper) {
  height: 100%;
}

cr-dialog::part(body-container) {
  flex-grow: 1;
}

div[slot=title] {
  align-items: center;
    color: var(--cr-primary-text-color);
    display: flex;
    flex-direction: row;
    height: 64px;
    margin-top: 16px;
    padding: 0;
}

div[slot=body] {
  color: var(--cr-primary-text-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
}

#bodyContainer {
  display: flex;
    flex-direction: row;
    overflow: hidden;
}

div[slot=button-container] {
  padding-top: 16px;
}

#menuContainer, #pagesContainer {
  overflow: hidden;
}

#leftTitleSpacer, #menuContainer {
  flex-basis: 232px;
}

#title {
  line-height: 1.5;
    margin-bottom: -2px;
    padding-inline-end: 24px;
    user-select: none;
}

#title, #pagesContainer {
  flex-grow: 1;
}

#menu, #pages {
  height: 100%;
    overflow: auto;
}

#pages > iron-pages {
  margin: 2px;
}

div[scroll-border] {
  border-bottom: 1px solid transparent;
}

div[scroll-border][show-1], div[scroll-border][show-2] {
  border-bottom-color: var(--ntp-border-color);
}

#menu {
  display: flex;
    flex-direction: column;
}

#menuSelector {
  margin-bottom: 2px;
    margin-top: 2px;
}

.menu-item {
  align-items: center;
    border-radius: 0 16px 16px 0;
    color: var(--cr-primary-text-color);
    cursor: pointer;
    display: flex;
    flex-direction: row;
    flex-shrink: 0;
    font-size: 14px;
    height: 32px;
    outline: none;
    width: 192px;
}

.menu-item + .menu-item {
  margin-top: 16px;
}

:host-context([dir=rtl]) .menu-item {
  border-radius: 16px 0 0 16px;
}

.menu-item:hover {
  background-color: var(--ntp-hover-background-color);
}

:host-context(.focus-outline-visible) .menu-item:focus {
  box-shadow: var(--ntp-focus-shadow);
}

.menu-item:active {
  background-color: var(--ntp-active-background-color);
}

.menu-item[selected] {
  background-color: var(--ntp-selected-background-color);
    color: var(--ntp-selected-primary-text-color);
}

.menu-item-icon {
  -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100%;
    background-color: var(--cr-primary-text-color);
    height: 20px;
    margin-inline-end: 16px;
    margin-inline-start: 24px;
    width: 20px;
}

.menu-item[selected] .menu-item-icon {
  background-color: var(--ntp-selected-primary-text-color);
}

#backgroundsIcon {
  -webkit-mask-image: url(icons/backgrounds.svg);
}

#shortcutsIcon {
  -webkit-mask-image: url(icons/link.svg);
}

#modulesIcon {
  -webkit-mask-image: url(icons/cards.svg);
}

#themesIcon {
  -webkit-mask-image: url(icons/colors.svg);
}

#backButton {
  --cr-icon-button-fill-color: var(--cr-primary-text-color);
    margin-inline-end: 4px;
    
    margin-inline-start: -12px;
}

#titleNavigation {
  align-items: center;
    display: flex;
    flex-direction: row;
}

cr-toggle {
  margin-inline-end: 12px;
}

#collectionTitle {
  flex-grow: 1;
}

</style>
<cr-dialog id="dialog" on-cancel="onCancel_" show-on-attach="">
  <div slot="title">
    <div id="leftTitleSpacer"></div>
    <div id="title">
      <div id="titleText" hidden="[[showTitleNavigation_]]">
        自訂這個頁面
      </div>
      <div id="titleNavigation" hidden="[[!showTitleNavigation_]]">
        <cr-icon-button id="backButton" class="icon-arrow-back" on-click="onBackClick_" title="返回">
        </cr-icon-button>
        <div id="collectionTitle">[[selectedCollection_.label]]</div>
        <cr-toggle id="refreshToggle" checked="[[isRefreshToggleChecked_]]" on-change="onBackgroundDailyRefreshToggleChange_">
        </cr-toggle>
        每天重新整理
      </div>
    </div>
  </div>
  <div slot="body">
    <div id="topPageScrollBorder" scroll-border=""></div>
    <div id="bodyContainer">
      <div id="menuContainer">
        <div id="menu">
          <iron-selector id="menuSelector" selected-attribute="selected" attr-for-selected="page-name" selected="{{selectedPage_}}" on-keydown="onMenuItemKeyDown_">
            <div class="menu-item" page-name="backgrounds" tabindex="0">
              <div id="backgroundsIcon" class="menu-item-icon"></div>
              背景
            </div>
            <div class="menu-item" page-name="shortcuts" tabindex="0">
              <div id="shortcutsIcon" class="menu-item-icon"></div>
              快速鍵
            </div>
            <div class="menu-item" page-name="modules" tabindex="0" hidden$="[[!modulesEnabled_]]">
              <div id="modulesIcon" class="menu-item-icon"></div>
              卡片
            </div>
            <div class="menu-item" page-name="themes" tabindex="0">
              <div id="themesIcon" class="menu-item-icon"></div>
              顏色和主題
            </div>
          </iron-selector>
        </div>
      </div>
      <div id="pagesContainer">
        <div id="pages">
          <iron-pages selected="[[selectedPage_]]" attr-for-selected="page-name">
            <ntp-customize-backgrounds id="backgrounds" page-name="backgrounds" selected-collection="{{selectedCollection_}}" theme="[[theme]]" background-selection="{{backgroundSelection}}">
            </ntp-customize-backgrounds>
            <ntp-customize-shortcuts page-name="shortcuts">
            </ntp-customize-shortcuts>
            <ntp-customize-modules page-name="modules" hidden$="[[!modulesEnabled_]]">
            </ntp-customize-modules>
            <cr-customize-themes id="customizeThemes" page-name="themes">
            </cr-customize-themes>
          </iron-pages>
        </div>
      </div>
    </div>
    <div id="bottomPageScrollBorder" scroll-border=""></div>
  </div>
  <div slot="button-container">
    <cr-button class="cancel-button" on-click="onCancelClick_">
      取消
    </cr-button>
    <cr-button class="action-button" on-click="onDoneClick_">
      完成
    </cr-button>
  </div>
</cr-dialog>
<!--_html_template_end_-->` }
    static get properties() { return { backgroundSelection: { type: Object, notify: true }, theme: Object, selectedPage_: { type: String, value: "backgrounds", observer: "onSelectedPageChange_" }, selectedCollection_: Object, showTitleNavigation_: { type: Boolean, computed: "computeShowTitleNavigation_(selectedPage_, selectedCollection_)", value: false }, isRefreshToggleChecked_: { type: Boolean, computed: `computeIsRefreshToggleChecked_(theme, selectedCollection_,\n            backgroundSelection)` }, modulesEnabled_: { type: Boolean, value: () => loadTimeData.getBoolean("modulesEnabled") } } }
    constructor() {
        super();
        this.pageHandler_ = BrowserProxy.getInstance().handler;
        this.intersectionObservers_ = [];
        this.backgroundSelection = { type: BackgroundSelectionType.NO_SELECTION }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.intersectionObservers_.forEach((observer => { observer.disconnect() }));
        this.intersectionObservers_ = []
    }
    ready() {
        super.ready();
        this.intersectionObservers_ = [createScrollBorders(this.$.menu, this.$.topPageScrollBorder, this.$.bottomPageScrollBorder, "show-1"), createScrollBorders(this.$.pages, this.$.topPageScrollBorder, this.$.bottomPageScrollBorder, "show-2")];
        this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kOpenClicked)
    }
    onCancel_() {
        this.$.customizeThemes.revertThemeChanges();
        this.backgroundSelection = { type: BackgroundSelectionType.NO_SELECTION }
    }
    onCancelClick_() {
        this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kCancelClicked);
        this.$.dialog.cancel()
    }
    onDoneClick_() {
        this.$.customizeThemes.confirmThemeChanges();
        this.shadowRoot.querySelector("ntp-customize-shortcuts").apply();
        if (this.modulesEnabled_) { this.shadowRoot.querySelector("ntp-customize-modules").apply() }
        switch (this.backgroundSelection.type) {
            case BackgroundSelectionType.NO_BACKGROUND:
                this.pageHandler_.setNoBackgroundImage();
                break;
            case BackgroundSelectionType.IMAGE:
                const { attribution1: attribution1, attribution2: attribution2, attributionUrl: attributionUrl, imageUrl: imageUrl } = assert(this.backgroundSelection.image);
                this.pageHandler_.setBackgroundImage(attribution1, attribution2, attributionUrl, imageUrl);
                break;
            case BackgroundSelectionType.DAILY_REFRESH:
                this.pageHandler_.setDailyRefreshCollectionId(assert(this.backgroundSelection.dailyRefreshCollectionId))
        }
        this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kDoneClicked);
        this.$.dialog.close()
    }
    onMenuItemKeyDown_(e) {
        if (!["Enter", " "].includes(e.key)) { return }
        e.preventDefault();
        e.stopPropagation();
        this.selectedPage_ = e.target.getAttribute("page-name")
    }
    onSelectedPageChange_() { this.$.pages.scrollTop = 0 }
    computeIsRefreshToggleChecked_() {
        if (!this.selectedCollection_) { return false }
        switch (this.backgroundSelection.type) {
            case BackgroundSelectionType.NO_SELECTION:
                return !!this.theme && this.selectedCollection_.id === this.theme.dailyRefreshCollectionId;
            case BackgroundSelectionType.DAILY_REFRESH:
                return this.selectedCollection_.id === this.backgroundSelection.dailyRefreshCollectionId
        }
        return false
    }
    computeShowTitleNavigation_() { return this.selectedPage_ === "backgrounds" && !!this.selectedCollection_ }
    onBackClick_() {
        this.selectedCollection_ = null;
        this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kBackgroundsBackClicked)
    }
    onBackgroundDailyRefreshToggleChange_() {
        if (this.$.refreshToggle.checked) { this.backgroundSelection = { type: BackgroundSelectionType.DAILY_REFRESH, dailyRefreshCollectionId: this.selectedCollection_.id } } else { this.backgroundSelection = { type: BackgroundSelectionType.NO_BACKGROUND } }
        this.pageHandler_.onCustomizeDialogAction(newTabPage.mojom.CustomizeDialogAction.kBackgroundsRefreshToggleClicked)
    }
}
customElements.define(CustomizeDialogElement.is, CustomizeDialogElement); // Copyright 2020 The Chromium Authors. All rights reserved.
class MiddleSlotPromoElement extends PolymerElement {
    static get is() { return "ntp-middle-slot-promo" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style scope="ntp-middle-slot-promo">:host {
  font-size: 12px;
    white-space: pre;
}

:host([modules-enabled_]):host {
  font-size: 13px;
}

:host(:not([modules-enabled_])):host {
  max-width: 537px;
}

#container {
  align-items: center;
    background-color: var(--ntp-background-override-color);
    border: solid var(--ntp-border-color) 1px;
    border-radius: 24px;
    box-sizing: border-box;
    color: var(--cr-primary-text-color);
    display: flex;
    flex-direction: row;
    height: 30px;
    justify-content: center;
    padding-inline-end: 8px;
    padding-inline-start: 8px;
}

:host([modules-enabled_]) #container {
  border-radius: 5px;
    height: 48px;
}

a {
  color: var(--cr-link-color);
    cursor: pointer;
    text-decoration: none;
}

a:focus {
  border-radius: 2px;
    box-shadow: var(--ntp-focus-shadow);
    outline: none;
}

* + .image {
  margin-inline-start: 8px;
}

.image + * {
  margin-inline-start: 8px;
}

img {
  border-radius: 50%;
    height: 24px;
    pointer-events: none;
    width: 24px;
}

:host([modules-enabled_]) img {
  background-color: var(--google-grey-refresh-100);
    height: 22px;
    padding: 5px;
    width: 22px;
}

@media (prefers-color-scheme: dark) {
img {
  background-color: var(--google-grey-200);
}

}

#container > :last-child {
  overflow: hidden;
    text-overflow: ellipsis;
}

</style>
<!-- Promo parts are added by JS. -->
<div id="container"></div>
<!--_html_template_end_-->` }
    static get properties() { return { hidden: { type: Boolean, value: true, reflectToAttribute: true }, modulesEnabled_: { type: Boolean, value: () => loadTimeData.getBoolean("modulesEnabled"), reflectToAttribute: true }, commandIds_: { type: Object, value: () => [] } } }
    constructor() {
        super();
        this.pageHandler_ = BrowserProxy.getInstance().handler
    }
    connectedCallback() {
        super.connectedCallback();
        this.pageHandler_.getPromo().then((({ promo: promo }) => {
            if (promo) {
                promo.middleSlotParts.forEach((({ image: image, link: link, text: text }) => {
                    let el;
                    if (image) {
                        el = new ImgElement;
                        el.autoSrc = image.imageUrl.url;
                        if (image.target) {
                            const anchor = this.createAnchor_(image.target);
                            if (anchor) {
                                anchor.appendChild(el);
                                el = anchor
                            }
                        }
                        el.classList.add("image")
                    } else if (link) { el = this.createAnchor_(link.url) } else if (text) { el = document.createElement("span") }
                    const linkOrText = link || text;
                    if (el && linkOrText) { el.innerText = linkOrText.text; if (linkOrText.color) { el.style.color = linkOrText.color } }
                    if (el) { this.$.container.appendChild(el) }
                }));
                this.maybeShowPromo_().then((canShow => {
                    if (canShow) {
                        this.pageHandler_.onPromoRendered(BrowserProxy.getInstance().now(), promo.logUrl || null);
                        this.hidden = false
                    }
                    this.dispatchEvent(new Event("ntp-middle-slot-promo-loaded", { bubbles: true, composed: true }))
                }))
            } else { this.dispatchEvent(new Event("ntp-middle-slot-promo-loaded", { bubbles: true, composed: true })) }
        }))
    }
    createAnchor_(target) {
        const commandIdMatch = /^command:(\d+)$/.exec(target.url);
        if (!commandIdMatch && !target.url.startsWith("https://")) { return null }
        const el = document.createElement("a");
        let commandId = null;
        if (!commandIdMatch) { el.href = target.url } else {
            commandId = +commandIdMatch[1];
            if (!Object.values(promoBrowserCommand.mojom.Command).includes(commandId)) { commandId = promoBrowserCommand.mojom.Command.kUnknownCommand }
            this.commandIds_.push(commandId)
        }
        const onClick = event => {
            if (commandId !== null) { PromoBrowserCommandProxy.getInstance().handler.executeCommand(commandId, { middleButton: event.button === 1, altKey: event.altKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, shiftKey: event.shiftKey }) }
            this.pageHandler_.onPromoLinkClicked()
        };
        el.addEventListener("auxclick", onClick);
        el.addEventListener("click", onClick);
        return el
    }
    async maybeShowPromo_() { const { handler: handler } = PromoBrowserCommandProxy.getInstance(); const promises = this.commandIds_.map((commandId => handler.canShowPromoWithCommand(commandId))); return (await Promise.all(promises)).every((({ canShow: canShow }) => canShow)) }
}
customElements.define(MiddleSlotPromoElement.is, MiddleSlotPromoElement); // Copyright (c) 2012 The Chromium Authors. All rights reserved.
function getDeepActiveElement() { let a = document.activeElement; while (a && a.shadowRoot && a.shadowRoot.activeElement) { a = a.shadowRoot.activeElement } return a }

function isRTL() { return document.documentElement.dir === "rtl" }

function hasKeyModifiers(e) { return !!(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) } // Copyright 2014 The Chromium Authors. All rights reserved.
class FocusRow {
    constructor(root, boundary, delegate) {
        this.root = root;
        this.boundary_ = boundary || document.documentElement;
        this.delegate = delegate;
        this.eventTracker = new EventTracker
    }
    static isFocusable(element) {
        if (!element || element.disabled) { return false }
        let current = element;
        while (true) {
            assertInstanceof(current, Element);
            const style = window.getComputedStyle(current);
            if (style.visibility === "hidden" || style.display === "none") { return false }
            const parent = current.parentNode;
            if (!parent) { return false }
            if (parent === current.ownerDocument || parent instanceof DocumentFragment) { return true }
            current = parent
        }
    }
    static getFocusableElement(element) { if (element.getFocusableElement) { return element.getFocusableElement() } return element }
    addItem(type, selectorOrElement) {
        assert(type);
        let element;
        if (typeof selectorOrElement === "string") { element = this.root.querySelector(selectorOrElement) } else { element = selectorOrElement }
        if (!element) { return false }
        element.setAttribute("focus-type", type);
        element.tabIndex = this.isActive() ? 0 : -1;
        this.eventTracker.add(element, "blur", this.onBlur_.bind(this));
        this.eventTracker.add(element, "focus", this.onFocus_.bind(this));
        this.eventTracker.add(element, "keydown", this.onKeydown_.bind(this));
        this.eventTracker.add(element, "mousedown", this.onMousedown_.bind(this));
        return true
    }
    destroy() { this.eventTracker.removeAll() }
    getCustomEquivalent(sampleElement) { return assert(this.getFirstFocusable()) }
    getElements() { return Array.from(this.root.querySelectorAll("[focus-type]")).map(FocusRow.getFocusableElement) }
    getEquivalentElement(sampleElement) { if (this.getFocusableElements().indexOf(sampleElement) >= 0) { return sampleElement } const sampleFocusType = this.getTypeForElement(sampleElement); if (sampleFocusType) { const sameType = this.getFirstFocusable(sampleFocusType); if (sameType) { return sameType } } return this.getCustomEquivalent(sampleElement) }
    getFirstFocusable(opt_type) { const element = this.getFocusableElements().find((el => !opt_type || el.getAttribute("focus-type") === opt_type)); return element || null }
    getFocusableElements() { return this.getElements().filter(FocusRow.isFocusable) }
    getTypeForElement(element) { return element.getAttribute("focus-type") || "" }
    isActive() { return this.root.classList.contains(FocusRow.ACTIVE_CLASS) }
    makeActive(active) {
        if (active === this.isActive()) { return }
        this.getElements().forEach((function(element) { element.tabIndex = active ? 0 : -1 }));
        this.root.classList.toggle(FocusRow.ACTIVE_CLASS, active)
    }
    onBlur_(e) { if (!this.boundary_.contains(e.relatedTarget)) { return } const currentTarget = e.currentTarget; if (this.getFocusableElements().indexOf(currentTarget) >= 0) { this.makeActive(false) } }
    onFocus_(e) { if (this.delegate) { this.delegate.onFocus(this, e) } }
    onMousedown_(e) { if (e.button) { return } if (!e.currentTarget.disabled) { e.currentTarget.tabIndex = 0 } }
    onKeydown_(e) {
        const elements = this.getFocusableElements();
        const currentElement = FocusRow.getFocusableElement(e.currentTarget);
        const elementIndex = elements.indexOf(currentElement);
        assert(elementIndex >= 0);
        if (this.delegate && this.delegate.onKeydown(this, e)) { return }
        const isShiftTab = !e.altKey && !e.ctrlKey && !e.metaKey && e.shiftKey && e.key === "Tab";
        if (hasKeyModifiers(e) && !isShiftTab) { return }
        let index = -1;
        let shouldStopPropagation = true;
        if (isShiftTab) { index = elementIndex - 1; if (index < 0) { return } } else if (e.key === "ArrowLeft") { index = elementIndex + (isRTL() ? 1 : -1) } else if (e.key === "ArrowRight") { index = elementIndex + (isRTL() ? -1 : 1) } else if (e.key === "Home") { index = 0 } else if (e.key === "End") { index = elements.length - 1 } else { shouldStopPropagation = false }
        const elementToFocus = elements[index];
        if (elementToFocus) {
            this.getEquivalentElement(elementToFocus).focus();
            e.preventDefault()
        }
        if (shouldStopPropagation) { e.stopPropagation() }
    }
}
FocusRow.ACTIVE_CLASS = "focus-row-active"; // Copyright 2017 The Chromium Authors. All rights reserved.
let hideInk = false;
assert(!isIOS, "pointerdown doesn't work on iOS");
document.addEventListener("pointerdown", (function() { hideInk = true }), true);
document.addEventListener("keydown", (function() { hideInk = false }), true);
const focusWithoutInk = function(toFocus) {
    if (!("noink" in toFocus) || !hideInk) { toFocus.focus(); return }
    assert(document === toFocus.ownerDocument);
    const { noink: noink } = toFocus;
    toFocus.noink = true;
    toFocus.focus();
    toFocus.noink = noink
}; // Copyright 2016 The Chromium Authors. All rights reserved.
const AnchorAlignment = { BEFORE_START: -2, AFTER_START: -1, CENTER: 0, BEFORE_END: 1, AFTER_END: 2 };
const DROPDOWN_ITEM_CLASS = "dropdown-item";
const AFTER_END_OFFSET = 10;

function getStartPointWithAnchor(start, end, menuLength, anchorAlignment, min, max) {
    let startPoint = 0;
    switch (anchorAlignment) {
        case AnchorAlignment.BEFORE_START:
            startPoint = -menuLength;
            break;
        case AnchorAlignment.AFTER_START:
            startPoint = start;
            break;
        case AnchorAlignment.CENTER:
            startPoint = (start + end - menuLength) / 2;
            break;
        case AnchorAlignment.BEFORE_END:
            startPoint = end - menuLength;
            break;
        case AnchorAlignment.AFTER_END:
            startPoint = end;
            break
    }
    if (startPoint + menuLength > max) { startPoint = end - menuLength }
    if (startPoint < min) { startPoint = start }
    startPoint = Math.max(min, Math.min(startPoint, max - menuLength));
    return startPoint
}

function getDefaultShowConfig() { return { top: 0, left: 0, height: 0, width: 0, anchorAlignmentX: AnchorAlignment.AFTER_START, anchorAlignmentY: AnchorAlignment.AFTER_START, minX: 0, minY: 0, maxX: 0, maxY: 0 } }
Polymer({
    _template: html `<!--css-build:shadow--><!--_html_template_start_--><style scope="cr-action-menu">:host dialog {
  background-color: var(--cr-menu-background-color);
        border: none;
        border-radius: 4px;
        box-shadow: var(--cr-menu-shadow);
        margin: 0;
        min-width: 128px;
        outline: none;
        padding: 0;
        position: absolute;
}

:host dialog::backdrop {
  background-color: transparent;
}

:host ::slotted(.dropdown-item) {
  -webkit-tap-highlight-color: transparent;
        background: none;
        border: none;
        border-radius: 0;
        box-sizing: border-box;
        color: var(--cr-primary-text-color);
        font: inherit;
        min-height: 32px;
        padding: 0 24px;
        text-align: start;
        user-select: none;
        width: 100%;
}

:host ::slotted(.dropdown-item:not([hidden])) {
  align-items: center;
        display: flex;
}

:host ::slotted(.dropdown-item[disabled]) {
  opacity: var(--cr-action-menu-disabled-item-opacity, 0.65);
}

:host ::slotted(.dropdown-item:not([disabled])) {
  cursor: pointer;
}

:host ::slotted(.dropdown-item:focus) {
  background-color: var(--cr-menu-background-focus-color);
        outline: none;
}

.item-wrapper {
  background: var(--cr-menu-background-sheen);
        outline: none;
        padding: 8px 0;
}

</style>
    <dialog id="dialog" part="dialog" on-close="onNativeDialogClose_" role="application" aria-roledescription$="[[roleDescription]]">
      <div id="wrapper" class="item-wrapper" role="menu" tabindex="-1">
        <slot id="contentNode"></slot>
      </div>
    </dialog>
<!--_html_template_end_-->`,
    is: "cr-action-menu",
    anchorElement_: null,
    boundClose_: null,
    hasMousemoveListener_: false,
    contentObserver_: null,
    resizeObserver_: null,
    lastConfig_: null,
    properties: { autoReposition: { type: Boolean, value: false }, open: { type: Boolean, notify: true, value: false }, roleDescription: String },
    listeners: { keydown: "onKeyDown_", mouseover: "onMouseover_", click: "onClick_" },
    detached() { this.removeListeners_() },
    getDialog() { return this.$.dialog },
    removeListeners_() {
        window.removeEventListener("resize", this.boundClose_);
        window.removeEventListener("popstate", this.boundClose_);
        if (this.contentObserver_) {
            dom(this.$.contentNode).unobserveNodes(this.contentObserver_);
            this.contentObserver_ = null
        }
        if (this.resizeObserver_) {
            this.resizeObserver_.disconnect();
            this.resizeObserver_ = null
        }
    },
    onNativeDialogClose_(e) {
        if (e.target !== this.$.dialog) { return }
        e.stopPropagation();
        this.fire("close")
    },
    onClick_(e) {
        if (e.target === this) {
            this.close();
            e.stopPropagation()
        }
    },
    onKeyDown_(e) {
        e.stopPropagation();
        if (e.key === "Tab" || e.key === "Escape") {
            this.close();
            if (e.key === "Tab") { this.fire("tabkeyclose", { shiftKey: e.shiftKey }) }
            e.preventDefault();
            return
        }
        if (e.key !== "Enter" && e.key !== "ArrowUp" && e.key !== "ArrowDown") { return }
        const query = ".dropdown-item:not([disabled]):not([hidden])";
        const options = Array.from(this.querySelectorAll(query));
        if (options.length === 0) { return }
        const focused = getDeepActiveElement();
        const index = options.findIndex((option => FocusRow.getFocusableElement(option) === focused));
        if (e.key === "Enter") {
            if (index !== -1) { return }
            if (isWindows || isMac) {
                this.close();
                e.preventDefault();
                return
            }
        }
        e.preventDefault();
        this.updateFocus_(options, index, e.key !== "ArrowUp");
        if (!this.hasMousemoveListener_) {
            this.hasMousemoveListener_ = true;
            this.addEventListener("mousemove", (e => {
                this.onMouseover_(e);
                this.hasMousemoveListener_ = false
            }), { once: true })
        }
    },
    onMouseover_(e) {
        const query = ".dropdown-item:not([disabled])";
        const item = e.composedPath().find((el => el.matches && el.matches(query)));
        (item || this.$.wrapper).focus()
    },
    updateFocus_(options, focusedIndex, next) {
        const numOptions = options.length;
        assert(numOptions > 0);
        let index;
        if (focusedIndex === -1) { index = next ? 0 : numOptions - 1 } else {
            const delta = next ? 1 : -1;
            index = (numOptions + focusedIndex + delta) % numOptions
        }
        options[index].focus()
    },
    close() {
        this.removeListeners_();
        this.$.dialog.close();
        this.open = false;
        if (this.anchorElement_) {
            focusWithoutInk(assert(this.anchorElement_));
            this.anchorElement_ = null
        }
        if (this.lastConfig_) { this.lastConfig_ = null }
    },
    showAt(anchorElement, opt_config) {
        this.anchorElement_ = anchorElement;
        this.anchorElement_.scrollIntoViewIfNeeded();
        const rect = this.anchorElement_.getBoundingClientRect();
        let height = rect.height;
        if (opt_config && !opt_config.noOffset && opt_config.anchorAlignmentY === AnchorAlignment.AFTER_END) { height -= AFTER_END_OFFSET }
        this.showAtPosition(Object.assign({ top: rect.top, left: rect.left, height: height, width: rect.width, anchorAlignmentX: AnchorAlignment.BEFORE_END }, opt_config));
        this.$.wrapper.focus()
    },
    showAtPosition(config) {
        const doc = document.scrollingElement;
        const scrollLeft = doc.scrollLeft;
        const scrollTop = doc.scrollTop;
        this.resetStyle_();
        this.$.dialog.showModal();
        this.open = true;
        config.top += scrollTop;
        config.left += scrollLeft;
        this.positionDialog_(Object.assign({ minX: scrollLeft, minY: scrollTop, maxX: scrollLeft + doc.clientWidth, maxY: scrollTop + doc.clientHeight }, config));
        doc.scrollTop = scrollTop;
        doc.scrollLeft = scrollLeft;
        this.addListeners_()
    },
    resetStyle_() {
        this.$.dialog.style.left = "";
        this.$.dialog.style.right = "";
        this.$.dialog.style.top = "0"
    },
    positionDialog_(config) {
        this.lastConfig_ = config;
        const c = Object.assign(getDefaultShowConfig(), config);
        const top = c.top;
        const left = c.left;
        const bottom = top + c.height;
        const right = left + c.width;
        const rtl = getComputedStyle(this).direction === "rtl";
        if (rtl) { c.anchorAlignmentX *= -1 }
        const offsetWidth = this.$.dialog.offsetWidth;
        const menuLeft = getStartPointWithAnchor(left, right, offsetWidth, c.anchorAlignmentX, c.minX, c.maxX);
        if (rtl) {
            const menuRight = document.scrollingElement.clientWidth - menuLeft - offsetWidth;
            this.$.dialog.style.right = menuRight + "px"
        } else { this.$.dialog.style.left = menuLeft + "px" }
        const menuTop = getStartPointWithAnchor(top, bottom, this.$.dialog.offsetHeight, c.anchorAlignmentY, c.minY, c.maxY);
        this.$.dialog.style.top = menuTop + "px"
    },
    addListeners_() {
        this.boundClose_ = this.boundClose_ || function() { if (this.$.dialog.open) { this.close() } }.bind(this);
        window.addEventListener("resize", this.boundClose_);
        window.addEventListener("popstate", this.boundClose_);
        this.contentObserver_ = dom(this.$.contentNode).observeNodes((info => { info.addedNodes.forEach((node => { if (node.classList && node.classList.contains(DROPDOWN_ITEM_CLASS) && !node.getAttribute("role")) { node.setAttribute("role", "menuitem") } })) }));
        if (this.autoReposition) {
            this.resizeObserver_ = new ResizeObserver((() => {
                if (this.lastConfig_) {
                    this.positionDialog_(this.lastConfig_);
                    this.fire("cr-action-menu-repositioned")
                }
            }));
            this.resizeObserver_.observe(this.$.dialog)
        }
    }
}); // Copyright 2019 The Chromium Authors. All rights reserved.
const ScreenWidth = { NARROW: 0, MEDIUM: 1, WIDE: 2 };

function resetTilePosition(tile) {
    tile.style.position = "";
    tile.style.left = "";
    tile.style.top = ""
}

function setTilePosition(tile, { x: x, y: y }) {
    tile.style.position = "fixed";
    tile.style.left = `${x}px`;
    tile.style.top = `${y}px`
}

function getHitIndex(rects, x, y) { return rects.findIndex((r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)) }
class MostVisitedElement extends PolymerElement {
    static get is() { return "ntp-most-visited" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style include="cr-hidden-style cr-icons" scope="ntp-most-visited">:host {
  --icon-button-color-active: var(--google-grey-refresh-700);
    --icon-button-color: var(--google-grey-600);
    --icon-size: 48px;
    --tile-hover-color: rgba(var(--google-grey-900-rgb), .1);
    --tile-size: 112px;  
    --title-height: 32px;
}

#container {
  --content-width: calc(var(--column-count) * var(--tile-size)
      
      + 1px);
    display: flex;
    flex-wrap: wrap;
    height: calc(var(--row-count) * 128px);
    justify-content: center;
    opacity: 0;
    overflow: hidden;
    transition: opacity 300ms ease-in-out;
    width: calc(var(--content-width) + 12px);
}

:host([visible_]) #container {
  opacity: 1;
}

#addShortcutIcon, .query-tile-icon {
  -webkit-mask-image: url(chrome://resources/images/add.svg);
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100%;
    background-color: var(--google-grey-900);
    height: 24px;
    width: 24px;
}

.query-tile-icon {
  -webkit-mask-image: url(chrome://resources/images/icon_search.svg);
    background-color: var(--google-grey-700);
}

:host([use-white-add-icon]) #addShortcutIcon {
  background-color: white;
}

:host([use-white-add-icon]) .query-tile-icon {
  background-color: var(--google-grey-400);
}

.tile, #addShortcut {
  -webkit-tap-highlight-color: transparent;
    align-items: center;
    border-radius: 4px;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    height: var(--tile-size);
    margin-bottom: 13px;
    margin-top: 3px;
    opacity: 1;
    outline: none;
    padding-bottom: 4px;
    padding-top: 12px;
    position: relative;
    text-decoration: none;
    transition-duration: 300ms;
    transition-property: left, top;
    transition-timing-function: ease-in-out;
    user-select: none;
    width: var(--tile-size);
}

:host-context(.focus-outline-visible) .tile:focus, :host-context(.focus-outline-visible) #addShortcut:focus {
  box-shadow: var(--ntp-focus-shadow);
}

#addShortcut {
  background-color: transparent;
    border: none;
    box-shadow: none;
}

:host(:not([reordering_])) .tile:hover, :host(:not([reordering_])) #addShortcut:hover, .force-hover {
  background-color: var(--tile-hover-color);
}

.tile-icon {
  align-items: center;
    background-color: var(--ntp-theme-shortcut-background-color);
    border-radius: 50%;
    display: flex;
    height: var(--icon-size);
    justify-content: center;
    width: var(--icon-size);
}

.tile-icon img {
  height: 24px;
    width: 24px;
}

.tile-title {
  align-items: center;
    border-radius: 12px;
    color: var(--ntp-theme-text-color);
    display: flex;
    height: var(--title-height);
    line-height: calc(var(--title-height) / 2);
    margin-top: 12px;
    padding: 2px 8px;
    width: 88px;
}

:host([use-title-pill]) .tile-title {
  background-color: white;
    color: var(--google-grey-800);
}

.tile-title span {
  font-weight: 400;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    text-shadow: var(--ntp-theme-text-shadow);
    white-space: nowrap;
    width: 100%;
}

.tile[query-tile] .tile-title span {
  -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    white-space: initial;
}

:host([use-title-pill]) .tile-title span {
  text-shadow: none;
}

.title-rtl {
  direction: rtl;
}

.title-ltr {
  direction: ltr;
}

.tile.dragging {
  background-color: var(--tile-hover-color);
    transition-property: none;
    z-index: 1;
}

cr-icon-button {
  --cr-icon-button-fill-color: var(--icon-button-color);
    --cr-icon-button-size: 28px;
    --cr-icon-button-transition: none;
    margin: 4px 2px;
    opacity: 0;
    position: absolute;
    right: 0;
    top: 0;
    transition: opacity 100ms ease-in-out;
}

:host-context([dir=rtl]) cr-icon-button {
  left: 0;
    right: unset;
}

:host(:not([reordering_])) .tile:hover cr-icon-button, .force-hover cr-icon-button {
  opacity: 1;
    transition-delay: 400ms;
}

:host(:not([reordering_])) cr-icon-button:active, :host-context(.focus-outline-visible):host(:not([reordering_])) cr-icon-button:focus, :host(:not([reordering_])) cr-icon-button:hover {
  --cr-icon-button-fill-color: var(--icon-button-color-active);
    opacity: 1;
    transition-delay: 0s;
}

</style>
<div id="container" hidden$="[[!visible_]]" style="--column-count: [[columnCount_]]; --row-count: [[rowCount_]];">
  <dom-repeat id="tiles" items="[[tiles_]]" on-dom-change="onTilesRendered_">
    <template>
      <a class="tile" draggable$="[[booleanToString_(customLinksEnabled_)]]" href$="[[item.url.url]]" title$="[[item.title]]" on-dragstart="onDragStart_" on-touchstart="onTouchStart_" hidden$="[[isHidden_(index, maxVisibleTiles_)]]" on-click="onTileClick_" on-keydown="onTileKeyDown_" query-tile$="[[item.isQueryTile]]">
        <cr-icon-button id="actionMenuButton" class="icon-more-vert" title="更多動作" on-click="onTileActionButtonClick_" tabindex="0" hidden$="[[!customLinksEnabled_]]"></cr-icon-button>
        <cr-icon-button id="removeButton" class="icon-clear" title="移除" on-click="onTileRemoveButtonClick_" tabindex="0" hidden$="[[customLinksEnabled_]]"></cr-icon-button>
        <div class="tile-icon">
          <img src$="[[getFaviconUrl_(item.url)]]" draggable="false" hidden$="[[item.isQueryTile]]">
          <div class="query-tile-icon" draggable="false" hidden$="[[!item.isQueryTile]]"></div>
        </div>
        <div class$="tile-title [[getTileTitleDirectionClass_(item)]]">
          <span>[[item.title]]</span>
        </div>
      </a>
    </template>
  </dom-repeat>
  <cr-button id="addShortcut" tabindex="0" on-click="onAdd_" hidden$="[[!showAdd_]]" on-keydown="onAddShortcutKeyDown_" noink="">
    <div class="tile-icon">
      <div id="addShortcutIcon" draggable="false"></div>
    </div>
    <div class="tile-title">
      <span>新增捷徑</span>
    </div>
  </cr-button>
  <cr-dialog id="dialog" on-close="onDialogClose_">
    <div slot="title">[[dialogTitle_]]</div>
    <div slot="body">
      <cr-input id="dialogInputName" label="名稱" value="{{dialogTileTitle_}}" spellcheck="false" autofocus=""></cr-input>
      <cr-input id="dialogInputUrl" label="網址" value="{{dialogTileUrl_}}" invalid="[[dialogTileUrlInvalid_]]" error-message="請輸入有效的網址" spellcheck="false" type="url">
      </cr-input>
    </div>
    <div slot="button-container">
      <cr-button class="cancel-button" on-click="onDialogCancel_">
        取消
      </cr-button>
      <cr-button class="action-button" on-click="onSave_" disabled$="[[!dialogTileUrl_]]">
        完成
      </cr-button>
    </div>
  </cr-dialog>
  <cr-action-menu id="actionMenu">
    <button id="actionMenuEdit" class="dropdown-item" on-click="onEdit_">
      編輯捷徑
    </button>
    <button id="actionMenuRemove" class="dropdown-item" on-click="onRemove_">
      移除
    </button>
  </cr-action-menu>
</div>
<cr-toast id="toast" duration="10000">
  <div>[[toastContent_]]</div>
  <dom-if if="[[showToastButtons_]]">
    <template>
      <cr-button id="undo" aria-label="按下 Ctrl + Z 即可復原" on-click="onUndoClick_">
        復原
      </cr-button>
      <cr-button id="restore" aria-label$="[[getRestoreButtonText_(customLinksEnabled_)]]" on-click="onRestoreDefaultsClick_">
        [[getRestoreButtonText_(customLinksEnabled_)]]
      </cr-button>
    </template>
  </dom-if>
</cr-toast>
<!--_html_template_end_-->` }
    static get properties() { return { useWhiteAddIcon: { type: Boolean, reflectToAttribute: true }, useTitlePill: { type: Boolean, reflectToAttribute: true }, columnCount_: { type: Number, computed: `computeColumnCount_(tiles_, screenWidth_, maxTiles_)` }, rowCount_: { type: Number, computed: "computeRowCount_(columnCount_, tiles_)" }, customLinksEnabled_: Boolean, dialogTileTitle_: String, dialogTileUrl_: { type: String, observer: "onDialogTileUrlChange_" }, dialogTileUrlInvalid_: { type: Boolean, value: false }, dialogTitle_: String, reordering_: { type: Boolean, value: false, reflectToAttribute: true }, maxTiles_: { type: Number, computed: "computeMaxTiles_(customLinksEnabled_)" }, maxVisibleTiles_: { type: Number, computed: "computeMaxVisibleTiles_(columnCount_, rowCount_)" }, showAdd_: { type: Boolean, value: false, computed: "computeShowAdd_(tiles_, maxVisibleTiles_, customLinksEnabled_)" }, showToastButtons_: Boolean, screenWidth_: Number, tiles_: Array, toastContent_: String, visible_: { type: Boolean, reflectToAttribute: true } } }
    get tileElements_() { return Array.from(this.shadowRoot.querySelectorAll(".tile:not([hidden])")) }
    constructor() {
        performance.mark("most-visited-creation-start");
        super();
        this.adding_ = false;
        const { callbackRouter: callbackRouter, handler: handler } = BrowserProxy.getInstance();
        this.callbackRouter_ = callbackRouter;
        this.pageHandler_ = handler;
        this.setMostVisitedInfoListenerId_ = null;
        this.actionMenuTargetIndex_ = -1;
        this.dragOffset_ = null;
        this.tileRects_ = []
    }
    connectedCallback() {
        super.connectedCallback();
        this.isRtl_ = window.getComputedStyle(this)["direction"] === "rtl";
        this.eventTracker_ = new EventTracker;
        this.setMostVisitedInfoListenerId_ = this.callbackRouter_.setMostVisitedInfo.addListener((info => {
            performance.measure("most-visited-mojo", "most-visited-mojo-start");
            this.visible_ = info.visible;
            this.customLinksEnabled_ = info.customLinksEnabled;
            this.tiles_ = info.tiles.slice(0, assert(this.maxTiles_))
        }));
        performance.mark("most-visited-mojo-start");
        this.eventTracker_.add(document, "visibilitychange", (() => { if (document.visibilityState === "visible") { this.pageHandler_.updateMostVisitedInfo() } }));
        this.pageHandler_.updateMostVisitedInfo();
        FocusOutlineManager.forDocument(document)
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.callbackRouter_.removeListener(assert(this.setMostVisitedInfoListenerId_));
        this.mediaListenerWideWidth_.removeListener(assert(this.boundOnWidthChange_));
        this.mediaListenerMediumWidth_.removeListener(assert(this.boundOnWidthChange_));
        this.ownerDocument.removeEventListener("keydown", this.boundOnDocumentKeyDown_);
        this.eventTracker_.removeAll()
    }
    ready() {
        super.ready();
        this.boundOnWidthChange_ = this.updateScreenWidth_.bind(this);
        const { matchMedia: matchMedia } = BrowserProxy.getInstance();
        this.mediaListenerWideWidth_ = matchMedia("(min-width: 672px)");
        this.mediaListenerWideWidth_.addListener(this.boundOnWidthChange_);
        this.mediaListenerMediumWidth_ = matchMedia("(min-width: 560px)");
        this.mediaListenerMediumWidth_.addListener(this.boundOnWidthChange_);
        this.updateScreenWidth_();
        this.boundOnDocumentKeyDown_ = e => this.onDocumentKeyDown_(e);
        this.ownerDocument.addEventListener("keydown", this.boundOnDocumentKeyDown_);
        performance.measure("most-visited-creation", "most-visited-creation-start")
    }
    clearForceHover_() { const forceHover = this.shadowRoot.querySelector(".force-hover"); if (forceHover) { forceHover.classList.remove("force-hover") } }
    computeColumnCount_() { let maxColumns = 3; if (this.screenWidth_ === ScreenWidth.WIDE) { maxColumns = 5 } else if (this.screenWidth_ === ScreenWidth.MEDIUM) { maxColumns = 4 } const shortcutCount = this.tiles_ ? this.tiles_.length : 0; const canShowAdd = this.maxTiles_ > shortcutCount; const tileCount = Math.min(this.maxTiles_, shortcutCount + (canShowAdd ? 1 : 0)); const columnCount = tileCount <= maxColumns ? tileCount : Math.min(maxColumns, Math.ceil(tileCount / 2)); return columnCount || 3 }
    computeRowCount_() { if (this.columnCount_ === 0) { return 0 } const shortcutCount = this.tiles_ ? this.tiles_.length : 0; return this.columnCount_ <= shortcutCount ? 2 : 1 }
    computeMaxTiles_() { return this.customLinksEnabled_ ? 10 : 8 }
    computeMaxVisibleTiles_() { return this.columnCount_ * this.rowCount_ }
    computeShowAdd_() { return this.customLinksEnabled_ && this.tiles_ && this.tiles_.length < this.maxVisibleTiles_ }
    dragEnd_(x, y) {
        if (!this.customLinksEnabled_) { this.reordering_ = false; return }
        this.dragOffset_ = null;
        const dragElement = this.shadowRoot.querySelector(".tile.dragging");
        if (!dragElement) { this.reordering_ = false; return }
        const dragIndex = this.$.tiles.modelForElement(dragElement).index;
        dragElement.classList.remove("dragging");
        this.tileElements_.forEach(resetTilePosition);
        resetTilePosition(this.$.addShortcut);
        const dropIndex = getHitIndex(this.tileRects_, x, y);
        if (dragIndex !== dropIndex && dropIndex > -1) {
            const [draggingTile] = this.tiles_.splice(dragIndex, 1);
            this.tiles_.splice(dropIndex, 0, draggingTile);
            this.notifySplices("tiles_", [{ index: dragIndex, removed: [draggingTile], addedCount: 0, object: this.tiles_, type: "splice" }, { index: dropIndex, removed: [], addedCount: 1, object: this.tiles_, type: "splice" }]);
            this.pageHandler_.reorderMostVisitedTile(draggingTile.url, dropIndex)
        }
    }
    dragOver_(x, y) {
        const dragElement = this.shadowRoot.querySelector(".tile.dragging");
        if (!dragElement) { this.reordering_ = false; return }
        const dragIndex = this.$.tiles.modelForElement(dragElement).index;
        setTilePosition(dragElement, { x: x - this.dragOffset_.x, y: y - this.dragOffset_.y });
        const dropIndex = getHitIndex(this.tileRects_, x, y);
        this.tileElements_.forEach(((element, i) => {
            let positionIndex;
            if (i === dragIndex) { return } else if (dropIndex === -1) { positionIndex = i } else if (dragIndex < dropIndex && dragIndex <= i && i <= dropIndex) { positionIndex = i - 1 } else if (dragIndex > dropIndex && dragIndex >= i && i >= dropIndex) { positionIndex = i + 1 } else { positionIndex = i }
            setTilePosition(element, this.tileRects_[positionIndex])
        }))
    }
    dragStart_(dragElement, x, y) {
        this.clearForceHover_();
        dragElement.classList.add("dragging");
        const dragElementRect = dragElement.getBoundingClientRect();
        this.dragOffset_ = { x: x - dragElementRect.x, y: y - dragElementRect.y };
        const tileElements = this.tileElements_;
        this.tileRects_ = tileElements.map((t => t.getBoundingClientRect()));
        if (this.showAdd_) {
            const element = this.$.addShortcut;
            setTilePosition(element, element.getBoundingClientRect())
        }
        tileElements.forEach(((tile, i) => { setTilePosition(tile, this.tileRects_[i]) }));
        this.reordering_ = true
    }
    getFaviconUrl_(url) {
        const faviconUrl = new URL("chrome://favicon2/");
        faviconUrl.searchParams.set("size", "24");
        faviconUrl.searchParams.set("scale_factor", "1x");
        faviconUrl.searchParams.set("show_fallback_monogram", "");
        faviconUrl.searchParams.set("page_url", url.url);
        return faviconUrl.href
    }
    getRestoreButtonText_() { return loadTimeData.getString(this.customLinksEnabled_ ? "restoreDefaultLinks" : "restoreThumbnailsShort") }
    getTileTitleDirectionClass_(tile) { return tile.titleDirection === mojoBase.mojom.TextDirection.RIGHT_TO_LEFT ? "title-rtl" : "title-ltr" }
    isHidden_(index) { return index >= this.maxVisibleTiles_ }
    onAdd_() {
        this.dialogTitle_ = loadTimeData.getString("addLinkTitle");
        this.dialogTileTitle_ = "";
        this.dialogTileUrl_ = "";
        this.dialogTileUrlInvalid_ = false;
        this.adding_ = true;
        this.$.dialog.showModal()
    }
    onAddShortcutKeyDown_(e) { if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) { return } if (!this.tiles_ || this.tiles_.length === 0) { return } const backKey = this.isRtl_ ? "ArrowRight" : "ArrowLeft"; if (e.key === backKey || e.key === "ArrowUp") { this.tileFocus_(this.tiles_.length - 1) } }
    onDialogCancel_() {
        this.actionMenuTargetIndex_ = -1;
        this.$.dialog.cancel()
    }
    onDialogClose_() {
        if (this.adding_) { this.$.addShortcut.focus() }
        this.adding_ = false
    }
    onDialogTileUrlChange_() { this.dialogTileUrlInvalid_ = false }
    onDocumentKeyDown_(e) {
        if (e.altKey || e.shiftKey) { return }
        const modifier = isMac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
        if (modifier && e.key === "z") {
            e.preventDefault();
            this.onUndoClick_()
        }
    }
    onDragStart_(e) {
        if (e.dataTransfer) { e.dataTransfer.setDragImage(new Image, 0, 0) }
        this.dragStart_(e.target, e.x, e.y);
        const dragOver = e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            this.dragOver_(e.x, e.y)
        };
        this.ownerDocument.addEventListener("dragover", dragOver);
        this.ownerDocument.addEventListener("dragend", (e => {
            this.ownerDocument.removeEventListener("dragover", dragOver);
            this.dragEnd_(e.x, e.y);
            const dropIndex = getHitIndex(this.tileRects_, e.x, e.y);
            if (dropIndex !== -1) { this.tileElements_[dropIndex].classList.add("force-hover") }
            this.addEventListener("pointermove", (() => {
                this.clearForceHover_();
                this.reordering_ = false
            }), { once: true })
        }), { once: true })
    }
    onEdit_() {
        this.$.actionMenu.close();
        this.dialogTitle_ = loadTimeData.getString("editLinkTitle");
        const tile = this.tiles_[this.actionMenuTargetIndex_];
        this.dialogTileTitle_ = tile.title;
        this.dialogTileUrl_ = tile.url.url;
        this.dialogTileUrlInvalid_ = false;
        this.$.dialog.showModal()
    }
    onRestoreDefaultsClick_() {
        if (!this.$.toast.open || !this.showToastButtons_) { return }
        this.$.toast.hide();
        this.pageHandler_.restoreMostVisitedDefaults()
    }
    async onRemove_() {
        this.$.actionMenu.close();
        await this.tileRemove_(this.actionMenuTargetIndex_);
        this.actionMenuTargetIndex_ = -1
    }
    async onSave_() {
        let newUrl;
        try { newUrl = new URL(this.dialogTileUrl_.includes("://") ? this.dialogTileUrl_ : `https://${this.dialogTileUrl_}/`); if (!["http:", "https:"].includes(newUrl.protocol)) { throw new Error } } catch (e) { this.dialogTileUrlInvalid_ = true; return }
        this.dialogTileUrlInvalid_ = false;
        this.$.dialog.close();
        let newTitle = this.dialogTileTitle_.trim();
        if (newTitle.length === 0) { newTitle = this.dialogTileUrl_ }
        if (this.adding_) {
            const { success: success } = await this.pageHandler_.addMostVisitedTile({ url: newUrl.href }, newTitle);
            this.toast_(success ? "linkAddedMsg" : "linkCantCreate", success)
        } else {
            const { url: url, title: title } = this.tiles_[this.actionMenuTargetIndex_];
            if (url.url !== newUrl.href || title !== newTitle) {
                const { success: success } = await this.pageHandler_.updateMostVisitedTile(url, { url: newUrl.href }, newTitle);
                this.toast_(success ? "linkEditedMsg" : "linkCantEdit", success)
            }
            this.actionMenuTargetIndex_ = -1
        }
    }
    onTileActionButtonClick_(e) {
        e.preventDefault();
        const { index: index } = this.$.tiles.modelForElement(e.target.parentElement);
        this.actionMenuTargetIndex_ = index;
        this.$.actionMenu.showAt(e.target)
    }
    onTileRemoveButtonClick_(e) {
        e.preventDefault();
        const { index: index } = this.$.tiles.modelForElement(e.target.parentElement);
        this.tileRemove_(index)
    }
    onTileClick_(e) {
        if (e.defaultPrevented) { return }
        if (loadTimeData.getBoolean("handleMostVisitedNavigationExplicitly")) { e.preventDefault() }
        this.pageHandler_.onMostVisitedTileNavigation(this.$.tiles.itemForElement(e.target), this.$.tiles.indexForElement(e.target), e.button || 0, e.altKey, e.ctrlKey, e.metaKey, e.shiftKey)
    }
    onTileKeyDown_(e) {
        if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) { return }
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "Delete") { return }
        const { index: index } = this.$.tiles.modelForElement(e.target);
        if (e.key === "Delete") { this.tileRemove_(index); return }
        const advanceKey = this.isRtl_ ? "ArrowLeft" : "ArrowRight";
        const delta = e.key === advanceKey || e.key === "ArrowDown" ? 1 : -1;
        this.tileFocus_(Math.max(0, index + delta))
    }
    onUndoClick_() {
        if (!this.$.toast.open || !this.showToastButtons_) { return }
        this.$.toast.hide();
        this.pageHandler_.undoMostVisitedTileAction()
    }
    onTouchStart_(e) {
        if (this.reordering_) { return }
        const tileElement = e.composedPath().find((el => el.classList && el.classList.contains("tile")));
        if (!tileElement) { return }
        const { pageX: pageX, pageY: pageY } = e.changedTouches[0];
        this.dragStart_(tileElement, pageX, pageY);
        const touchMove = e => {
            const { pageX: pageX, pageY: pageY } = e.changedTouches[0];
            this.dragOver_(pageX, pageY)
        };
        const touchEnd = e => {
            this.ownerDocument.removeEventListener("touchmove", touchMove);
            tileElement.removeEventListener("touchend", touchEnd);
            tileElement.removeEventListener("touchcancel", touchEnd);
            const { pageX: pageX, pageY: pageY } = e.changedTouches[0];
            this.dragEnd_(pageX, pageY);
            this.reordering_ = false
        };
        this.ownerDocument.addEventListener("touchmove", touchMove);
        tileElement.addEventListener("touchend", touchEnd, { once: true });
        tileElement.addEventListener("touchcancel", touchEnd, { once: true })
    }
    tileFocus_(index) { if (index < 0) { return } const tileElements = this.tileElements_; if (index < tileElements.length) { tileElements[index].focus() } else if (this.showAdd_ && index === tileElements.length) { this.$.addShortcut.focus() } }
    toast_(msgId, showButtons) {
        this.toastContent_ = loadTimeData.getString(msgId);
        this.showToastButtons_ = showButtons;
        this.$.toast.show()
    }
    async tileRemove_(index) {
        const { url: url, isQueryTile: isQueryTile } = this.tiles_[index];
        this.pageHandler_.deleteMostVisitedTile(url);
        this.toast_("linkRemovedMsg", this.customLinksEnabled_ || !isQueryTile);
        this.tileFocus_(index)
    }
    updateScreenWidth_() { if (this.mediaListenerWideWidth_.matches) { this.screenWidth_ = ScreenWidth.WIDE } else if (this.mediaListenerMediumWidth_.matches) { this.screenWidth_ = ScreenWidth.MEDIUM } else { this.screenWidth_ = ScreenWidth.NARROW } }
    onTilesRendered_() {
        performance.measure("most-visited-rendered");
        this.pageHandler_.onMostVisitedTilesRendered(this.tiles_.slice(0, assert(this.maxVisibleTiles_)), BrowserProxy.getInstance().now())
    }
    booleanToString_(value) { return Boolean(value).toString() }
}
customElements.define(MostVisitedElement.is, MostVisitedElement); // Copyright 2020 The Chromium Authors. All rights reserved.
const RECOGNITION_CONFIDENCE_THRESHOLD = .5;
const QUERY_LENGTH_LIMIT = 120;
const IDLE_TIMEOUT_MS = 8e3;
const ERROR_TIMEOUT_SHORT_MS = 3e3;
const ERROR_TIMEOUT_LONG_MS = 8e3;
const VOLUME_ANIMATION_DURATION_MIN_MS = 170;
const VOLUME_ANIMATION_DURATION_RANGE_MS = 10;
const State = { UNINITIALIZED: -1, STARTED: 0, AUDIO_RECEIVED: 1, SPEECH_RECEIVED: 2, RESULT_RECEIVED: 3, ERROR_RECEIVED: 4, RESULT_FINAL: 5 };
const Error$1 = newTabPage.mojom.VoiceSearchError;

function toError(webkitError) {
    switch (webkitError) {
        case "aborted":
            return Error$1.kAborted;
        case "audio-capture":
            return Error$1.kAudioCapture;
        case "language-not-supported":
            return Error$1.kLanguageNotSupported;
        case "network":
            return Error$1.kNetwork;
        case "no-speech":
            return Error$1.kNoSpeech;
        case "not-allowed":
            return Error$1.kNotAllowed;
        case "service-not-allowed":
            return Error$1.kServiceNotAllowed;
        case "bad-grammar":
            return Error$1.kBadGrammar;
        default:
            return Error$1.kOther
    }
}

function getErrorTimeout(error) {
    switch (error) {
        case Error$1.kAudioCapture:
        case Error$1.kNoSpeech:
        case Error$1.kNotAllowed:
        case Error$1.kNoMatch:
            return ERROR_TIMEOUT_LONG_MS;
        default:
            return ERROR_TIMEOUT_SHORT_MS
    }
}
class VoiceSearchOverlayElement extends PolymerElement {
    static get is() { return "ntp-voice-search-overlay" }
    static get template() { return html `<!--css-build:shadow--><!--_html_template_start_--><style include="cr-icons" scope="ntp-voice-search-overlay">:host {
  --receiving-audio-color: var(--google-red-refresh-500);
    --speak-shown-duration: 2s;
}

.display-stack {
  display: grid;
}

.display-stack > * {
  grid-column-start: 1;
    grid-row-start: 1;
}

#dialog {
  align-items: center;
    background-color: var(--ntp-background-override-color);
    border: none;
    display: flex;
    height: 100%;
    justify-content: center;
    left: 0;
    margin: 0;
    max-height: initial;
    max-width: initial;
    padding: 0;
    top: 0;
    width: 100%;
}

#closeButton {
  --cr-icon-button-fill-color: var(--cr-secondary-text-color);
    margin: 0;
    position: absolute;
    top: 16px;
}

:host-context([dir='ltr']) #closeButton {
  right: 16px;
}

:host-context([dir='rtl']) #closeButton {
  left: 16px;
}

#content {
  align-items: center;
    display: flex;
    flex-direction: row;
    width: 660px;
}

#texts {
  color: var(--cr-secondary-text-color);
    flex-grow: 1;
    font-size: 32px;
    text-align: start;
}

*[text] {
  transition-delay: 200ms;
    transition-duration: 500ms;
    transition-property: opacity, padding-inline-start;
    transition-timing-function: ease-out;
    visibility: hidden;
    width: 100%;
}

*[text='waiting'], *[text='speak'] {
  opacity: 0;
    
    overflow-x: hidden;
    padding-inline-start: 50px;
}

*[text][visible] {
  opacity: 1;
    padding-inline-start: 0;
    visibility: visible;
}

*[text='speak'][visible] #speak {
  opacity: 0;
    transition: opacity 0ms var(--speak-shown-duration);
}

*[text='speak'] #listening {
  opacity: 0;
}

*[text='speak'][visible] #listening {
  opacity: 1;
    transition: opacity 750ms ease-out var(--speak-shown-duration);
}

#finalResult {
  color: var(--cr-primary-text-color);
}

#errors, #errorLinks {
  display: inline;
}

#errorLinks a {
  color: var(--cr-link-color);
    font-size: 18px;
    font-weight: 500;
    margin-inline-start: 0.25em;
    text-decoration: none;
}

#micContainer {
  --mic-button-size: 165px;
    --mic-container-size: 300px;
    align-items: center;
    flex-shrink: 0;
    height: var(--mic-container-size);
    justify-items: center;
    width: var(--mic-container-size);
}

#micVolume {
  --mic-volume-size: calc(var(--mic-button-size) +
        var(--mic-volume-level) * (var(--mic-container-size) -
            var(--mic-button-size)));
    align-items: center;
    background-color: var(--ntp-border-color);
    border-radius: 50%;
    display: flex;
    height: var(--mic-volume-size);
    justify-content: center;
    transition-duration: var(--mic-volume-duration);
    transition-property: height, width;
    transition-timing-function: ease-in-out;
    width: var(--mic-volume-size);
}

#micVolumeCutout {
  background-color: var(--ntp-background-override-color);
    border-radius: 50%;
    height: var(--mic-button-size);
    width: var(--mic-button-size);
}

#micButton {
  border-radius: 50%;
    height: var(--mic-button-size);
    transition: background-color 200ms ease-in-out;
    width: var(--mic-button-size);
}

.receiving #micButton {
  background-color: var(--receiving-audio-color);
    border-color: var(--receiving-audio-color);
}

#micIcon {
  -webkit-mask-image: url(icons/mic.svg);
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: 100%;
    background-color: var(--ntp-border-color);
    height: 80px;
    transition: background-color 200ms ease-in-out;
    width: 80px;
}

.listening #micIcon {
  background-color: var(--receiving-audio-color);
}

.receiving #micIcon {
  background-color: white;
}

</style>
<dialog id="dialog" on-close="onOverlayClose_" on-click="onOverlayClick_" on-keydown="onOverlayKeydown_">
  <!-- Purely exists to capture focus upon opening the dialog. -->
  <div tabindex="-1"></div>
  <cr-icon-button id="closeButton" class="icon-clear" title="關閉">
  </cr-icon-button>
  <div id="content">
    <iron-selector id="texts" selected="[[getText_(state_)]]" attr-for-selected="text" fallback-selection="none" aria-live="polite" selected-attribute="visible" class="display-stack">
      <div text="none"></div>
      <div text="waiting">等待中…</div>
      <div text="speak" class="display-stack">
        <div id="speak">請說話</div>
        <div id="listening">聽取中…</div>
      </div>
      <div text="result" aria-hidden="true">
        <span id="finalResult">[[finalResult_]]</span>
        <span>[[interimResult_]]</span>
      </div>
      <div text="error">
        <iron-pages id="errors" selected="[[getErrorText_(error_)]]" attr-for-selected="error" fallback-selection="other">
          <span error="no-speech">請檢查麥克風和音量。</span>
          <span error="audio-capture">請檢查麥克風。</span>
          <span error="network">沒有網際網路連線。</span>
          <span error="not-allowed">語音搜尋功能已停用。</span>
          <span error="language-not-supported">無法使用你的語言進行語音搜尋。</span>
          <span error="no-match">無法辨識語音內容。</span>
          <span error="other">未知的錯誤。</span>
        </iron-pages>
        <iron-pages id="errorLinks" selected="[[getErrorLink_(error_)]]" attr-for-selected="link" fallback-selection="none">
          <span link="none"></span>
          <a link="learn-more" target="_blank" href="[[helpUrl_]]" on-click="onLearnMoreClick_" on-keydown="onLinkKeydown_"><!--
            -->瞭解詳情
          </a>
          <a link="details" target="_blank" href="[[helpUrl_]]" on-keydown="onLinkKeydown_"><!--
            -->詳細資訊
          </a>
          <a link="try-again" id="retryLink" href="#" on-click="onTryAgainClick_" on-keydown="onLinkKeydown_"><!--
            -->再試一次
          </a>
        </iron-pages>
      </div>
    </iron-selector>
    <div id="micContainer" class$="[[getMicClass_(state_)]] display-stack">
      <div id="micVolume" style="--mic-volume-level: [[micVolumeLevel_]];
                --mic-volume-duration: [[micVolumeDuration_]]ms;">
        <div id="micVolumeCutout">
        </div>
      </div>
      <cr-button id="micButton" on-click="onMicClick_">
        <div id="micIcon"></div>
      </cr-button>
    </div>
  </div>
</dialog>
<!--_html_template_end_-->` }
    static get properties() { return { interimResult_: String, finalResult_: String, state_: { type: Number, value: State.UNINITIALIZED }, error_: Number, helpUrl_: { type: String, readOnly: true, value: `https://support.google.com/chrome/?` + `p=ui_voice_search&hl=${window.navigator.language}` }, micVolumeLevel_: { type: Number, value: 0 }, micVolumeDuration_: { type: Number, value: VOLUME_ANIMATION_DURATION_MIN_MS } } }
    constructor() {
        super();
        this.pageHandler_ = BrowserProxy.getInstance().handler;
        this.voiceRecognition_ = new webkitSpeechRecognition;
        this.voiceRecognition_.continuous = false;
        this.voiceRecognition_.interimResults = true;
        this.voiceRecognition_.lang = window.navigator.language;
        this.voiceRecognition_.onaudiostart = this.onAudioStart_.bind(this);
        this.voiceRecognition_.onspeechstart = this.onSpeechStart_.bind(this);
        this.voiceRecognition_.onresult = this.onResult_.bind(this);
        this.voiceRecognition_.onend = this.onEnd_.bind(this);
        this.voiceRecognition_.onerror = e => { this.onError_(toError(e.error)) };
        this.voiceRecognition_.onnomatch = () => { this.onError_(Error$1.kNoMatch) };
        this.timerId_ = undefined
    }
    connectedCallback() {
        super.connectedCallback();
        this.$.dialog.showModal();
        this.start()
    }
    start() {
        this.voiceRecognition_.start();
        this.state_ = State.STARTED;
        this.resetIdleTimer_()
    }
    onOverlayClose_() {
        this.voiceRecognition_.abort();
        this.dispatchEvent(new Event("close"))
    }
    onOverlayClick_() {
        this.$.dialog.close();
        this.pageHandler_.onVoiceSearchAction(newTabPage.mojom.VoiceSearchAction.kCloseOverlay)
    }
    onOverlayKeydown_(e) { if (["Enter", " "].includes(e.key) && this.finalResult_) { this.onFinalResult_() } else if (e.key === "Escape") { this.onOverlayClick_() } }
    onLinkKeydown_(e) {
        if (!["Enter", " "].includes(e.key)) { return }
        e.stopPropagation();
        e.preventDefault();
        e.target.click()
    }
    onLearnMoreClick_() { this.pageHandler_.onVoiceSearchAction(newTabPage.mojom.VoiceSearchAction.kSupportLinkClicked) }
    onTryAgainClick_(e) {
        e.stopPropagation();
        this.start();
        this.pageHandler_.onVoiceSearchAction(newTabPage.mojom.VoiceSearchAction.kTryAgainLink)
    }
    onMicClick_(e) {
        if (this.state_ !== State.ERROR_RECEIVED || this.error_ !== Error$1.kNoMatch) { return }
        e.stopPropagation();
        this.start();
        this.pageHandler_.onVoiceSearchAction(newTabPage.mojom.VoiceSearchAction.kTryAgainMicButton)
    }
    resetIdleTimer_() {
        BrowserProxy.getInstance().clearTimeout(this.timerId_);
        this.timerId_ = BrowserProxy.getInstance().setTimeout(this.onIdleTimeout_.bind(this), IDLE_TIMEOUT_MS)
    }
    onIdleTimeout_() {
        if (this.state_ === State.RESULT_FINAL) { return }
        if (this.finalResult_) { this.onFinalResult_(); return }
        this.voiceRecognition_.abort();
        this.onError_(Error$1.kNoMatch)
    }
    resetErrorTimer_(duration) {
        BrowserProxy.getInstance().clearTimeout(this.timerId_);
        this.timerId_ = BrowserProxy.getInstance().setTimeout((() => { this.$.dialog.close() }), duration)
    }
    onAudioStart_() {
        this.resetIdleTimer_();
        this.state_ = State.AUDIO_RECEIVED
    }
    onSpeechStart_() {
        this.resetIdleTimer_();
        this.state_ = State.SPEECH_RECEIVED;
        this.animateVolume_()
    }
    onResult_(e) {
        this.resetIdleTimer_();
        switch (this.state_) {
            case State.STARTED:
                this.onAudioStart_();
                this.onSpeechStart_();
                break;
            case State.AUDIO_RECEIVED:
                this.onSpeechStart_();
                break;
            case State.SPEECH_RECEIVED:
            case State.RESULT_RECEIVED:
                break;
            default:
                return
        }
        const results = e.results;
        if (results.length === 0) { return }
        this.state_ = State.RESULT_RECEIVED;
        this.interimResult_ = "";
        this.finalResult_ = "";
        const finalResult = results[e.resultIndex];
        if (finalResult.isFinal) {
            this.finalResult_ = finalResult[0].transcript;
            this.onFinalResult_();
            return
        }
        for (let j = 0; j < results.length; j++) { const result = results[j][0]; if (result.confidence > RECOGNITION_CONFIDENCE_THRESHOLD) { this.finalResult_ += result.transcript } else { this.interimResult_ += result.transcript } }
        if (this.interimResult_.length > QUERY_LENGTH_LIMIT) { this.onFinalResult_() }
    }
    onFinalResult_() {
        if (!this.finalResult_) { this.onError_(Error$1.kNoMatch); return }
        this.state_ = State.RESULT_FINAL;
        const searchParams = new URLSearchParams;
        searchParams.append("q", this.finalResult_);
        searchParams.append("gs_ivs", "1");
        const queryUrl = new URL("/search", loadTimeData.getString("googleBaseUrl"));
        queryUrl.search = searchParams.toString();
        this.pageHandler_.onVoiceSearchAction(newTabPage.mojom.VoiceSearchAction.kQuerySubmitted);
        BrowserProxy.getInstance().navigate(queryUrl.href)
    }
    onEnd_() {
        switch (this.state_) {
            case State.STARTED:
                this.onError_(Error$1.kAudioCapture);
                return;
            case State.AUDIO_RECEIVED:
                this.onError_(Error$1.kNoSpeech);
                return;
            case State.SPEECH_RECEIVED:
            case State.RESULT_RECEIVED:
                this.onError_(Error$1.kNoMatch);
                return;
            case State.ERROR_RECEIVED:
            case State.RESULT_FINAL:
                return;
            default:
                this.onError_(Error$1.kOther);
                return
        }
    }
    onError_(error) {
        this.pageHandler_.onVoiceSearchError(error);
        if (error === Error$1.kAborted) { return }
        this.error_ = error;
        this.state_ = State.ERROR_RECEIVED;
        this.resetErrorTimer_(getErrorTimeout(error))
    }
    animateVolume_() {
        this.micVolumeLevel_ = 0;
        this.micVolumeDuration_ = VOLUME_ANIMATION_DURATION_MIN_MS;
        if (this.state_ !== State.SPEECH_RECEIVED && this.state_ !== State.RESULT_RECEIVED) { return }
        this.micVolumeLevel_ = BrowserProxy.getInstance().random();
        this.micVolumeDuration_ = Math.round(VOLUME_ANIMATION_DURATION_MIN_MS + BrowserProxy.getInstance().random() * VOLUME_ANIMATION_DURATION_RANGE_MS);
        BrowserProxy.getInstance().setTimeout(this.animateVolume_.bind(this), this.micVolumeDuration_)
    }
    getText_() {
        switch (this.state_) {
            case State.STARTED:
                return "waiting";
            case State.AUDIO_RECEIVED:
            case State.SPEECH_RECEIVED:
                return "speak";
            case State.RESULT_RECEIVED:
            case State.RESULT_FINAL:
                return "result";
            case State.ERROR_RECEIVED:
                return "error";
            default:
                return "none"
        }
    }
    getErrorText_() {
        switch (this.error_) {
            case Error$1.kNoSpeech:
                return "no-speech";
            case Error$1.kAudioCapture:
                return "audio-capture";
            case Error$1.kNetwork:
                return "network";
            case Error$1.kNotAllowed:
            case Error$1.kServiceNotAllowed:
                return "not-allowed";
            case Error$1.kLanguageNotSupported:
                return "language-not-supported";
            case Error$1.kNoMatch:
                return "no-match";
            case Error$1.kAborted:
            case Error$1.kOther:
            default:
                return "other"
        }
    }
    getErrorLink_() {
        switch (this.error_) {
            case Error$1.kNoSpeech:
            case Error$1.kAudioCapture:
                return "learn-more";
            case Error$1.kNotAllowed:
            case Error$1.kServiceNotAllowed:
                return "details";
            case Error$1.kNoMatch:
                return "try-again";
            default:
                return "none"
        }
    }
    getMicClass_() {
        switch (this.state_) {
            case State.AUDIO_RECEIVED:
                return "listening";
            case State.SPEECH_RECEIVED:
            case State.RESULT_RECEIVED:
                return "receiving";
            default:
                return ""
        }
    }
}
customElements.define(VoiceSearchOverlayElement.is, VoiceSearchOverlayElement);
