import { components, vueComponents } from './components';
import '@lawsafrica/law-widgets/dist/components/la-akoma-ntoso';
import '@lawsafrica/law-widgets/dist/components/la-gutter';
import '@lawsafrica/law-widgets/dist/components/la-gutter-item';
import '@lawsafrica/law-widgets/dist/components/la-table-of-contents-controller';
import '@lawsafrica/law-widgets/dist/components/la-decorate-external-refs';
import '@lawsafrica/law-widgets/dist/components/la-decorate-internal-refs';
import '@lawsafrica/law-widgets/dist/components/la-decorate-terms';
import './compat-imports';
import { relativeTimestamps } from './timestamps';
import htmx from 'htmx.org';
import { createComponent, getVue, registerComponents } from './vue';
import i18next from 'i18next';
import HttpApi from 'i18next-http-backend';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

window.tippy = tippy;

class IndigoApp {
  setup () {
    this.components = [];
    this.componentLibrary = {};
    this.Vue = getVue();
    this.setupI18n();
    this.setupHtmx();

    for (const [name, component] of Object.entries(components)) {
      this.componentLibrary[name] = component;
    }

    registerComponents(vueComponents);
    window.dispatchEvent(new Event('indigo.vue-components-registered'));

    this.createComponents(document.body);
    this.createVueComponents(document.body);
    this.disableWith();
    window.dispatchEvent(new Event('indigo.components-created'));
  }

  setupI18n () {
    const opts = window.Indigo.i18n;
    opts.backend = {};
    opts.backend.loadPath = function (languages, namespaces) {
      return opts.loadPaths[namespaces[0] + '-' + languages[0]];
    };
    i18next.use(HttpApi).init(opts);
    // setup a global translation function
    window.$t = i18next.t.bind(i18next);
  }

  setupHtmx () {
    window.htmx = htmx;
    document.body.addEventListener('htmx:configRequest', (e) => {
      e.detail.headers['X-CSRFToken'] = window.Indigo.csrfToken;
    });
    document.body.addEventListener('htmx:beforeRequest', (e) => {
      window.Indigo.progressView.push();
    });
    document.body.addEventListener('htmx:afterRequest', (e) => {
      window.Indigo.progressView.pop();
    });
    // htmx:load is fired both when the page loads (weird) and when new content is loaded. We only care about the latter
    // case. See https://github.com/bigskysoftware/htmx/issues/1500
    const htmxHelper = { firstLoad: true };
    document.body.addEventListener('htmx:load', (e) => {
      if (htmxHelper.firstLoad) {
        htmxHelper.firstLoad = false;
        return;
      }
      // mount components on new elements
      this.createComponents(e.target);
      this.createVueComponents(e.target);
      relativeTimestamps(e.target);
      $('.selectpicker').selectpicker();
    });
    document.body.addEventListener('hx-messages', (e) => {
      e.detail.value.forEach(this.createToast);
    });
  }

  createToast (message) {
    // Clone the template
    const element = htmx.find('[data-toast-template]').cloneNode(true);

    // Remove the data-toast-template attribute
    delete element.dataset.toastTemplate;

    // Set the CSS class
    element.className += ' ' + message.tags;

    // Set the text
    htmx.find(element, '[data-toast-body]').innerText = message.message;

    // Add the new element to the container
    htmx.find('[data-toast-container]').appendChild(element);

    // Show the toast using Bootstrap's API
    // @ts-ignore
    const toast = new window.bootstrap.Toast(element, { delay: 5000 });
    toast.show();
  }

  createComponents (root) {
    // create components
    // check the root directly
    if (root.getAttribute('data-component')) {
      this.createComponent(root);
    }
    for (const element of root.querySelectorAll('[data-component]')) {
      this.createComponent(element);
    }
  }

  createComponent (element) {
    const name = element.getAttribute('data-component');

    if (this.componentLibrary[name] && !element.component) {
      // create the component and attach it to the HTML element
      this.components.push(element.component = new this.componentLibrary[name](element));
    }
  }

  /**
   * Create Vue-based components on this root and its descendants.
   * @param root
   */
  createVueComponents (root) {
    // create vue-based components
    for (const element of root.querySelectorAll('[data-vue-component]')) {
      this.createVueComponent(element);
    }
  }

  createVueComponent (element) {
    const name = element.getAttribute('data-vue-component');

    if (this.Vue.options.components[name] && !element.component) {
      // create the component and attach it to the HTML element
      const vue = createComponent(name, { el: element, propsData: element.dataset });
      vue.$el.component = vue;
      this.components.push(vue);
    }
  }

  /** When a form is submitted, find elements that have data-disabled-with and disable them
   * and change their text to the value of data-disabled-with.
   */
  disableWith () {
    document.addEventListener('submit', (e) => {
      // we iterate over elements rather than use querySelector, because buttons may be outside the form
      // and link to it with their form attribute.
      for (const el of e.target.elements) {
        if (el.hasAttribute('data-disable-with')) {
          el.textContent = el.getAttribute('data-disable-with');
          el.removeAttribute('data-disable-with');
          // do this asynchronously, so that the form is submitted with the button value, if any
          setTimeout(() => {
            el.disabled = true;
          }, 10);
        }
      }
    });
  }
}

export default new IndigoApp();
