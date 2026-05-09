import React, { createContext, useContext, useEffect } from 'react';

export interface HeadTag {
  tagName: 'title' | 'meta' | 'link' | 'script';
  key: string;
  attrs?: Record<string, string | number | boolean | undefined>;
  innerHTML?: string;
  textContent?: string;
}

export interface HeadManager {
  upsert: (tag: HeadTag) => void;
  getTags: () => HeadTag[];
}

export const HeadContext = createContext<HeadManager | null>(null);

export function createHeadManager(): HeadManager {
  const tags = new Map<string, HeadTag>();

  return {
    upsert(tag) {
      tags.set(tag.key, tag);
    },
    getTags() {
      return Array.from(tags.values());
    }
  };
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const escapeAttribute = (value: string | number | boolean): string => escapeHtml(String(value));
const escapeScriptContent = (value: string): string => value.replaceAll('<', '\\u003c');

const renderAttrs = (tag: HeadTag): string => {
  const attrs = { ...(tag.attrs ?? {}), 'data-av-head': tag.key };
  const entries = Object.entries(attrs) as Array<[string, string | number | boolean | undefined]>;

  return entries
    .flatMap(([name, value]) => {
      if (value === undefined || value === false) return [];
      return [value === true ? name : `${name}="${escapeAttribute(value)}"`];
    })
    .join(' ');
};

export const renderHeadTags = (tags: HeadTag[]): string =>
  tags
    .map((tag) => {
      const attrs = renderAttrs(tag);
      if (tag.tagName === 'title') {
        return `<title ${attrs}>${escapeHtml(tag.textContent ?? '')}</title>`;
      }
      if (tag.tagName === 'script') {
        return `<script ${attrs}>${escapeScriptContent(tag.innerHTML ?? '')}</script>`;
      }
      return `<${tag.tagName} ${attrs}>`;
    })
    .join('\n');

const applyHeadTag = (tag: HeadTag): HTMLElement => {
  const existing = document.head.querySelector<HTMLElement>(`[data-av-head="${tag.key}"]`);
  const element = existing && existing.tagName.toLowerCase() === tag.tagName
    ? existing
    : document.createElement(tag.tagName);

  if (existing && existing !== element) {
    existing.remove();
  }

  for (const attribute of Array.from(element.attributes)) {
    if (attribute.name !== 'data-av-head') element.removeAttribute(attribute.name);
  }

  element.setAttribute('data-av-head', tag.key);

  for (const [name, value] of Object.entries(tag.attrs ?? {})) {
    if (value === undefined || value === false) {
      continue;
    }
    if (value === true) {
      element.setAttribute(name, '');
      continue;
    }
    element.setAttribute(name, String(value));
  }

  if (tag.tagName === 'title') {
    element.textContent = tag.textContent ?? '';
  } else if (tag.tagName === 'script') {
    element.innerHTML = escapeScriptContent(tag.innerHTML ?? '');
  } else {
    element.textContent = '';
  }

  if (!element.parentElement) {
    document.head.appendChild(element);
  }

  return element;
};

export const useHeadTags = (tags: HeadTag[]): null => {
  const manager = useContext(HeadContext);
  const serializedTags = JSON.stringify(tags);

  if (manager) {
    for (const tag of tags) {
      manager.upsert(tag);
    }
  }

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const elements = tags.map(applyHeadTag);

    return () => {
      for (const element of elements) {
        if (element.isConnected) {
          element.remove();
        }
      }
    };
  }, [serializedTags]);

  return null;
};
