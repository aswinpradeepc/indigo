(function(exports) {
  "use strict";

  if (!exports.Indigo) exports.Indigo = {};
  Indigo = exports.Indigo;
  if (!Indigo.traditions) Indigo.traditions = {};

  Indigo.traditions.get = function(country) {
    return Indigo.traditions[country] || Indigo.traditions.default;
  };

  Indigo.Tradition = function(settings) {
    this.settings = settings;
    this.initialize.apply(this, arguments);
  };

  // Recursively copies properties from source to target
  function deepMerge(target, source) {
    if (_.isObject(source)) {
      for (var prop in source) {
        if (!(prop in target)) {
          target[prop] = source[prop];
        } else {
          deepMerge(target[prop], source[prop]);
        }
      }
    }
  }

  _.extend(Indigo.Tradition.prototype, {
    initialize: function() {
      if (Indigo.traditions.default) {
        // pull in missing settings from the default tradition
        deepMerge(this.settings, Indigo.traditions.default.settings);
      }
    },

    // Should this XML node be included in the table of contents?
    // By default, checks if the name of the node is in the +elements+ object.
    is_toc_element: function(node) {
      return !!this.settings.toc.elements[node.localName];
    },

    // Should we stop recursing into this node?
    is_toc_deadend: function(node) {
      return !!this.settings.toc.deadends[node.localName];
    },

    toc_element_title: function(item) {
      return (
        this.settings.toc.titles[item.type] ||
        Indigo.traditions.default.settings.toc.titles[item.type] ||
        this.settings.toc.titles.default ||
        Indigo.traditions.default.settings.toc.titles.default
      )(item);
    },

    /* The grammar rule/fragment used to parse text for this element. */
    grammarRule: function(element) {
      var fragment = element.tagName;
      fragment = this.settings.grammar.fragments[fragment] || fragment;

      // handle parts in chapters, and chapters in parts
      if (fragment == 'parts' && $(element).closest('chapter').length > 0) return 'parts_no_chapters';
      if (fragment == 'chapters' && $(element).closest('part').length > 0) return 'chapters_no_parts';

      return fragment;
    }
  });

  // Base
  Indigo.traditions.default = new Indigo.Tradition({
    country: null,
    grammar: {
      name: 'bluebell',
      fragments: {
        alinea: 'hier_element_block',
        article: 'hier_element_block',
        blockContainer: 'blocks',
        book: 'hier_element_block',
        chapter: 'hier_element_block',
        clause: 'hier_element_block',
        division: 'hier_element_block',
        indent: 'hier_element_block',
        level: 'hier_element_block',
        list: 'hier_element_block',
        paragraph: 'hier_element_block',
        part: 'hier_element_block',
        point: 'hier_element_block',
        proviso: 'hier_element_block',
        rule: 'hier_element_block',
        section: 'hier_element_block',
        subchapter: 'hier_element_block',
        subclause: 'hier_element_block',
        subdivision: 'hier_element_block',
        sublist: 'hier_element_block',
        subparagraph: 'hier_element_block',
        subpart: 'hier_element_block',
        subrule: 'hier_element_block',
        subsection: 'hier_element_block',
        subtitle: 'hier_element_block',
        title: 'hier_element_block',
        tome: 'hier_element_block',
        transitional: 'hier_element_block',
        attachment: 'attachment',
        attachments: 'attachments',
        item: 'block_list_item',
        debateSection: 'speech_container',
        speech: 'speech_group',
      },
      quickEditable: '.akn-alinea, .akn-article, .akn-attachment, .akn-attachments, .akn-blockContainer, .akn-book, .akn-chapter,' +
          ' .akn-clause, .akn-division, .akn-indent, .akn-item, .akn-level, .akn-list, .akn-paragraph, .akn-part,' +
          ' .akn-point, .akn-proviso, .akn-rule, .akn-section, .akn-subchapter, .akn-subclause, .akn-subdivision,' +
          ' .akn-sublist, .akn-subparagraph, .akn-subpart, .akn-subrule, .akn-subsection, .akn-subtitle, .akn-title,' +
          ' .akn-tome, .akn-transitional, .akn-debateSection, .akn-speech',
    },
    // list of names of linter functions applicable to this location
    linters: [],
    // CSS selector for elements that can hold annotations
    annotatable: ".akn-coverPage, .akn-preface, .akn-preamble, .akn-conclusions, " +
                 ".akn-chapter, .akn-part, .akn-section, .akn-subsection, .akn-blockList, .akn-heading, " +
                 ".akn-article, .akn-paragraph, .akn-subheading, .akn-item, table",
    toc: {
      elements: {
        akomaNtoso: 1,
        alinea: 1,
        article: 1,
        attachment: 1,
        attachments: 1,
        book: 1,
        chapter: 1,
        clause: 1,
        conclusions: 1,
        coverpage: 1,
        division: 1,
        indent: 1,
        level: 1,
        list: 1,
        paragraph: 1,
        part: 1,
        point: 1,
        preamble: 1,
        preface: 1,
        proviso: 1,
        rule: 1,
        section: 1,
        subchapter: 1,
        subclause: 1,
        subdivision: 1,
        sublist: 1,
        subparagraph: 1,
        subpart: 1,
        subrule: 1,
        subsection: 1,
        subtitle: 1,
        title: 1,
        tome: 1,
        transitional: 1,
        debateSection: 1,
      },
      // elements we exclude from the TOC because they contain sub-documents or subflows
      deadends: {
        meta: 1,
        embeddedStructure: 1,
        quotedStructure: 1,
        subFlow: 1,
      },
      // TODO: support translation for titles
      titles: {
        default     : function(i) { return i.num + " " + i.heading; },
        akomaNtoso  : function(i) { return $t("Entire document"); },
        chapter     : function(i) { return "Ch. " + i.num + " – " + i.heading; },
        conclusions : function(i) { return $t("Conclusions"); },
        coverpage   : function(i) { return $t("Coverpage"); },
        part        : function(i) {
                                    if (i.heading) {
                                      return $t("Part ") + i.num + " – " + i.heading;
                                    } else {
                                      return $t("Part ") + i.num;
                                    }
        },
        subpart     : function(i) { return (i.num ? i.num + " – " : '') + i.heading; },
        preamble    : function(i) { return $t("Preamble"); },
        preface     : function(i) { return $t("Preface"); },
        attachments  : function(i) { return $t("Schedules"); },
        attachment   : function(i) {
          if (i.heading) {
            return i.heading;
          }

          // try attachment title
          var meta = i.element.querySelector('meta');
          var alias = meta.querySelector('FRBRWork FRBRalias');
          if (alias) {
            return alias.getAttribute('value');
          }

          // otherwise fall back to the doc name
          var name = meta.parentElement.getAttribute('name') || '(untitled)';
          return name.slice(0, 1).toLocaleUpperCase() + name.slice(1);
        },
        debateSection: function(i) {
          return (i.num || i.heading ? i.num + (i.num && i.heading ? " – " : '') + i.heading : $t('Debate section'));
        },
        article      : function(i) {
          return "Art. " + i.num + (i.heading ? " – " + i.heading : '');
        },
        rule      : function(i) {
          return "R. " + i.num + (i.heading ? " – " + i.heading : '');
        },
        title      : function(i) {
          return "T. " + i.num + (i.heading ? " – " + i.heading : '');
        },
      },
    },
  });

})(window);
