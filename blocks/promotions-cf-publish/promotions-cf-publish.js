/*
 * Promotions (Content Fragments - Publish)
 * Ported from the NiSource-demo Fragment block's DAM-CF persisted-query pattern
 * (https://github.com/Adobe-DevX/NiSource-demo/blob/main/blocks/fragment/fragment.js),
 * adapted for a list query (Robinson/promotions-list) instead of a by-path single item,
 * and simplified to the publish-tier path only: direct anonymous GET, or a POST wrapper
 * when one is configured (to route around CORS via a server-to-server proxy).
 */
import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders, isAuthorEnvironment } from '../../scripts/eds-support.js';

const CF_GRAPHQL_PATH_DEFAULT = 'Robinson/promotions-list';
const CF_JSON_HEADERS = { 'Content-Type': 'application/json' };

/** @param {Record<string, string>} ph */
function resolveConfig(block, ph) {
  const [aemHostDiv, graphqlQueryPathDiv, wrapperUrlDiv] = block.children;
  const t = (v) => (v != null ? String(v).trim() : '');
  const first = (...candidates) => t(candidates.find((c) => t(c)) ?? '');

  return {
    aemHost: first(
      aemHostDiv?.textContent,
      ph?.publishUrl,
      getMetadata('publishurl'),
      getMetadata('publish-url'),
    ).replace(/\/$/, ''),
    graphqlQueryPath: first(
      graphqlQueryPathDiv?.textContent,
      ph?.cfGraphqlPath,
      getMetadata('cf-graphql-path'),
      CF_GRAPHQL_PATH_DEFAULT,
    ),
    wrapperUrl: first(wrapperUrlDiv?.textContent, ph?.cfWrapperUrl, getMetadata('cf-wrapper-url')),
  };
}

function persistedQueryUrl(aemHost, graphqlQueryPath) {
  const path = graphqlQueryPath.startsWith('/') ? graphqlQueryPath : `/${graphqlQueryPath}`;
  return `${aemHost}${path.startsWith('/graphql/execute.json/') ? path : `/graphql/execute.json/${graphqlQueryPath}`}?ts=${Date.now()}`;
}

/**
 * @returns {{ url: string, method: string, headers: Record<string, string>, body?: string }}
 */
function buildRequest({ aemHost, graphqlQueryPath, wrapperUrl }) {
  if (wrapperUrl) {
    return {
      url: wrapperUrl,
      method: 'POST',
      headers: CF_JSON_HEADERS,
      body: JSON.stringify({ graphQLPath: `${aemHost}/graphql/execute.json/${graphqlQueryPath}` }),
    };
  }
  return {
    url: persistedQueryUrl(aemHost, graphqlQueryPath),
    method: 'GET',
    headers: CF_JSON_HEADERS,
  };
}

function trimBlurb(text, maxLength = 160) {
  const trimmed = text.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

function buildCard(item, aemHost) {
  const li = document.createElement('li');
  li.className = 'promotions-card';

  const link = document.createElement('div');
  link.className = 'promotions-card-link';

  // GraphQL's Content Fragment schema names these fields with a leading underscore
  // eslint-disable-next-line no-underscore-dangle
  const imagePath = item.featuredImage?._dynamicUrl || item.featuredImage?._path;
  if (imagePath) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'promotions-card-image';
    const imageUrl = imagePath.startsWith('/') ? `${aemHost}${imagePath}` : imagePath;
    const optimizedPic = createOptimizedPicture(imageUrl, item.title || '', false, [{ width: '750' }]);
    imageWrapper.append(optimizedPic);
    link.append(imageWrapper);
  }

  const body = document.createElement('div');
  body.className = 'promotions-card-body';
  if (item.title) {
    const titleEl = document.createElement('p');
    titleEl.className = 'promotions-card-title';
    titleEl.textContent = item.title;
    body.append(titleEl);
  }
  if (item.main?.plaintext) {
    const descriptionEl = document.createElement('p');
    descriptionEl.className = 'promotions-card-description';
    descriptionEl.textContent = trimBlurb(item.main.plaintext);
    body.append(descriptionEl);
  }
  link.append(body);
  li.append(link);
  return li;
}

/** @param {Element} root */
function stripBlockInstrumentation(root) {
  const stripAttrs = (el) => {
    [...el.attributes].forEach(({ name }) => {
      if (name.startsWith('data-aue-') || name.startsWith('data-richtext-')) {
        el.removeAttribute(name);
      }
    });
  };
  stripAttrs(root);
  root.querySelectorAll('*').forEach(stripAttrs);
}

/**
 * loads and decorates the promotions-cf-publish block: fetches its cards from a public
 * GraphQL persisted query on the publish/delivery tier — either a direct anonymous GET,
 * or a POST through a configured proxy wrapper (to route around CORS server-side)
 * @param {Element} block The promotions-cf-publish block element
 */
export default async function decorate(block) {
  const ph = await fetchPlaceholders();
  const config = resolveConfig(block, ph);

  block.classList.add('promotions');
  const ul = document.createElement('ul');
  block.replaceChildren(ul);

  if (!config.aemHost || !config.graphqlQueryPath) return;

  let items = [];
  try {
    const req = buildRequest(config);
    const res = await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      ...(req.body && { body: req.body }),
    });
    if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    items = Object.values(json?.data || {})[0]?.items || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('promotions-cf-publish: failed to load GraphQL data', error);
    return;
  }

  items.forEach((item) => ul.append(buildCard(item, config.aemHost)));
  if (!isAuthorEnvironment()) stripBlockInstrumentation(block);
}
